"use client";

import type { CSSProperties, Ref } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, CameraOff, Flashlight, FlashlightOff, SwitchCamera, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import type { CameraStatus } from "@/hooks/useQrScanner";

export interface CameraLeitorProps {
  videoRef: Ref<HTMLVideoElement>;
  status: CameraStatus;
  erro: string | null;
  validando: boolean;
  onIniciar: () => void;
  /** Fecha a câmera (e sai da tela cheia no celular). */
  onFechar: () => void;
  podeTrocarCamera: boolean;
  onTrocarCamera: () => void;
  lanternaDisponivel: boolean;
  lanternaLigada: boolean;
  onAlternarLanterna: () => void;
  /** Ocupa a tela inteira (celular) em vez de um quadro dentro da página. */
  telaCheia?: boolean;
  /** Texto curto no topo da tela cheia, ex.: "3 entradas liberadas". */
  rotuloTopo?: string;
}

const TAMANHO_CANTO = 34;

function Canto({ posicao }: { posicao: "tl" | "tr" | "bl" | "br" }) {
  const borda = "4px solid var(--color-brand-primary)";
  const estilo: CSSProperties = {
    position: "absolute",
    width: TAMANHO_CANTO,
    height: TAMANHO_CANTO,
    borderTop: posicao.startsWith("t") ? borda : undefined,
    borderBottom: posicao.startsWith("b") ? borda : undefined,
    borderLeft: posicao.endsWith("l") ? borda : undefined,
    borderRight: posicao.endsWith("r") ? borda : undefined,
    top: posicao.startsWith("t") ? 0 : undefined,
    bottom: posicao.startsWith("b") ? 0 : undefined,
    left: posicao.endsWith("l") ? 0 : undefined,
    right: posicao.endsWith("r") ? 0 : undefined,
    borderTopLeftRadius: posicao === "tl" ? 18 : undefined,
    borderTopRightRadius: posicao === "tr" ? 18 : undefined,
    borderBottomLeftRadius: posicao === "bl" ? 18 : undefined,
    borderBottomRightRadius: posicao === "br" ? 18 : undefined,
    filter: "drop-shadow(0 0 8px rgba(0,230,118,.55))",
  };
  return <span aria-hidden style={estilo} />;
}

const botaoRedondo: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,.22)",
  background: "rgba(6,12,10,.55)",
  backdropFilter: "blur(6px)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const chip: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  borderRadius: 999,
  background: "rgba(6,12,10,.7)",
  backdropFilter: "blur(6px)",
  color: "#fff",
  fontSize: "var(--text-sm)",
  fontWeight: 600,
};

