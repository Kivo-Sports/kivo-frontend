"use client";

import { CheckCircle2, Clock, XCircle, type LucideIcon } from "lucide-react";

import { ChartCard, ChartVazio } from "./ChartCard";
import { Icon } from "@/components/atoms/Icon";
import {
  formatarPercentual,
  montarSituacaoIngressos,
  type ChaveSituacao,
} from "@/lib/relatorio.utils";
import type { ResumoFinanceiro } from "@/types/relatorio";

/**
 * Cores de status fixas (não seguem o tema) e sempre acompanhadas de ícone + rótulo,
 * para que a situação nunca dependa só da cor.
 */
const STATUS: Record<ChaveSituacao, { cor: string; icone: LucideIcon }> = {
  confirmados: { cor: "#0ca30c", icone: CheckCircle2 },
  pendentes: { cor: "#fab219", icone: Clock },
  cancelados: { cor: "#d03b3b", icone: XCircle },
};

export interface SituacaoIngressosProps {
  resumo: ResumoFinanceiro;
}

/** Parte-do-todo dos ingressos emitidos no período, como uma barra empilhada única. */
export function SituacaoIngressos({ resumo }: SituacaoIngressosProps) {
  const partes = montarSituacaoIngressos(resumo);
  const total = partes.reduce((soma, p) => soma + p.quantidade, 0);

  return (
    <ChartCard
      title="Situação dos ingressos emitidos no período"
      subtitle={`${total} ingresso${total === 1 ? "" : "s"} pela data da compra · situação atual de cada um`}
    >
      {total === 0 ? (
        <ChartVazio mensagem="Nenhum ingresso emitido no período." />
      ) : (
        <>
          <div
            role="img"
            aria-label={partes
              .map((p) => `${p.rotulo}: ${p.quantidade} (${formatarPercentual(p.percentual)})`)
              .join("; ")}
            style={{ display: "flex", gap: 2, height: 20, marginBottom: "var(--space-4)" }}
          >
            {partes
              .filter((p) => p.quantidade > 0)
              .map((p, i, visiveis) => (
                <div
                  key={p.chave}
                  title={`${p.rotulo}: ${p.quantidade} (${formatarPercentual(p.percentual)})`}
                  style={{
                    flexGrow: p.quantidade,
                    flexBasis: 0,
                    minWidth: 4,
                    background: STATUS[p.chave].cor,
                    borderTopLeftRadius: i === 0 ? 4 : 0,
                    borderBottomLeftRadius: i === 0 ? 4 : 0,
                    borderTopRightRadius: i === visiveis.length - 1 ? 4 : 0,
                    borderBottomRightRadius: i === visiveis.length - 1 ? 4 : 0,
                  }}
                />
              ))}
          </div>

          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: "var(--space-2)",
            }}
          >
            {partes.map((p) => (
              <li
                key={p.chave}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <Icon icon={STATUS[p.chave].icone} size={16} color={STATUS[p.chave].cor} />
                  {p.rotulo}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums" }}>
                  <strong style={{ color: "var(--color-text-primary)" }}>{p.quantidade}</strong>
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {" "}
                    · {formatarPercentual(p.percentual)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ChartCard>
  );
}
