"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Calendar, Users, Search, X, GitFork, Crown,
  Sparkles, PlayCircle, ClipboardList, CheckCircle,
} from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Card } from "@/components/molecules/Card";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { Icon as IconifyIcon } from "@iconify/react";
import { EsporteCarrossel } from "@/components/molecules/EsporteCarrossel";
import { containerVariants, fadeInUp, getFadeTransition, itemVariants } from "@/lib/motion";
import { obterStatusCampeonato, formatarPeriodo } from "@/lib/campeonato.ui";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import {
  FORMATO_CAMPEONATO,
  type CampeonatoResponse,
  type FormatoCampeonato,
} from "@/types/campeonato";

const FILTROS: { key: string; label: string; status: string[] }[] = [
  { key: "todos",        label: "Todos",              status: [] },
  { key: "andamento",    label: "Em andamento",       status: ["EmAndamento"] },
  { key: "inscricoes",   label: "Inscrições abertas", status: ["InscricoesAbertas"] },
  { key: "finalizados",  label: "Finalizados",        status: ["Finalizado"] },
];

function formatoLabel(formato: string): string {
  const cfg = FORMATO_CAMPEONATO[formato as FormatoCampeonato];
  return cfg ? cfg.label : formato;
}

// ─── Stat card pequenino ──────────────────────────────────────────────────────

