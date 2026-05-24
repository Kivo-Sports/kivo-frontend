"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, MapPin, Trophy, Search, X } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Card } from "@/components/molecules/Card";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { containerVariants, fadeInUp, getFadeTransition, itemVariants } from "@/lib/motion";
import { useListarTodosOsTimesQuery, useListarCampeonatosQuery } from "@/store/api/campeonatoApi";

export default function ExplorarTimesPage() {
  const { data: times = [], isLoading } = useListarTodosOsTimesQuery();
  const { data: campeonatos = [] } = useListarCampeonatosQuery();
  const [busca, setBusca] = useState("");

  const contagemPorTime = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const c of campeonatos) {
      for (const timeId of c.times ?? []) {
        mapa.set(timeId, (mapa.get(timeId) ?? 0) + 1);
      }
    }
    return mapa;
  }, [campeonatos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return times
      .filter((t) => t.ativo)
      .filter(
        (t) =>
          termo === "" ||
          t.nome.toLowerCase().includes(termo) ||
          t.cidade.toLowerCase().includes(termo) ||
          t.estado.toLowerCase().includes(termo),
      )
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [times, busca]);

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
          <Icon icon={Users} size={20} style={{ color: "var(--color-brand-primary)" }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, color: "white" }}>Times</h1>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Explore os times da plataforma
          </p>
        </div>
      </div>

      {/* Busca */}
      <div style={{ position: "relative", maxWidth: "420px", marginBottom: "var(--space-5)" }}>
        <Icon icon={Search} size={14} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="Buscar por nome, cidade ou estado..."
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

      {/* Conteúdo */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="lg" ariaLabel="Carregando times" />
        </div>
      ) : filtrados.length === 0 ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
            <Icon icon={Users} size={22} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>
            Nenhum time encontrado
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {busca ? "Ajuste a busca." : "Ainda não há times cadastrados."}
          </p>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-3)" }}
        >
          {filtrados.map((time) => {
            const qtd = contagemPorTime.get(time.id) ?? 0;
            return (
              <motion.div key={time.id} variants={itemVariants}>
                <Link href={`/times/${time.id}`} style={{ textDecoration: "none" }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <Avatar name={time.nome} src={time.logoUrl || undefined} size="md" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ margin: "0 0 2px", fontSize: "var(--text-base)", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {time.nome}
                        </h2>
                        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Icon icon={MapPin} size={11} />
                          {time.cidade} · {time.estado}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icon icon={Trophy} size={13} style={{ color: "var(--color-text-muted)" }} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        {qtd} {qtd === 1 ? "campeonato" : "campeonatos"}
                      </span>
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
