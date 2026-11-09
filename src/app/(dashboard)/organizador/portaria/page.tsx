"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import {
  CircleCheckBig,
  Keyboard,
  OctagonX,
  ScanLine,
  ShieldCheck,
  Timer,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Card } from "@/components/molecules/Card";
import { PageHeader } from "@/components/molecules/PageHeader";
import {
  CameraLeitor,
  DURACAO_PADRAO_SEGUNDOS,
  OPCOES_DURACAO_SEGUNDOS,
  ResultadoValidacao,
  assinarDuracaoResultado,
  extrairCodigo,
  obterDuracaoResultado,
  salvarDuracaoResultado,
  interpretarErroValidacao,
  sinalizarResultado,
} from "@/components/organisms/PortariaScanner";
import type { ResultadoLeitura } from "@/components/organisms/PortariaScanner";
import { useQrScanner } from "@/hooks/useQrScanner";
import { useValidarIngressoPortariaMutation } from "@/store/api/ingressoApi";

/** Depois de fechar o resultado, o mesmo QR ainda pode estar na frente da câmera: ignora por esse tempo. */
const BLOQUEIO_MESMO_CODIGO_MS = 5000;
const MAX_HISTORICO = 8;

interface ItemHistorico {
  id: number;
  tipo: ResultadoLeitura["tipo"];
  titulo: string;
  detalhe: string;
  horario: Date;
}

function paraHistorico(resultado: ResultadoLeitura, id: number): ItemHistorico {
  const base = { id, tipo: resultado.tipo, horario: new Date() };
  switch (resultado.tipo) {
    case "liberado":
      return {
        ...base,
        titulo: resultado.dados.nomeTitular,
        detalhe: resultado.dados.nomeLote || "Entrada liberada",
      };
    case "usado":
      return {
        ...base,
        titulo: resultado.nomeTitular || "Ingresso já utilizado",
        detalhe: "Já utilizado",
      };
    default:
      return { ...base, titulo: resultado.titulo, detalhe: resultado.mensagem };
  }
}

const ICONE_HISTORICO = {
  liberado: { icone: CircleCheckBig, cor: "var(--color-feedback-success)" },
  usado: { icone: TriangleAlert, cor: "var(--color-feedback-warning)" },
  negado: { icone: OctagonX, cor: "var(--color-feedback-danger)" },
  falha: { icone: WifiOff, cor: "var(--color-text-muted)" },
} as const;

const CONSULTA_CELULAR = "(max-width: 767px)";

/** No celular o scanner abre em tela cheia; no computador fica dentro da página. */
function useEhCelular() {
  return useSyncExternalStore(
    (avisar) => {
      const consulta = window.matchMedia(CONSULTA_CELULAR);
      consulta.addEventListener("change", avisar);
      return () => consulta.removeEventListener("change", avisar);
    },
    () => window.matchMedia(CONSULTA_CELULAR).matches,
    () => false,
  );
}

/** Segundos que o resultado fica na tela; escolhido pelo porteiro e lembrado neste navegador. */
function useDuracaoResultado() {
  return useSyncExternalStore(
    assinarDuracaoResultado,
    obterDuracaoResultado,
    () => DURACAO_PADRAO_SEGUNDOS,
  );
}

/** Mantém a tela do celular acesa enquanto a portaria estiver aberta. */
function useTelaSempreAcesa() {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    let ativo = true;
    const pedir = async () => {
      if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
      try {
        const sentinela = await navigator.wakeLock.request("screen");
        if (ativo) wakeLock = sentinela;
        else sentinela.release().catch(() => undefined);
      } catch {
        // bateria fraca ou navegador sem suporte
      }
    };
    pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => {
      ativo = false;
      document.removeEventListener("visibilitychange", pedir);
      wakeLock?.release().catch(() => undefined);
    };
  }, []);
}

