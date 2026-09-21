"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, MapPin, Search, X } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Card } from "@/components/molecules/Card";
import { ErrorState } from "@/components/molecules/ErrorState";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { Icon as IconifyIcon } from "@iconify/react";
import { EsporteCarrossel } from "@/components/molecules/EsporteCarrossel";
import { containerVariants, fadeInUp, getFadeTransition, itemVariants } from "@/lib/motion";
import { useListarTodosOsTimesQuery } from "@/store/api/campeonatoApi";
import type { TimeResponse } from "@/types/time";

// ─── Card de time ──────────────────────────────────────────────────────────────

function TimeCard({ time }: { time: TimeResponse }) {
  return (
    <Link href={`/times/${time.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <Card
        padding="md"
        hoverable
        style={{
          height: "100%",
          background: "linear-gradient(160deg, rgba(20,20,20,0.98), rgba(10,10,10,0.99))",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "var(--radius-2xl)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho: logo + nome + esporte */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <Avatar name={time.nome} src={time.logoUrl || undefined} size="md" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {time.nome}
            </h2>
          </div>
        </div>

        {/* Metadata: localização + esporte + campeonatos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", paddingTop: "var(--space-2)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "var(--space-1)" }}>
            <Icon icon={MapPin} size={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              {time.cidade} · {time.estado}
            </span>
          </div>
          {time.esporteNome && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {time.esporteIcone && (
                <IconifyIcon icon={time.esporteIcone} width={12} height={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
              )}
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                {time.esporteNome}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ExplorarTimesPage() {
  const { data: times = [], isLoading, isError, refetch } = useListarTodosOsTimesQuery();
  const [busca, setBusca] = useState("");
  const [esporteFiltro, setEsporteFiltro] = useState("todos");

  const ativos = useMemo(() => times.filter((t) => t.ativo), [times]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return ativos
      .filter((t) => esporteFiltro === "todos" || t.esporteId === esporteFiltro)
      .filter(
        (t) =>
          termo === "" ||
          t.nome.toLowerCase().includes(termo) ||
          t.cidade.toLowerCase().includes(termo) ||
          t.estado.toLowerCase().includes(termo),
      )
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [ativos, busca, esporteFiltro]);

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--radius-2xl)",
          padding: "var(--space-6) var(--space-5)",
          background: "linear-gradient(135deg, rgba(0,230,118,0.14) 0%, rgba(12,14,13,0.55) 45%, rgba(0,0,0,0.72) 100%)",
          border: "1px solid rgba(0,230,118,0.22)",
          marginBottom: "var(--space-5)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-45%",
            right: "-8%",
            width: "340px",
            height: "340px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,230,118,0.22), transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div
            style={{
              width: "3.25rem",
              height: "3.25rem",
              borderRadius: "var(--radius-xl)",
              background: "rgba(0,230,118,0.14)",
              border: "1px solid rgba(0,230,118,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 8px 24px rgba(0,230,118,0.18)",
            }}
          >
            <Icon icon={Users} size={22} style={{ color: "var(--color-brand-primary)" }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: "white", lineHeight: 1.15 }}>
              Times
            </h1>
            <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              Conheça os clubes da plataforma, suas modalidades e de onde vêm.
            </p>
          </div>
        </div>
      </div>

      {/* ── Busca ────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", width: "100%", marginBottom: "var(--space-4)" }}>
        <Icon icon={Search} size={14} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="Buscar por nome, cidade ou estado..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: "100%", height: "44px", padding: "0 var(--space-3) 0 calc(var(--space-3) + 22px)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-lg)", color: "white", fontSize: "var(--text-sm)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.4)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            aria-label="Limpar busca"
            style={{ position: "absolute", right: "var(--space-2)", top: "50%", transform: "translateY(-50%)", width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Icon icon={X} size={14} />
          </button>
        )}
      </div>

      {/* ── Carrossel de esportes (filtro) ───────────────────────────────── */}
      <EsporteCarrossel value={esporteFiltro} onChange={setEsporteFiltro} />

      {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="lg" ariaLabel="Carregando times" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar os times"
          message="Houve uma falha de conexão com o servidor. Isso não significa que não existam times."
          onRetry={() => refetch()}
        />
      ) : filtrados.length === 0 ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
            <Icon icon={Users} size={22} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>
            Nenhum time encontrado
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {busca || esporteFiltro !== "todos" ? "Ajuste a busca ou o filtro de esporte." : "Ainda não há times cadastrados."}
          </p>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "var(--space-4)" }}
        >
          {filtrados.map((time) => (
            <motion.div key={time.id} variants={itemVariants}>
              <TimeCard time={time} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.main>
  );
}
