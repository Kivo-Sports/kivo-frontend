"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Card } from "@/components/molecules/Card";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { fadeInUp, getFadeTransition } from "@/lib/motion";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import { useObterClassificacaoQuery } from "@/store/api/partidaApi";

const COLUNAS: { key: string; label: string; title: string }[] = [
  { key: "pontos", label: "P", title: "Pontos" },
  { key: "jogos", label: "J", title: "Jogos" },
  { key: "vitorias", label: "V", title: "Vitórias" },
  { key: "empates", label: "E", title: "Empates" },
  { key: "derrotas", label: "D", title: "Derrotas" },
  { key: "golsFeitos", label: "GP", title: "Gols pró" },
  { key: "golsSofridos", label: "GC", title: "Gols contra" },
  { key: "saldoGols", label: "SG", title: "Saldo de gols" },
];

export default function ClassificacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: campeonatos = [], isLoading: loadingCamp } = useListarCampeonatosQuery();
  const campeonato = campeonatos.find((c) => c.id === id) ?? null;

  const { data: tabela = [], isLoading: loadingTabela } = useObterClassificacaoQuery(id, {
    skip: !campeonato,
  });

  if (loadingCamp) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="lg" ariaLabel="Carregando" />
      </main>
    );
  }

  if (!campeonato) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
        <p style={{ color: "var(--color-feedback-danger)", margin: 0 }}>Campeonato não encontrado.</p>
        <Link href="/organizador/campeonatos" style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
          Voltar para campeonatos
        </Link>
      </main>
    );
  }

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "880px", margin: "0 auto", padding: "var(--space-6) var(--space-4)" }}
    >
      <div style={{ marginBottom: "var(--space-5)" }}>
        <Link
          href={`/organizador/campeonatos/${id}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-muted)", textDecoration: "none", fontSize: "var(--text-sm)" }}
        >
          <Icon icon={ArrowLeft} size={14} />
          Voltar para {campeonato.nome}
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "var(--radius-lg)", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon icon={BarChart3} size={20} style={{ color: "var(--color-brand-primary)" }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, color: "white" }}>Tabela de Classificação</h1>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{campeonato.nome}</p>
        </div>
      </div>

      {loadingTabela ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="md" ariaLabel="Carregando classificação" />
        </div>
      ) : tabela.length === 0 ? (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>
            Classificação indisponível
          </p>
          <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            A tabela aparece após os jogos serem gerados e os placares lançados.
          </p>
          <Link
            href={`/organizador/campeonatos/${id}/jogos`}
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontSize: "var(--text-sm)", fontWeight: 600 }}
          >
            Ir para Jogos &amp; Placares
          </Link>
        </Card>
      ) : (
        <Card padding="md" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ padding: "var(--space-2)", textAlign: "left", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, width: "32px" }}>#</th>
                <th style={{ padding: "var(--space-2)", textAlign: "left", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>Time</th>
                {COLUNAS.map((col) => (
                  <th key={col.key} title={col.title} style={{ padding: "var(--space-2)", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, width: "44px" }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabela.map((linha) => (
                <tr key={linha.timeId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 700, color: linha.posicao <= 3 ? "var(--color-brand-primary)" : "var(--color-text-muted)" }}>
                    {linha.posicao}
                  </td>
                  <td style={{ padding: "var(--space-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Avatar name={linha.nomeTime} src={linha.logoUrl || undefined} size="sm" />
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>{linha.nomeTime}</span>
                    </div>
                  </td>
                  {COLUNAS.map((col) => {
                    const valor = linha[col.key as keyof typeof linha] as number;
                    return (
                      <td
                        key={col.key}
                        style={{ padding: "var(--space-2)", textAlign: "center", fontSize: "var(--text-sm)", fontWeight: col.key === "pontos" ? 700 : 400, color: col.key === "pontos" ? "white" : "var(--color-text-secondary)" }}
                      >
                        {valor}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </motion.main>
  );
}