export function CameraLeitor({
  videoRef,
  status,
  erro,
  validando,
  onIniciar,
  onFechar,
  podeTrocarCamera,
  onTrocarCamera,
  lanternaDisponivel,
  lanternaLigada,
  onAlternarLanterna,
  telaCheia = false,
  rotuloTopo,
}: CameraLeitorProps) {
  const reduzirMovimento = useReducedMotion();
  const lendo = status === "scanning";
  const margemTopo = telaCheia ? "max(14px, env(safe-area-inset-top))" : "12px";
  const margemBaixo = telaCheia ? "max(22px, env(safe-area-inset-bottom))" : "14px";
  // Na tela cheia o X sempre aparece para o porteiro conseguir sair; no quadro, só com a câmera ligada
  const mostrarFechar = telaCheia || status === "scanning" || status === "starting";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        ...(telaCheia
          ? { height: "100%" }
          : {
              aspectRatio: "1 / 1",
              maxHeight: "62vh",
              borderRadius: 20,
              border: "1px solid var(--color-border-default)",
            }),
        overflow: "hidden",
        background: "var(--dark-700)",
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        aria-label="Imagem da câmera para leitura do QR Code"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: lendo ? 1 : 0,
          transition: "opacity .25s ease",
        }}
      />

      {lendo && (
        <>
          {/* Escurece fora da mira para guiar o porteiro */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: telaCheia ? "min(78vw, 58vh)" : "68%",
              aspectRatio: "1 / 1",
              transform: "translate(-50%, -50%)",
              borderRadius: 18,
              boxShadow: "0 0 0 9999px rgba(3,7,5,.5)",
            }}
          >
            <Canto posicao="tl" />
            <Canto posicao="tr" />
            <Canto posicao="bl" />
            <Canto posicao="br" />
            {!validando && !reduzirMovimento && (
              <motion.span
                aria-hidden
                initial={{ top: "8%" }}
                animate={{ top: ["8%", "90%", "8%"] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  left: "6%",
                  right: "6%",
                  height: 2,
                  borderRadius: 2,
                  background: "var(--color-brand-primary)",
                  boxShadow: "0 0 14px 2px rgba(0,230,118,.7)",
                }}
              />
            )}
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: margemBaixo,
              display: "flex",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span role="status" style={chip}>
              {validando ? (
                <>
                  <Spinner size="sm" color="currentColor" ariaLabel="Validando" /> Validando
                  ingresso...
                </>
              ) : (
                <>
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--color-brand-primary)",
                      boxShadow: "0 0 8px var(--color-brand-primary)",
                    }}
                  />
                  Aponte para o QR Code do ingresso
                </>
              )}
            </span>
          </div>
        </>
      )}

      {/* Barra superior: fechar à esquerda, contador no meio, lanterna/câmera à direita */}
      <div
        style={{
          position: "absolute",
          top: margemTopo,
          left: 12,
          right: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
          zIndex: 1,
        }}
      >
        {mostrarFechar && (
          <button
            type="button"
            onClick={onFechar}
            aria-label={telaCheia ? "Fechar scanner" : "Desligar câmera"}
            style={botaoRedondo}
          >
            <X size={22} />
          </button>
        )}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
          {telaCheia && rotuloTopo && <span style={chip}>{rotuloTopo}</span>}
        </div>
        {lendo && lanternaDisponivel && (
          <button
            type="button"
            onClick={onAlternarLanterna}
            aria-pressed={lanternaLigada}
            aria-label={lanternaLigada ? "Desligar lanterna" : "Ligar lanterna"}
            style={{
              ...botaoRedondo,
              background: lanternaLigada ? "var(--color-brand-primary)" : botaoRedondo.background,
              color: lanternaLigada ? "var(--dark-600)" : "#fff",
            }}
          >
            {lanternaLigada ? <FlashlightOff size={20} /> : <Flashlight size={20} />}
          </button>
        )}
        {lendo && podeTrocarCamera && (
          <button
            type="button"
            onClick={onTrocarCamera}
            aria-label="Trocar câmera"
            style={botaoRedondo}
          >
            <SwitchCamera size={20} />
          </button>
        )}
      </div>

      {status === "starting" && (
        <div style={centro}>
          <Spinner size="lg" ariaLabel="Abrindo câmera" />
          <p style={{ margin: 0, color: "rgba(255,255,255,.75)", fontSize: "var(--text-sm)" }}>
            Abrindo a câmera...
          </p>
        </div>
      )}

      {(status === "idle" || status === "error") && (
        <div style={centro}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                status === "error"
                  ? "var(--color-feedback-danger-bg)"
                  : "var(--color-feedback-success-bg)",
              color:
                status === "error" ? "var(--color-feedback-danger)" : "var(--color-brand-primary)",
            }}
          >
            {status === "error" ? <CameraOff size={30} /> : <Camera size={30} />}
          </div>
          <p
            style={{
              margin: 0,
              maxWidth: 320,
              color: "rgba(255,255,255,.85)",
              fontSize: "var(--text-sm)",
              lineHeight: 1.55,
            }}
          >
            {erro ?? "Use a câmera do computador para ler o QR Code dos ingressos."}
          </p>
          <Button onClick={onIniciar}>
            <Camera size={17} /> {status === "error" ? "Tentar de novo" : "Abrir scanner"}
          </Button>
        </div>
      )}
    </div>
  );
}

const centro: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  padding: 24,
  textAlign: "center",
};
