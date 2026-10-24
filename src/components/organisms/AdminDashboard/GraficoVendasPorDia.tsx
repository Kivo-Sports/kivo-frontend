"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard, ChartVazio } from "./ChartCard";
import { formatarDia, formatarMoeda, type PontoSerieDiaria } from "@/lib/relatorio.utils";

type Metrica = "receita" | "quantidade";

const METRICAS: { valor: Metrica; rotulo: string }[] = [
  { valor: "receita", rotulo: "Receita" },
  { valor: "quantidade", rotulo: "Ingressos" },
];

const formatarValor = (metrica: Metrica, valor: number) =>
  metrica === "receita" ? formatarMoeda(valor) : `${valor} ingresso${valor === 1 ? "" : "s"}`;

const formatarEixoY = (metrica: Metrica, valor: number) =>
  metrica === "receita"
    ? valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        notation: "compact",
        maximumFractionDigits: 1,
      })
    : valor.toLocaleString("pt-BR");

interface TooltipVendasProps {
  active?: boolean;
  payload?: { payload: PontoSerieDiaria }[];
  metrica: Metrica;
}

function TooltipVendas({ active, payload, metrica }: TooltipVendasProps) {
  if (!active || !payload?.length) return null;
  const ponto = payload[0].payload;
  return (
    <div
      style={{
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-elevated)",
        border: "1px solid var(--color-border-strong)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        fontSize: "var(--text-xs)",
      }}
    >
      <div style={{ color: "var(--color-text-muted)", marginBottom: 2 }}>
        {formatarDia(ponto.dia)}
      </div>
      <div style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
        {formatarValor(metrica, ponto[metrica])}
      </div>
      <div style={{ color: "var(--color-text-secondary)" }}>
        {formatarValor(
          metrica === "receita" ? "quantidade" : "receita",
          ponto[metrica === "receita" ? "quantidade" : "receita"],
        )}
      </div>
    </div>
  );
}

export interface GraficoVendasPorDiaProps {
  serie: PontoSerieDiaria[];
  /** Há confirmados sem data de pagamento (fora do gráfico): o vazio não significa "nenhum pagamento". */
  temConfirmadosSemData?: boolean;
}

/**
 * Linha do tempo de vendas confirmadas. Receita e quantidade têm escalas diferentes,
 * então a alternância troca a métrica em vez de sobrepor dois eixos Y.
 */
export function GraficoVendasPorDia({
  serie,
  temConfirmadosSemData = false,
}: GraficoVendasPorDiaProps) {
  const [metrica, setMetrica] = useState<Metrica>("receita");
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const temVendas = serie.some((p) => p.quantidade > 0);

  const alternancia = (
    <div
      role="group"
      aria-label="Métrica do gráfico"
      style={{ display: "flex", gap: "var(--space-1)" }}
    >
      {METRICAS.map((m) => {
        const ativo = m.valor === metrica;
        return (
          <button
            key={m.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => setMetrica(m.valor)}
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-md)",
              border: ativo
                ? "1px solid rgba(0,230,118,0.4)"
                : "1px solid var(--color-border-default)",
              background: ativo ? "rgba(0,230,118,0.12)" : "transparent",
              color: ativo ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {m.rotulo}
          </button>
        );
      })}
    </div>
  );

  return (
    <ChartCard
      title="Receita confirmada por dia"
      subtitle="Ingressos pagos ou utilizados, pela data do pagamento (horário de Brasília)"
      actions={alternancia}
    >
      {!temVendas ? (
        <ChartVazio
          mensagem={
            temConfirmadosSemData
              ? "Nenhum pagamento com data registrada no período. Os confirmados sem data não entram no gráfico diário."
              : "Nenhum pagamento confirmado no período."
          }
        />
      ) : (
        <>
          <div
            role="img"
            aria-label={`Gráfico de ${metrica === "receita" ? "receita" : "ingressos"} por dia, de ${formatarDia(serie[0].dia)} a ${formatarDia(serie[serie.length - 1].dia)}`}
            style={{ width: "100%", height: 280 }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 600, height: 280 }}
            >
              <AreaChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="kivoAreaVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-border-default)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="dia"
                  tickFormatter={(dia: string) => formatarDia(dia).slice(0, 5)}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tickFormatter={(v: number) => formatarEixoY(metrica, v)}
                  tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={metrica === "receita"}
                  width={64}
                />
                <Tooltip
                  content={<TooltipVendas metrica={metrica} />}
                  cursor={{
                    stroke: "var(--color-text-muted)",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={metrica}
                  stroke="var(--color-brand-primary)"
                  strokeWidth={2}
                  fill="url(#kivoAreaVendas)"
                  activeDot={{ r: 5, stroke: "var(--color-bg-surface)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <button
            type="button"
            onClick={() => setMostrarTabela((v) => !v)}
            aria-expanded={mostrarTabela}
            style={{
              marginTop: "var(--space-3)",
              padding: 0,
              border: "none",
              background: "none",
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-xs)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            {mostrarTabela ? "Ocultar tabela" : "Ver dias com pagamento em tabela"}
          </button>
          {mostrarTabela && (
            <div style={{ maxHeight: 240, overflowY: "auto", marginTop: "var(--space-2)" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}
              >
                {/* A tabela lista só os dias com pagamento; os demais dias do gráfico valem zero. */}
                <caption
                  style={{
                    captionSide: "top",
                    textAlign: "left",
                    padding: "0 4px var(--space-2)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Somente os dias com pagamento confirmado. Os demais dias do período têm valor zero
                  no gráfico.
                </caption>
                <thead>
                  <tr style={{ color: "var(--color-text-secondary)", textAlign: "left" }}>
                    <th style={{ padding: "6px 4px", fontWeight: 600 }}>Dia</th>
                    <th style={{ padding: "6px 4px", fontWeight: 600, textAlign: "right" }}>
                      Ingressos
                    </th>
                    <th style={{ padding: "6px 4px", fontWeight: 600, textAlign: "right" }}>
                      Receita
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {serie
                    .filter((p) => p.quantidade > 0)
                    .map((p) => (
                      <tr
                        key={p.dia}
                        style={{
                          borderTop: "1px solid var(--color-border-default)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        <td style={{ padding: "6px 4px" }}>{formatarDia(p.dia)}</td>
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {p.quantidade}
                        </td>
                        <td
                          style={{
                            padding: "6px 4px",
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatarMoeda(p.receita)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ChartCard>
  );
}