function StatCard({ icon, valor, label, cor }: { icon: typeof Trophy; valor: number; label: string; cor: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-xl)",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: "2.25rem",
          height: "2.25rem",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${cor}1f`,
          border: `1px solid ${cor}55`,
          flexShrink: 0,
        }}
      >
        <Icon icon={icon} size={15} style={{ color: cor }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700, color: "white", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {valor}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Pílula de status com pulso para EmAndamento ──────────────────────────────

function StatusPill({ status }: { status: string }) {
  const cfg = obterStatusCampeonato(status);
  const isAoVivo = status === "EmAndamento";
  const cor =
    status === "EmAndamento" ? "#60a5fa"
      : status === "InscricoesAbertas" ? "var(--color-brand-primary)"
        : status === "Finalizado" ? "rgba(255,196,0,0.95)"
          : "var(--color-text-muted)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px",
        borderRadius: "var(--radius-full)",
        background: `${cor}1f`,
        border: `1px solid ${cor}55`,
        fontSize: "10px",
        fontWeight: 700,
        color: cor,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
      }}
    >
      {isAoVivo && (
        <span style={{ position: "relative", width: 7, height: 7, flexShrink: 0 }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: cor }} />
          <motion.span
            initial={{ scale: 1, opacity: 0.55 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, borderRadius: "50%", background: cor }}
          />
        </span>
      )}
      {cfg.label}
    </span>
  );
}

// ─── Card de campeonato no feed ───────────────────────────────────────────────

function CampeonatoCard({ camp }: { camp: CampeonatoResponse }) {
  const finalizado = camp.status === "Finalizado";
  const temCampeao = finalizado && Boolean(camp.vencedorTimeNome);

  return (
    <Link href={`/campeonatos/${camp.id}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
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
        {/* Capa: logo grande + nome + status */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div
            style={{
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "var(--radius-lg)",
              flexShrink: 0,
              background: camp.logoUrl
                ? `center / cover no-repeat url("${camp.logoUrl}")`
                : "linear-gradient(150deg, rgba(0,230,118,0.18), rgba(0,230,118,0.04))",
              border: "1px solid rgba(0,230,118,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              boxShadow: "0 6px 16px rgba(0,0,0,0.35)",
            }}
          >
            {!camp.logoUrl && <Icon icon={Trophy} size={22} style={{ color: "var(--color-brand-primary)" }} />}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {camp.nome}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
              <StatusPill status={camp.status} />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon icon={GitFork} size={9} />
                {formatoLabel(camp.formatoCampeonato)}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata: período + número de times */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", paddingTop: "var(--space-1)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "var(--space-2)" }}>
            <Icon icon={Calendar} size={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              {formatarPeriodo(camp.dataInicio, camp.dataFim)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon icon={Users} size={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              {camp.totalTimes} {camp.totalTimes === 1 ? "time" : "times"}
            </span>
          </div>
          {camp.esporteNome && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {camp.esporteIcone && (
                <IconifyIcon icon={camp.esporteIcone} width={12} height={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
              )}
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                {camp.esporteNome}
              </span>
            </div>
          )}
        </div>

        {/* Campeão (faixa dourada para finalizados) */}
        {temCampeao && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, rgba(255,196,0,0.12), rgba(255,196,0,0.03))",
              border: "1px solid rgba(255,196,0,0.3)",
              marginTop: "auto",
            }}
          >
            <Icon icon={Crown} size={14} style={{ color: "#FFC400", flexShrink: 0 }} />
            <Avatar name={camp.vencedorTimeNome ?? "?"} src={camp.vencedorTimeLogo || undefined} size="sm" />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: "9px", color: "rgba(255,196,0,0.8)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, lineHeight: 1 }}>
                Campeão
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {camp.vencedorTimeNome}
              </p>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ExplorarCampeonatosPage() {
  const { data: campeonatos = [], isLoading } = useListarCampeonatosQuery();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [esporteFiltro, setEsporteFiltro] = useState("todos");

  // Lista base: tudo que está público (sem Rascunho, sem Cancelado)
  const visiveis = useMemo(
    () => campeonatos.filter((c) => c.status !== "Rascunho" && c.status !== "Cancelado"),
    [campeonatos],
  );

  const filtrados = useMemo(() => {
    const filtroAtivo = FILTROS.find((f) => f.key === filtro) ?? FILTROS[0];
    const termo = busca.trim().toLowerCase();
    return visiveis
      .filter((c) => filtroAtivo.status.length === 0 || filtroAtivo.status.includes(c.status))
      .filter((c) => esporteFiltro === "todos" || c.esporteId === esporteFiltro)
      .filter((c) => termo === "" || c.nome.toLowerCase().includes(termo))
      .slice()
      .sort((a, b) => {
        // Em andamento primeiro, depois inscrições, depois finalizados; dentro de cada, mais recentes primeiro
        const ordem: Record<string, number> = { EmAndamento: 0, InscricoesAbertas: 1, Finalizado: 2 };
        const oa = ordem[a.status] ?? 3;
        const ob = ordem[b.status] ?? 3;
        if (oa !== ob) return oa - ob;
        return new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime();
      });
  }, [visiveis, busca, filtro, esporteFiltro]);

  const stats = useMemo(() => {
    let andamento = 0, inscricoes = 0, finalizados = 0;
    for (const c of visiveis) {
      if (c.status === "EmAndamento") andamento++;
      else if (c.status === "InscricoesAbertas") inscricoes++;
      else if (c.status === "Finalizado") finalizados++;
    }
    return { andamento, inscricoes, finalizados, total: visiveis.length };
  }, [visiveis]);

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
            <Icon icon={Sparkles} size={22} style={{ color: "var(--color-brand-primary)" }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: "white", lineHeight: 1.15 }}>
             Campeonatos
            </h1>
            <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              Acompanhe o que está acontecendo, descubra novos torneios e veja quem está disputando.
            </p>
          </div>
        </div>
      </div>



      {/* ── Busca + filtros ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-5)" }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: "200px" }}>
          <Icon icon={Search} size={14} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Buscar campeonato..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ width: "100%", height: "40px", padding: "0 var(--space-3) 0 calc(var(--space-3) + 22px)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", color: "white", fontSize: "var(--text-sm)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
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
        <div
          data-camp-filtros
          style={{ display: "flex", gap: "var(--space-2)", flexWrap: "nowrap", overflowX: "auto", flex: "1 1 240px", minWidth: 0, scrollbarWidth: "none", paddingBottom: "2px" }}
        >
          {FILTROS.map((f) => {
            const ativo = filtro === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                style={{
                  flexShrink: 0,
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${ativo ? "rgba(0,230,118,0.4)" : "rgba(255,255,255,0.1)"}`,
                  background: ativo ? "rgba(0,230,118,0.12)" : "rgba(255,255,255,0.03)",
                  color: ativo ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <style>{`[data-camp-filtros]::-webkit-scrollbar { display: none; }`}</style>
      </div>

      {/* ── Carrossel de esportes (filtro) ───────────────────────────────── */}
      <EsporteCarrossel value={esporteFiltro} onChange={setEsporteFiltro} />

      {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="lg" ariaLabel="Carregando campeonatos" />
        </div>
      ) : filtrados.length === 0 ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
            <Icon icon={Trophy} size={22} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>
            Nenhum campeonato encontrado
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {busca || filtro !== "todos" ? "Ajuste a busca ou os filtros." : "Ainda não há campeonatos publicados."}
          </p>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}
        >
          {filtrados.map((camp) => (
            <motion.div key={camp.id} variants={itemVariants}>
              <CampeonatoCard camp={camp} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.main>
  );
}
