"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Trophy } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Icon } from "@/components/atoms/Icon";
import type { ChaveamentoResponse, PartidaMataMataResponse } from "@/types/partida";

const FASE_ORDEM = ["Oitavas", "Quartas", "Semifinais", "Final"];
const FASE_LABEL: Record<string, string> = {
  Oitavas: "Oitavas",
  Quartas: "Quartas",
  Semifinais: "Semis",
  Final: "Final",
};
const FASE_LABEL_LONGO: Record<string, string> = {
  Oitavas: "Oitavas de final",
  Quartas: "Quartas de final",
  Semifinais: "Semifinais",
  Final: "Final",
};

const LINHA = "rgba(255,255,255,0.18)";
const CARD_W = 168;
const CONN_W = 40;
const CELL_MIN = 132;
const LABEL_H = 28;
const ESCALA_MIN = 0.5;
const LIMIAR_LISTA = 500; // abaixo disso, usa lista vertical (celular)

interface Slot {
  fase: string;
  numero: number;
  partida: PartidaMataMataResponse | null;
}

// Monta a estrutura completa do chaveamento (inclusive rodadas futuras vazias)
function montarRounds(chaveamento: ChaveamentoResponse[]): Slot[][] {
  const porFase = new Map<string, PartidaMataMataResponse[]>();
  for (const f of chaveamento) porFase.set(f.fase, f.partidas);

  const faseInicial = FASE_ORDEM.find((f) => (porFase.get(f)?.length ?? 0) > 0);
  if (!faseInicial) return [];

  const idxInicial = FASE_ORDEM.indexOf(faseInicial);
  const n0 = porFase.get(faseInicial)!.length;
  const numRounds = Math.floor(Math.log2(n0)) + 1;

  const rounds: Slot[][] = [];
  for (let r = 0; r < numRounds; r++) {
    const faseNome = FASE_ORDEM[idxInicial + r];
    if (!faseNome) break;
    const qtd = Math.max(1, Math.round(n0 / Math.pow(2, r)));
    const partidas = porFase.get(faseNome) ?? [];
    const slots: Slot[] = [];
    for (let num = 1; num <= qtd; num++) {
      slots.push({
        fase: faseNome,
        numero: num,
        partida: partidas.find((p) => p.numeroJogoChave === num) ?? null,
      });
    }
    rounds.push(slots);
  }
  return rounds;
}

