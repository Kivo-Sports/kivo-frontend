"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleCheckBig, OctagonX, RotateCcw, TriangleAlert, WifiOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatarHora } from "./portaria.utils";
import type { ResultadoLeitura } from "./portaria.utils";

import { DURACAO_PADRAO_SEGUNDOS } from "./portaria.utils";

interface Tema {
  fundo: string;
  texto: string;
  textoSuave: string;
  icone: LucideIcon;
  corIcone: string;
  fundoIcone: string;
  /** Barra de contagem regressiva e o trilho dela. */
  barra: string;
  trilho: string;
}

const TEMAS: Record<ResultadoLeitura["tipo"], Tema> = {
  liberado: {
    fundo: "radial-gradient(circle at 50% 22%, #5cffa8 0%, var(--green-300) 45%, #00c766 100%)",
    texto: "var(--dark-600)",
    textoSuave: "rgba(6, 12, 10, 0.72)",
    icone: CircleCheckBig,
    corIcone: "var(--green-300)",
    fundoIcone: "var(--dark-600)",
    barra: "var(--dark-600)",
    trilho: "rgba(6, 12, 10, 0.18)",
  },
  usado: {
    fundo: "radial-gradient(circle at 50% 22%, #ffb54d 0%, var(--yellow-500) 50%, #e67e00 100%)",
    texto: "var(--dark-600)",
    textoSuave: "rgba(6, 12, 10, 0.75)",
    icone: TriangleAlert,
    corIcone: "var(--yellow-500)",
    fundoIcone: "var(--dark-600)",
    barra: "var(--dark-600)",
    trilho: "rgba(6, 12, 10, 0.18)",
  },
  negado: {
    fundo: "radial-gradient(circle at 50% 22%, #ff5577 0%, var(--red-300) 50%, #c80030 100%)",
    texto: "#ffffff",
    textoSuave: "rgba(255, 255, 255, 0.85)",
    icone: OctagonX,
    corIcone: "var(--red-300)",
    fundoIcone: "#ffffff",
    barra: "#ffffff",
    trilho: "rgba(255, 255, 255, 0.28)",
  },
  falha: {
    fundo: "radial-gradient(circle at 50% 22%, var(--dark-300) 0%, var(--dark-500) 70%)",
    texto: "#ffffff",
    textoSuave: "rgba(255, 255, 255, 0.75)",
    icone: WifiOff,
    corIcone: "var(--yellow-500)",
    fundoIcone: "var(--dark-200)",
    barra: "var(--green-300)",
    trilho: "rgba(255, 255, 255, 0.18)",
  },
};

function titulo(resultado: ResultadoLeitura): string {
  if (resultado.tipo === "liberado") return "Ingresso validado";
  if (resultado.tipo === "usado") return "Ingresso já utilizado";
  return resultado.titulo;
}

function sobretitulo(resultado: ResultadoLeitura): string {
  if (resultado.tipo === "liberado") return "Entrada liberada";
  if (resultado.tipo === "falha") return "Tente novamente";
  return "Entrada não liberada";
}

const rotuloCartao: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--green-300)",
};

function CartaoTitular({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        background: "var(--dark-600)",
        color: "#ffffff",
        borderRadius: 20,
        padding: "20px 22px",
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)",
        textAlign: "left",
      }}
    >
      {children}
    </div>
  );
}

export interface ResultadoValidacaoProps {
  resultado: ResultadoLeitura;
  onFechar: () => void;
  onTentarNovamente?: () => void;
  /** Quanto tempo o resultado fica na tela antes de voltar sozinho para o scanner. */
  duracaoMs?: number;
}

