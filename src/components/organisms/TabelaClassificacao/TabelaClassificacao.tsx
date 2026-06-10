"use client";

import { Avatar } from "@/components/atoms/Avatar";
import { Card } from "@/components/molecules/Card";
import type { TabelaClassificacaoResponse } from "@/types/partida";

const COLUNAS: { key: keyof TabelaClassificacaoResponse; label: string; title: string }[] = [
  { key: "pontos", label: "P", title: "Pontos" },
  { key: "jogos", label: "J", title: "Jogos" },
  { key: "vitorias", label: "V", title: "Vitórias" },
  { key: "empates", label: "E", title: "Empates" },
  { key: "derrotas", label: "D", title: "Derrotas" },
  { key: "golsFeitos", label: "GP", title: "Gols pró" },
  { key: "golsSofridos", label: "GC", title: "Gols contra" },
  { key: "saldoGols", label: "SG", title: "Saldo de gols" },
];

interface TabelaClassificacaoProps {
  tabela: TabelaClassificacaoResponse[];
  /** Quantidade de times que se classificam — destaca as primeiras posições. */
  destacarAte?: number;
}

/** Tabela de classificação (read-only), compartilhada entre telas públicas e de gestão. */
export function TabelaClassificacao({ tabela, destacarAte = 0 }: TabelaClassificacaoProps) {
  return (
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
          {tabela.map((linha) => {
            const classificado = destacarAte > 0 && linha.posicao <= destacarAte;
            return (
              <tr
                key={linha.timeId}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: classificado ? "rgba(0,230,118,0.05)" : "transparent",
                }}
              >
                <td style={{ padding: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 700, color: classificado || linha.posicao <= 3 ? "var(--color-brand-primary)" : "var(--color-text-muted)" }}>
                  {linha.posicao}
                </td>
                <td style={{ padding: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Avatar name={linha.nomeTime} src={linha.logoUrl || undefined} size="sm" />
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>{linha.nomeTime}</span>
                  </div>
                </td>
                {COLUNAS.map((col) => {
                  const valor = linha[col.key] as number;
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
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
