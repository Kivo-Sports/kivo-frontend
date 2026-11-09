"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** API nativa (Chrome Android, Edge, Chrome macOS). Não existe no lib.dom do TypeScript. */
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
interface BarcodeDetectorConstructor {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
}

type Decodificador = (video: HTMLVideoElement) => Promise<string | null>;

export type CameraStatus = "idle" | "starting" | "scanning" | "error";

export interface UseQrScannerOptions {
  /** Chamado a cada QR Code lido enquanto não estiver pausado. */
  onDecode: (texto: string) => void;
  /** Mantém a câmera ligada, mas para de ler (ex.: enquanto o resultado está na tela). */
  paused?: boolean;
  /** Liga a câmera ao montar (padrão: só quando chamar iniciar()). */
  autoStart?: boolean;
}

const INTERVALO_LEITURA_MS = 150;
const LARGURA_MAX_DECODIFICACAO = 720;

async function criarDecodificador(): Promise<Decodificador> {
  const Nativo = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (Nativo) {
    try {
      const formatos = await Nativo.getSupportedFormats();
      if (formatos.includes("qr_code")) {
        const detector = new Nativo({ formats: ["qr_code"] });
        return async (video) => {
          const [codigo] = await detector.detect(video);
          return codigo?.rawValue ?? null;
        };
      }
    } catch {
      // cai para o jsQR
    }
  }

  // Safari/iOS e Chrome desktop no Windows não têm BarcodeDetector: decodifica os quadros no canvas
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    if (!ctx || !video.videoWidth) return null;
    const escala = Math.min(1, LARGURA_MAX_DECODIFICACAO / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * escala);
    canvas.height = Math.round(video.videoHeight * escala);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imagem = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return (
      jsQR(imagem.data, imagem.width, imagem.height, { inversionAttempts: "dontInvert" })?.data ??
      null
    );
  };
}

function mensagemErroCamera(error: unknown): string {
  const nome = error instanceof DOMException ? error.name : "";
  if (nome === "NotAllowedError" || nome === "SecurityError")
    return "Permissão da câmera negada. Libere o acesso à câmera nas configurações do navegador e tente de novo.";
  if (nome === "NotFoundError" || nome === "OverconstrainedError")
    return "Nenhuma câmera encontrada neste dispositivo.";
  if (nome === "NotReadableError")
    return "A câmera está sendo usada por outro aplicativo. Feche-o e tente de novo.";
  return "Não foi possível abrir a câmera.";
}

function anexarStream(video: HTMLVideoElement, stream: MediaStream) {
  if (video.srcObject === stream) return;
  video.srcObject = stream;
  video.setAttribute("playsinline", "true");
  video.muted = true;
  video.play().catch(() => undefined);
}

/**
 * Liga a câmera e lê QR Codes continuamente. Devolve um `videoRef` (callback ref) para o
 * <video>: se o elemento for remontado (ex.: abrir em tela cheia), o stream é religado nele.
 * Usa o BarcodeDetector nativo quando existe e o jsQR como alternativa.
 */
export function useQrScanner({ onDecode, paused = false, autoStart = false }: UseQrScannerOptions) {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraAtual, setCameraAtual] = useState<string | null>(null);
  const [lanternaDisponivel, setLanternaDisponivel] = useState(false);
  const [lanternaLigada, setLanternaLigada] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const execucaoRef = useRef(0);
  const pausedRef = useRef(paused);
  const onDecodeRef = useRef(onDecode);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  const pararStream = useCallback(() => {
    execucaoRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoElRef.current) videoElRef.current.srcObject = null;
    setLanternaLigada(false);
    setLanternaDisponivel(false);
  }, []);

  const videoRef = useCallback((video: HTMLVideoElement | null) => {
    videoElRef.current = video;
    if (video && streamRef.current) anexarStream(video, streamRef.current);
  }, []);

  const iniciar = useCallback(
    async (deviceId?: string) => {
      pararStream();
      const execucao = execucaoRef.current;
      setErro(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErro(
          window.isSecureContext
            ? "Este navegador não permite acesso à câmera."
            : "A câmera só funciona em conexão segura (https). Abra o Kivo pelo endereço oficial ou digite o código.",
        );
        return;
      }

      setStatus("starting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
        });
        if (execucao !== execucaoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoElRef.current) anexarStream(videoElRef.current, stream);

        const track = stream.getVideoTracks()[0];
        setCameraAtual(track?.getSettings().deviceId ?? null);
        const capacidades = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
          torch?: boolean;
        };
        setLanternaDisponivel(Boolean(capacidades.torch));

        // Só depois da permissão os rótulos e ids das câmeras ficam disponíveis
        navigator.mediaDevices
          .enumerateDevices()
          .then((dispositivos) => setCameras(dispositivos.filter((d) => d.kind === "videoinput")))
          .catch(() => undefined);

        const decodificar = await criarDecodificador();
        if (execucao !== execucaoRef.current) return;
        setStatus("scanning");

        const ler = async () => {
          if (execucao !== execucaoRef.current) return;
          const v = videoElRef.current;
          if (!pausedRef.current && v && v.readyState >= v.HAVE_CURRENT_DATA) {
            try {
              const texto = await decodificar(v);
              if (texto && execucao === execucaoRef.current && !pausedRef.current)
                onDecodeRef.current(texto);
            } catch {
              // quadro ruim: tenta no próximo
            }
          }
          if (execucao === execucaoRef.current)
            timerRef.current = setTimeout(ler, INTERVALO_LEITURA_MS);
        };
        ler();
      } catch (error) {
        if (execucao !== execucaoRef.current) return;
        setStatus("error");
        setErro(mensagemErroCamera(error));
      }
    },
    [pararStream],
  );

  const parar = useCallback(() => {
    pararStream();
    setStatus("idle");
    setErro(null);
  }, [pararStream]);

  const trocarCamera = useCallback(() => {
    if (cameras.length < 2) return;
    const indice = cameras.findIndex((c) => c.deviceId === cameraAtual);
    const proxima = cameras[(indice + 1) % cameras.length];
    iniciar(proxima.deviceId);
  }, [cameras, cameraAtual, iniciar]);

  const alternarLanterna = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const ligar = !lanternaLigada;
    try {
      await track.applyConstraints({ advanced: [{ torch: ligar } as MediaTrackConstraintSet] });
      setLanternaLigada(ligar);
    } catch {
      setLanternaDisponivel(false);
    }
  }, [lanternaLigada]);

  useEffect(() => {
    // Abre a câmera fora do corpo do efeito; no StrictMode o timer da 1ª montagem é cancelado
    // e evita pedir a câmera duas vezes.
    const timer = autoStart ? setTimeout(() => iniciar(), 0) : null;
    return () => {
      if (timer) clearTimeout(timer);
      pararStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    videoRef,
    status,
    erro,
    iniciar: () => iniciar(),
    parar,
    podeTrocarCamera: cameras.length > 1,
    trocarCamera,
    lanternaDisponivel,
    lanternaLigada,
    alternarLanterna,
  };
}