function ColLabel({ label, mirror }: { label?: string; mirror?: boolean }) {
  return (
    <div style={{ height: `${LABEL_H}px`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {label && (
        <span
          style={{
            transform: mirror ? "scaleX(-1)" : undefined,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-brand-primary)",
            background: "rgba(0,230,118,0.1)",
            border: "1px solid rgba(0,230,118,0.2)",
            padding: "2px 10px",
            borderRadius: "var(--radius-full)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function TeamLine({ nome, logo, gols, venceu, finalizado, placeholder }: {
  nome: string;
  logo: string | null;
  gols: number;
  venceu: boolean;
  finalizado: boolean;
  placeholder: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 8px", background: venceu ? "rgba(0,230,118,0.08)" : "transparent" }}>
      {placeholder ? (
        <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.2)", flexShrink: 0 }} />
      ) : (
        <Avatar name={nome} src={logo || undefined} size="sm" />
      )}
      <span style={{ flex: 1, minWidth: 0, fontSize: "11px", fontWeight: venceu ? 700 : 600, color: placeholder ? "var(--color-text-muted)" : venceu ? "var(--color-brand-primary)" : "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {nome}
      </span>
      <span style={{ flexShrink: 0, width: "16px", textAlign: "center", fontSize: "12px", fontWeight: 700, color: finalizado ? (venceu ? "var(--color-brand-primary)" : "white") : "var(--color-text-muted)" }}>
        {finalizado ? gols : "–"}
      </span>
    </div>
  );
}

function MatchCard({ slot, mirror, destaque }: { slot: Slot; mirror?: boolean; destaque?: boolean }) {
  const p = slot.partida;
  const placeholder = !p;
  const finalizado = p?.finalizado ?? false;
  const casaVenceu = finalizado && p!.golsCasa > p!.golsVisitante;
  const visVenceu = finalizado && p!.golsVisitante > p!.golsCasa;

  return (
    <div
      style={{
        width: "100%",
        borderRadius: "var(--radius-md)",
        background: destaque ? "rgba(0,230,118,0.06)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${destaque ? "rgba(0,230,118,0.35)" : "rgba(255,255,255,0.08)"}`,
        overflow: "hidden",
        transform: mirror ? "scaleX(-1)" : undefined,
      }}
    >
      <TeamLine nome={p?.timeCasa ?? "A definir"} logo={p?.logoCasa ?? null} gols={p?.golsCasa ?? 0} venceu={casaVenceu} finalizado={finalizado} placeholder={placeholder} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
      <TeamLine nome={p?.timeVisitante ?? "A definir"} logo={p?.logoVisitante ?? null} gols={p?.golsVisitante ?? 0} venceu={visVenceu} finalizado={finalizado} placeholder={placeholder} />
    </div>
  );
}

// ─── Layout horizontal (bracket) — telas largas ──────────────────────────────

function RoundColumn({ slots, label, mirror }: { slots: Slot[]; label: string; mirror?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: `${CARD_W}px`, flexShrink: 0 }}>
      <ColLabel label={label} mirror={mirror} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {slots.map((s) => (
          <div key={`${s.fase}-${s.numero}`} style={{ flex: 1, display: "flex", alignItems: "center", minHeight: `${CELL_MIN}px` }}>
            <MatchCard slot={s} mirror={mirror} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ForkConnector({ pares }: { pares: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: `${CONN_W}px`, flexShrink: 0 }}>
      <div style={{ height: `${LABEL_H}px`, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {Array.from({ length: pares }).map((_, i) => (
          <div key={i} style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 0, top: "25%", width: "50%", height: "2px", background: LINHA }} />
            <span style={{ position: "absolute", left: 0, top: "75%", width: "50%", height: "2px", background: LINHA }} />
            <span style={{ position: "absolute", left: "calc(50% - 1px)", top: "25%", width: "2px", height: "50%", background: LINHA }} />
            <span style={{ position: "absolute", left: "50%", top: "50%", width: "50%", height: "2px", background: LINHA }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StraightConnector() {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: `${CONN_W}px`, flexShrink: 0 }}>
      <div style={{ height: `${LABEL_H}px`, flexShrink: 0 }} />
      <div style={{ flex: 1, position: "relative" }}>
        <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "2px", background: LINHA }} />
      </div>
    </div>
  );
}

function HalfFlow({ rounds, side }: { rounds: Slot[][]; side: "left" | "right" }) {
  const mirror = side === "right";
  const cols: ReactNode[] = [];
  rounds.forEach((slots, r) => {
    cols.push(<RoundColumn key={`r${r}`} slots={slots} label={FASE_LABEL[slots[0].fase] ?? slots[0].fase} mirror={mirror} />);
    if (r < rounds.length - 1) {
      cols.push(<ForkConnector key={`f${r}`} pares={rounds[r + 1].length} />);
    }
  });
  cols.push(<StraightConnector key="sc" />);

  return (
    <div style={{ display: "flex", alignItems: "stretch", transform: mirror ? "scaleX(-1)" : undefined }}>
      {cols}
    </div>
  );
}

function BracketContent({ rounds }: { rounds: Slot[][] }) {
  if (rounds.length === 1) {
    return (
      <div style={{ display: "flex", flexDirection: "column", width: `${CARD_W}px` }}>
        <ColLabel label="Final" />
        <MatchCard slot={rounds[0][0]} destaque />
      </div>
    );
  }

  const finalSlot = rounds[rounds.length - 1][0];
  const halfRounds = rounds.slice(0, -1);
  const leftRounds = halfRounds.map((r) => r.slice(0, Math.ceil(r.length / 2)));
  const rightRounds = halfRounds.map((r) => r.slice(Math.ceil(r.length / 2)));

  return (
    <div style={{ display: "flex", alignItems: "stretch" }}>
      <HalfFlow rounds={leftRounds} side="left" />
      <div style={{ display: "flex", flexDirection: "column", width: `${CARD_W}px`, flexShrink: 0 }}>
        <ColLabel label="Final" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-2)" }}>
            <Icon icon={Trophy} size={16} style={{ color: "var(--color-brand-primary)" }} />
          </div>
          <MatchCard slot={finalSlot} destaque />
        </div>
      </div>
      <HalfFlow rounds={rightRounds} side="right" />
    </div>
  );
}

// ─── Layout vertical (lista por fases) — celular / telas estreitas ───────────

function ListaFases({ rounds }: { rounds: Slot[][] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {rounds.map((slots) => {
        const fase = slots[0].fase;
        const isFinal = fase === "Final";
        return (
          <div key={fase}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              {isFinal && <Icon icon={Trophy} size={13} style={{ color: "var(--color-brand-primary)" }} />}
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-brand-primary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {FASE_LABEL_LONGO[fase] ?? fase}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", background: "rgba(255,255,255,0.06)", padding: "1px 8px", borderRadius: "var(--radius-full)" }}>
                {slots.length} {slots.length === 1 ? "jogo" : "jogos"}
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isFinal ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "var(--space-3)",
                maxWidth: isFinal ? "320px" : undefined,
                margin: isFinal ? "0 auto" : undefined,
              }}
            >
              {slots.map((s) => (
                <MatchCard key={`${s.fase}-${s.numero}`} slot={s} destaque={isFinal} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Chaveamento({ chaveamento }: { chaveamento: ChaveamentoResponse[] }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [modo, setModo] = useState<"bracket" | "lista">("bracket");
  const [scale, setScale] = useState(1);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const medir = useCallback(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const disponivel = outer.clientWidth;
    if (disponivel <= 0) return;

    const novoModo = disponivel < LIMIAR_LISTA ? "lista" : "bracket";
    setModo(novoModo);

    const inner = innerRef.current;
    if (novoModo === "bracket" && inner && inner.offsetWidth) {
      const w = inner.offsetWidth;
      const h = inner.offsetHeight;
      setDims({ w, h });
      setScale(Math.max(ESCALA_MIN, Math.min(1, disponivel / w)));
    }
  }, []);

  useEffect(() => {
    medir();
    const outer = outerRef.current;
    if (!outer) return;
    const ro = new ResizeObserver(() => medir());
    ro.observe(outer);
    return () => ro.disconnect();
  }, [medir, chaveamento]);

  // Recalcula ao trocar de modo (o bracket só monta depois da troca)
  useEffect(() => {
    medir();
  }, [modo, medir]);

  const rounds = montarRounds(chaveamento);
  if (rounds.length === 0) return null;

  return (
    <div
      ref={outerRef}
      style={{
        width: "100%",
        overflowX: modo === "bracket" ? "auto" : "visible",
        textAlign: modo === "bracket" ? "center" : undefined,
      }}
    >
      {modo === "lista" ? (
        <ListaFases rounds={rounds} />
      ) : (
        <div
          ref={innerRef}
          style={{
            display: "inline-block",
            transformOrigin: "top left",
            transform: `scale(${scale})`,
            marginRight: dims.w ? `${dims.w * (scale - 1)}px` : 0,
            marginBottom: dims.h ? `${dims.h * (scale - 1)}px` : 0,
          }}
        >
          <BracketContent rounds={rounds} />
        </div>
      )}
    </div>
  );
}
