"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Ticket, CheckCircle } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/molecules/Card";
import { ContagemRegressivaJogo } from "@/components/molecules/ContagemRegressivaJogo";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { fadeInUp, getFadeTransition } from "@/lib/motion";
import { formatarDataJogo } from "@/lib/campeonato.ui";
import { useObterPartidaQuery } from "@/store/api/partidaApi";

function etiquetaPartida(rodada: number | null, fase: string): string {
  if (rodada != null) return `Rodada ${rodada}`;
  if (fase && fase !== "Nenhuma") return fase;
  return "Partida";
}

export default function ExplorarJogoDetalhePage({ params }: { params: Promise<{ jogoId: string }> }) {
  const { jogoId } = use(params);
  const { data: partida, isLoading, isError } = useObterPartidaQuery(jogoId);

  if (isLoading) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="lg" ariaLabel="Carregando jogo" />
      </main>
    );
  }

  if (isError || !partida) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
        <p style={{ color: "var(--color-feedback-danger)", margin: 0 }}>Jogo não encontrado.</p>
        <Link href="/campeonatos" style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
          Voltar para campeonatos
        </Link>
      </main>
    );
  }

  const dataFormatada = formatarDataJogo(partida.dataHora);
  const temLocal = partida.local && partida.local.trim().length > 0;
  const etiqueta = etiquetaPartida(partida.rodada, partida.fase);

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "760px", margin: "0 auto" }}
    >
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <BotaoVoltar fallbackHref={`/campeonatos/${partida.campeonatoId}`} />
      </div>

      {/* Confronto */}
      <Card
        padding="lg"
        style={{
          background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          marginBottom: "var(--space-5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-5)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "var(--radius-full)", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-brand-primary)" }}>
            {etiqueta}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "var(--space-4)" }}>
          {/* Casa */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", textAlign: "center", minWidth: 0 }}>
            <Avatar name={partida.nomeTimeCasa} src={partida.logoTimeCasa || undefined} size="xl" />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
              {partida.nomeTimeCasa}
            </span>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Casa</span>
          </div>

          {/* Placar / VS */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)" }}>
            {partida.finalizado ? (
              <span style={{ fontSize: "clamp(2rem, 8vw, 3rem)", fontWeight: 800, color: "white", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {partida.golsTimeCasa} <span style={{ color: "var(--color-text-muted)" }}>×</span> {partida.golsTimeVisitante}
              </span>
            ) : (
              <span style={{ fontSize: "clamp(1.4rem, 5vw, 2rem)", fontWeight: 800, color: "var(--color-text-muted)", lineHeight: 1 }}>VS</span>
            )}
          </div>

          {/* Visitante */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", textAlign: "center", minWidth: 0 }}>
            <Avatar name={partida.nomeTimeVisitante} src={partida.logoTimeVisitante || undefined} size="xl" />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
              {partida.nomeTimeVisitante}
            </span>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Visitante</span>
          </div>
        </div>

        {/* Status do jogo — fora do grid para não apertar no mobile */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--space-5)" }}>
          {partida.finalizado ? (
            <Badge variant="success" size="sm">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Icon icon={CheckCircle} size={11} />
                Encerrado
              </span>
            </Badge>
          ) : (
            <ContagemRegressivaJogo dataHora={partida.dataHora} fallback="A realizar" />
          )}
        </div>
      </Card>

      {/* Detalhes */}
      <Card padding="md" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-xl)", marginBottom: "var(--space-5)" }}>
        <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-secondary)" }}>
          Detalhes
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon icon={Calendar} size={16} style={{ color: "var(--color-brand-primary)" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Quando</p>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>
                {dataFormatada ?? "Data a definir"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon icon={MapPin} size={16} style={{ color: "var(--color-brand-primary)" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Onde</p>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>
                {temLocal ? partida.local : "Local a definir"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Ingressos — em breve */}
      <Card padding="md" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: "var(--radius-xl)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon icon={Ticket} size={20} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "white" }}>Ingressos</p>
              <Badge variant="warning" size="sm">Em breve</Badge>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              A compra de ingressos para as partidas estará disponível em breve.
            </p>
          </div>
        </div>
      </Card>
    </motion.main>
  );
}