export function ResultadoValidacao({
  resultado,
  onFechar,
  onTentarNovamente,
  duracaoMs = DURACAO_PADRAO_SEGUNDOS * 1000,
}: ResultadoValidacaoProps) {
  const tema = TEMAS[resultado.tipo];
  const reduzirMovimento = useReducedMotion();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const liberado = resultado.tipo === "liberado";
  const [segundosRestantes, setSegundosRestantes] = useState(Math.ceil(duracaoMs / 1000));

  useEffect(() => {
    botaoRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        onFechar();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    // Todo resultado some sozinho e o scanner volta a ler
    const inicio = Date.now();
    const timer = setTimeout(onFechar, duracaoMs);
    const contador = setInterval(() => {
      const restante = Math.ceil((duracaoMs - (Date.now() - inicio)) / 1000);
      setSegundosRestantes(Math.max(restante, 0));
    }, 250);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      clearTimeout(timer);
      clearInterval(contador);
    };
  }, [onFechar, duracaoMs]);

  const corTexto = tema.texto;

  // Portal no body: um ancestral com transform (transição de página) quebraria o position: fixed.
  // Só renderiza no cliente, depois de uma leitura, então document sempre existe aqui.
  return createPortal(
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-labelledby="portaria-resultado-titulo"
      aria-describedby="portaria-resultado-detalhe"
      onClick={onFechar}
      initial={reduzirMovimento ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: tema.fundo,
        color: corTexto,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: "max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom))",
        textAlign: "center",
        overflowY: "auto",
        cursor: "pointer",
      }}
    >
      <motion.div
        initial={reduzirMovimento ? false : { scale: 0.4, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.05 }}
        style={{
          width: "clamp(96px, 26vw, 128px)",
          height: "clamp(96px, 26vw, 128px)",
          borderRadius: "50%",
          background: tema.fundoIcone,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 14px 34px rgba(0, 0, 0, 0.25)",
          flexShrink: 0,
        }}
      >
        <tema.icone
          aria-hidden
          strokeWidth={2.4}
          style={{ width: "56%", height: "56%", color: tema.corIcone }}
        />
      </motion.div>

      <div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: tema.textoSuave,
          }}
        >
          {sobretitulo(resultado)}
        </p>
        <h1
          id="portaria-resultado-titulo"
          style={{
            margin: "4px 0 0",
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "clamp(40px, 11vw, 72px)",
            lineHeight: 0.95,
            textTransform: "uppercase",
            letterSpacing: "0.01em",
            color: corTexto,
          }}
        >
          {titulo(resultado)}
        </h1>
      </div>

      <div
        id="portaria-resultado-detalhe"
        style={{ width: "100%", display: "flex", justifyContent: "center" }}
      >
        {resultado.tipo === "liberado" && (
          <CartaoTitular>
            <p style={rotuloCartao}>Titular do ingresso</p>
            <p
              style={{
                margin: "4px 0 0",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(28px, 8vw, 40px)",
                lineHeight: 1.05,
                textTransform: "uppercase",
                overflowWrap: "anywhere",
              }}
            >
              {resultado.dados.nomeTitular}
            </p>
            {resultado.dados.cpfTitularMascarado && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-base)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                CPF {resultado.dados.cpfTitularMascarado}
              </p>
            )}
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.12)",
                margin: "14px 0",
              }}
            />
            <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--text-md)" }}>
              {resultado.dados.nomePartida}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "var(--text-sm)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {[resultado.dados.nomeLote, resultado.dados.localPartida].filter(Boolean).join(" · ")}
            </p>
          </CartaoTitular>
        )}

        {resultado.tipo === "usado" && (
          <CartaoTitular>
            {resultado.nomeTitular && (
              <>
                <p style={{ ...rotuloCartao, color: "var(--yellow-500)" }}>Titular</p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "clamp(24px, 7vw, 34px)",
                    lineHeight: 1.05,
                    textTransform: "uppercase",
                    overflowWrap: "anywhere",
                  }}
                >
                  {resultado.nomeTitular}
                </p>
              </>
            )}
            <p
              style={{
                margin: resultado.nomeTitular ? "10px 0 0" : 0,
                fontSize: "var(--text-base)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {resultado.dataUso
                ? `Entrada já registrada em ${formatarHora(resultado.dataUso)}.`
                : resultado.mensagem}
            </p>
          </CartaoTitular>
        )}

        {(resultado.tipo === "negado" || resultado.tipo === "falha") && (
          <p
            style={{
              margin: 0,
              maxWidth: 460,
              fontSize: "var(--text-md)",
              lineHeight: 1.5,
              fontWeight: 600,
              color: tema.textoSuave,
            }}
          >
            {resultado.mensagem}
          </p>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: 460, display: "grid", gap: 10, marginTop: 4 }}>
        {resultado.tipo === "falha" && onTentarNovamente && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTentarNovamente();
            }}
            style={{ ...estiloBotao, background: "var(--green-300)", color: "var(--dark-600)" }}
          >
            <RotateCcw size={18} aria-hidden /> Tentar novamente
          </button>
        )}
        <button
          ref={botaoRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFechar();
          }}
          style={{
            ...estiloBotao,
            background:
              liberado || resultado.tipo === "usado" ? "var(--dark-600)" : "rgba(255,255,255,0.16)",
            color: liberado ? "var(--green-300)" : "#ffffff",
            border:
              resultado.tipo === "negado" || resultado.tipo === "falha"
                ? "1px solid rgba(255,255,255,0.4)"
                : "none",
          }}
        >
          Ler próximo ingresso
        </button>
        <div
          aria-hidden
          style={{
            height: 4,
            borderRadius: 999,
            background: tema.trilho,
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duracaoMs / 1000, ease: "linear" }}
            style={{ height: "100%", background: tema.barra }}
          />
        </div>
        <p
          aria-live="off"
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: tema.textoSuave,
          }}
        >
          Voltando para o scanner em {segundosRestantes}s · toque para continuar
        </p>
      </div>
    </motion.div>,
    document.body,
  );
}

const estiloBotao: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  height: 54,
  borderRadius: 14,
  border: "none",
  fontSize: "var(--text-md)",
  fontWeight: 700,
  cursor: "pointer",
};
