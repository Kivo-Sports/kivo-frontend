"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";

type Estado =
  | { tipo: "sem-data" }
  | { tipo: "futuro"; texto: string }
  | { tipo: "rolando" }
  | { tipo: "atrasado" };

const QUATRO_HORAS_MS = 4 * 60 * 60 * 1000;

/**
 * Devolve o estado do jogo em relação a `dataHora`.
 *   futuro (data no futuro)        → "Xd Yh" / "Xh Ymin" / "Xh Ymin Zs"
 *   rolando (0 a 4h após o início) → label "Bola rolando"
 *   atrasado (>4h após sem placar) → label "Aguardando placar"
 *   sem-data                       → fallback
 */
function useContagemJogo(dataHora: string | null): Estado {
  const alvoTs = useMemo<number | null>(() => {
    if (!dataHora) return null;
    const t = new Date(dataHora).getTime();
    return Number.isNaN(t) ? null : t;
  }, [dataHora]);

  const [agora, setAgora] = useState<number>(() => Date.now());

  useEffect(() => {
    if (alvoTs === null) return;
    const restante = alvoTs - Date.now();
    // 1s quando perto (< 3h faltando); senão 30s (suficiente para transicionar
    // futuro → rolando → atrasado).
    const intervalo = restante > 0 && restante < 3 * 60 * 60 * 1000 ? 1000 : 30_000;
    const id = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(id);
  }, [alvoTs, agora]);

  if (alvoTs === null) return { tipo: "sem-data" };

  const diff = alvoTs - agora;

  if (diff <= 0) {
    const passou = -diff;
    return passou < QUATRO_HORAS_MS ? { tipo: "rolando" } : { tipo: "atrasado" };
  }

  // futuro
  const totalSec = Math.floor(diff / 1000);
  const dias = Math.floor(totalSec / 86400);
  const horas = Math.floor((totalSec % 86400) / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const seg = totalSec % 60;

  let texto: string;
  if (diff >= 86400_000) {
    texto = dias < 7 && horas > 0
      ? `${dias}d ${horas}h`
      : `${dias} dia${dias !== 1 ? "s" : ""}`;
  } else if (diff >= 3 * 3600_000) {
    texto = min > 0 ? `${horas}h ${min}min` : `${horas}h`;
  } else if (horas >= 1) {
    texto = `${horas}h ${min}min ${String(seg).padStart(2, "0")}s`;
  } else if (min >= 1) {
    texto = `${min}min ${String(seg).padStart(2, "0")}s`;
  } else {
    texto = `${seg}s`;
  }
  return { tipo: "futuro", texto };
}

export interface ContagemRegressivaJogoProps {
  dataHora: string | null;
  /** Texto exibido quando não há data definida (ex.: "A jogar"). */
  fallback?: string;
}

/**
 * Exibe a contagem regressiva até o início do jogo, sem container/pill ao redor.
 * Quando a partida está rolando ou atrasada, mostra um rótulo curto no lugar.
 */
export function ContagemRegressivaJogo({ dataHora, fallback = "A jogar" }: ContagemRegressivaJogoProps) {
  const estado = useContagemJogo(dataHora);

  if (estado.tipo === "sem-data") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        <Icon icon={Clock} size={11} />
        {fallback}
      </span>
    );
  }

  if (estado.tipo === "rolando") {
    return (
      <span
        style={{
          fontSize: "var(--text-sm)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "rgba(255,193,7,0.95)",
          whiteSpace: "nowrap",
        }}
      >
        Bola rolando
      </span>
    );
  }

  if (estado.tipo === "atrasado") {
    return (
      <span
        style={{
          fontSize: "var(--text-sm)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "rgba(255,140,0,0.95)",
          whiteSpace: "nowrap",
        }}
      >
        Aguardando placar
      </span>
    );
  }

  // futuro: só o tempo, maior e em destaque
  return (
    <span
      style={{
        fontSize: "var(--text-lg)",
        fontWeight: 700,
        color: "var(--color-brand-primary)",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}
    >
      {estado.texto}
    </span>
  );
}