export default function PortariaPage() {
  const ehCelular = useEhCelular();
  const duracaoSegundos = useDuracaoResultado();
  const [scannerAberto, setScannerAberto] = useState(false);
  const [resultado, setResultado] = useState<ResultadoLeitura | null>(null);
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [liberados, setLiberados] = useState(0);
  const [codigoManual, setCodigoManual] = useState("");
  const [validarIngresso, { isLoading }] = useValidarIngressoPortariaMutation();
  const processandoRef = useRef(false);
  const ultimoCodigoRef = useRef<{ codigo: string; bloqueadoAte: number } | null>(null);
  const proximoIdRef = useRef(1);

  useTelaSempreAcesa();

  const validar = useCallback(
    async (texto: string) => {
      const codigo = extrairCodigo(texto);
      if (!codigo || processandoRef.current) return;
      processandoRef.current = true;

      let novo: ResultadoLeitura;
      try {
        const dados = await validarIngresso(codigo).unwrap();
        novo = { tipo: "liberado", codigo, dados };
        setLiberados((n) => n + 1);
      } catch (error) {
        novo = interpretarErroValidacao(error, codigo);
      }

      sinalizarResultado(novo.tipo);
      setResultado(novo);
      const id = proximoIdRef.current++;
      setHistorico((itens) => [paraHistorico(novo, id), ...itens].slice(0, MAX_HISTORICO));
      processandoRef.current = false;
    },
    [validarIngresso],
  );

  const aoLerQrCode = useCallback(
    (texto: string) => {
      const codigo = extrairCodigo(texto);
      const ultimo = ultimoCodigoRef.current;
      if (ultimo && ultimo.codigo === codigo && Date.now() < ultimo.bloqueadoAte) return;
      validar(codigo);
    },
    [validar],
  );

  const scanner = useQrScanner({
    onDecode: aoLerQrCode,
    paused: resultado !== null || isLoading,
  });

  const abrirScanner = useCallback(() => {
    setScannerAberto(true);
    scanner.iniciar();
  }, [scanner]);

  const fecharScanner = useCallback(() => {
    scanner.parar();
    setScannerAberto(false);
  }, [scanner]);

  const telaCheiaAberta = ehCelular && scannerAberto;

  // Trava a rolagem da página por trás do scanner em tela cheia
  useEffect(() => {
    if (!telaCheiaAberta) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [telaCheiaAberta]);

  const propsCamera = {
    videoRef: scanner.videoRef,
    status: scanner.status,
    erro: scanner.erro,
    validando: isLoading,
    onIniciar: abrirScanner,
    onFechar: fecharScanner,
    podeTrocarCamera: scanner.podeTrocarCamera,
    onTrocarCamera: scanner.trocarCamera,
    lanternaDisponivel: scanner.lanternaDisponivel,
    lanternaLigada: scanner.lanternaLigada,
    onAlternarLanterna: scanner.alternarLanterna,
  };

  const fecharResultado = useCallback(() => {
    setResultado((atual) => {
      if (atual)
        ultimoCodigoRef.current = {
          codigo: atual.codigo,
          bloqueadoAte: Date.now() + BLOQUEIO_MESMO_CODIGO_MS,
        };
      return null;
    });
  }, []);

  const tentarNovamente = useCallback(() => {
    if (!resultado) return;
    const { codigo } = resultado;
    setResultado(null);
    validar(codigo);
  }, [resultado, validar]);

  const validarManual = async () => {
    const valor = codigoManual.trim();
    if (!valor) return;
    await validar(valor);
    setCodigoManual("");
  };

  return (
    <main style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
      <PageHeader
        title="Portaria"
        subtitle="Abra o scanner e aponte para o QR Code do ingresso. Cada ingresso libera uma única entrada."
      />

      <div style={{ display: "grid", gap: 16 }}>
        {ehCelular ? (
          <Card padding="lg">
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 16,
                background: "var(--color-feedback-success-bg)",
                border: "1px solid rgba(0,230,118,.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Icon icon={ScanLine} size={28} style={{ color: "var(--color-brand-primary)" }} />
            </div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--text-md)" }}>
              Scanner de ingressos
            </p>
            <p
              style={{
                margin: "6px 0 18px",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                lineHeight: 1.55,
              }}
            >
              A câmera abre em tela cheia. O resultado de cada leitura aparece por {duracaoSegundos}{" "}
              segundos e o scanner volta sozinho para o próximo ingresso.
            </p>
            <Button fullWidth size="lg" onClick={abrirScanner}>
              <Icon icon={ScanLine} size={20} /> Abrir scanner
            </Button>
          </Card>
        ) : (
          <CameraLeitor {...propsCamera} />
        )}

        <Card padding="lg">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon icon={Timer} size={18} style={{ color: "var(--color-brand-primary)" }} />
            <p
              id="portaria-duracao-titulo"
              style={{ margin: 0, fontWeight: 700, fontSize: "var(--text-base)" }}
            >
              Tempo do resultado na tela
            </p>
          </div>
          <p
            style={{
              margin: "6px 0 14px",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-xs)",
              lineHeight: 1.6,
            }}
          >
            O aviso de liberado, já usado ou negado some sozinho depois desse tempo e o scanner
            volta a ler.
          </p>
          <div
            role="radiogroup"
            aria-labelledby="portaria-duracao-titulo"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${OPCOES_DURACAO_SEGUNDOS.length}, 1fr)`,
              gap: 8,
            }}
          >
            {OPCOES_DURACAO_SEGUNDOS.map((segundos) => {
              const selecionado = segundos === duracaoSegundos;
              return (
                <button
                  key={segundos}
                  type="button"
                  role="radio"
                  aria-checked={selecionado}
                  onClick={() => salvarDuracaoResultado(segundos)}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    border: selecionado
                      ? "1px solid var(--color-brand-primary)"
                      : "1px solid var(--color-border-default)",
                    background: selecionado ? "var(--color-brand-primary)" : "transparent",
                    color: selecionado ? "var(--color-text-on-primary)" : "var(--color-text-primary)",
                    fontWeight: 700,
                    fontSize: "var(--text-base)",
                    cursor: "pointer",
                    transition: "background .15s ease, border-color .15s ease",
                  }}
                >
                  {segundos}s
                </button>
              );
            })}
          </div>
        </Card>

        <Card padding="lg">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Icon icon={Keyboard} size={18} style={{ color: "var(--color-brand-primary)" }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--text-base)" }}>
              Digitar código
            </p>
          </div>
          <Input
            label="Código de validação"
            placeholder="Código abaixo do QR Code"
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && validarManual()}
            autoComplete="off"
            spellCheck={false}
          />
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--text-xs)",
              lineHeight: 1.6,
              margin: "12px 0 16px",
            }}
          >
            Use se a câmera não ler o QR Code. Leitores de código USB também funcionam neste campo.
          </p>
          <Button
            fullWidth
            onClick={validarManual}
            loading={isLoading}
            disabled={!codigoManual.trim()}
          >
            <Icon icon={ShieldCheck} size={17} /> Validar e liberar entrada
          </Button>
        </Card>

        {historico.length > 0 && (
          <Card padding="lg">
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--text-base)" }}>
                Últimas leituras
              </p>
              <p
                style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}
              >
                <strong style={{ color: "var(--color-brand-primary)", fontSize: "var(--text-md)" }}>
                  {liberados}
                </strong>{" "}
                {liberados === 1 ? "entrada liberada" : "entradas liberadas"}
              </p>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {historico.map((item) => {
                const { icone, cor } = ICONE_HISTORICO[item.tipo];
                return (
                  <li
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "var(--color-bg-elevated)",
                    }}
                  >
                    <Icon icon={icone} size={20} style={{ color: cor, flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: "var(--text-sm)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.titulo}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.detalhe}
                      </p>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {item.horario.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      {telaCheiaAberta &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Scanner de ingressos"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1050,
              height: "100dvh",
              background: "var(--dark-700)",
            }}
          >
            <CameraLeitor
              {...propsCamera}
              telaCheia
              rotuloTopo={`${liberados} ${liberados === 1 ? "entrada liberada" : "entradas liberadas"}`}
            />
          </div>,
          document.body,
        )}

      <AnimatePresence>
        {resultado && (
          <ResultadoValidacao
            key={`${resultado.codigo}-${historico[0]?.id ?? 0}`}
            resultado={resultado}
            onFechar={fecharResultado}
            onTentarNovamente={resultado.tipo === "falha" ? tentarNovamente : undefined}
            duracaoMs={duracaoSegundos * 1000}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
