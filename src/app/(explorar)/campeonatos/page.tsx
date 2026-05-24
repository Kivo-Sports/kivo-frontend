"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Calendar, Users, Search, X } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/molecules/Card";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { containerVariants, fadeInUp, getFadeTransition, itemVariants } from "@/lib/motion";
import { obterStatusCampeonato, formatarPeriodo } from "@/lib/campeonato.ui";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import { FORMATO_CAMPEONATO, type FormatoCampeonato } from "@/types/campeonato";

const FILTROS: { key: string; label: string; status: string[] }[] = [
  { key: "todos", label: "Todos", status: [] },
  { key: "andamento", label: "Em andamento", status: ["EmAndamento"] },
  { key: "inscricoes", label: "Inscrições abertas", status: ["InscricoesAbertas"] },
  { key: "finalizados", label: "Finalizados", status: ["Finalizado"] },
];

function formatoLabel(formato: string): string {
  const cfg = FORMATO_CAMPEONATO[formato as FormatoCampeonato];
  return cfg ? cfg.label : formato;
}

export default function ExplorarCampeonatosPage() {
  const { data: campeonatos = [], isLoading } = useListarCampeonatosQuery();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const filtrados = useMemo(() => {
    const filtroAtivo = FILTROS.find((f) => f.key === filtro) ?? FILTROS[0];
    const termo = busca.trim().toLowerCase();
    return campeonatos
      .filter((c) => c.status !== "Rascunho")
      .filter((c) => filtroAtivo.status.length === 0 || filtroAtivo.status.includes(c.status))
      .filter((c) => termo === "" || c.nome.toLowerCase().includes(termo))
      .slice()
      .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
  }, [campeonatos, busca, filtro]);

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}
    >
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
        <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "var(--radius-lg)", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon icon={Trophy} size={20} style={{ color: "var(--color-brand-primary)" }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, color: "white" }}>Campeonatos</h1>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Explore os campeonatos da plataforma
          </p>
        </div>
      </div>

      {/* Busca + filtros */}
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
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {FILTROS.map((f) => {
            const ativo = filtro === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                style={{
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
      </div>

      {/* Conteúdo */}
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
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}
        >
          {filtrados.map((camp) => {
            const statusCfg = obterStatusCampeonato(camp.status);
            return (
              <motion.div key={camp.id} variants={itemVariants}>
                <Link href={`/campeonatos/${camp.id}`} style={{ textDecoration: "none" }}>
                  <Card
                    padding="md"
                    hoverable
                    style={{
                      background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "var(--radius-xl)",
                      cursor: "pointer",
                      height: "100%",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                      <Avatar name={camp.nome} src={camp.logoUrl || undefined} size="md" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {camp.nome}
                        </h2>
                        <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Icon icon={Calendar} size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {formatarPeriodo(camp.dataInicio, camp.dataFim)}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Icon icon={Users} size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {camp.totalTimes} {camp.totalTimes === 1 ? "time" : "times"} · {formatoLabel(camp.formatoCampeonato)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.main>
  );
}
