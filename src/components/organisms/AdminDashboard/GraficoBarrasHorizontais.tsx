"use client";

import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard, ChartVazio } from "./ChartCard";
import { quebrarRotulo } from "@/lib/relatorio.utils";

export interface ItemBarra {
  nome: string;
  quantidade: number;
}

export interface GraficoBarrasHorizontaisProps {
  title: string;
  subtitle?: string;
  itens: ItemBarra[];
  /** Ex.: "campeonato" → tooltip "3 campeonatos". */
  unidade: { singular: string; plural: string };
  mensagemVazio?: string;
}

const ALTURA_BARRA = 36;
/** Largura média de um caractere a 12px, para estimar quantos cabem no eixo. */
const LARGURA_CARACTERE = 6.6;

interface TickNomeProps {
  x?: number;
  y?: number;
  payload?: { value: string };
  maxCaracteres: number;
}

/** Altura de linha (px) dos rótulos de 12px; cabem duas linhas na altura de cada barra. */
const ALTURA_LINHA_ROTULO = 13;

/**
 * Rótulo do eixo em até duas linhas, cortado com reticências se ainda não couber;
 * o nome completo fica no <title> (tooltip nativo e leitores de tela).
 */
function TickNome({ x = 0, y = 0, payload, maxCaracteres }: TickNomeProps) {
  const nome = payload?.value ?? "";
  const linhas = quebrarRotulo(nome, maxCaracteres);
  const deslocamentoInicial = 4 - ((linhas.length - 1) * ALTURA_LINHA_ROTULO) / 2;
  return (
    <text x={x} y={y} textAnchor="end" fill="var(--color-text-secondary)" fontSize={12}>
      <title>{nome}</title>
      {linhas.map((linha, i) => (
        <tspan key={i} x={x} dy={i === 0 ? deslocamentoInicial : ALTURA_LINHA_ROTULO}>
          {linha}
        </tspan>
      ))}
    </text>
  );
}

export function GraficoBarrasHorizontais({
  title,
  subtitle,
  itens,
  unidade,
  mensagemVazio,
}: GraficoBarrasHorizontaisProps) {
  const ordenados = [...itens].sort((a, b) => b.quantidade - a.quantidade);
  const conteinerRef = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);

  // Em telas estreitas o eixo encolhe (até 88px) para sobrar espaço para as barras.
  useEffect(() => {
    const elemento = conteinerRef.current;
    if (!elemento) return;
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);
  const larguraEixo = largura > 0 ? Math.min(180, Math.max(88, Math.round(largura * 0.38))) : 170;
  const maxCaracteres = Math.floor((larguraEixo - 8) / LARGURA_CARACTERE);
  const altura = ordenados.length * ALTURA_BARRA + 16;
  const rotular = (valor: number) => `${valor} ${valor === 1 ? unidade.singular : unidade.plural}`;

  return (
    <ChartCard title={title} subtitle={subtitle}>
      {ordenados.length === 0 ? (
        <ChartVazio mensagem={mensagemVazio} />
      ) : (
        <div
          ref={conteinerRef}
          role="img"
          aria-label={`${title}: ${ordenados.map((i) => `${i.nome}, ${rotular(i.quantidade)}`).join("; ")}`}
          style={{ width: "100%", height: altura }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 400, height: altura }}
          >
            <BarChart
              data={ordenados}
              layout="vertical"
              margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
              barCategoryGap={8}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="nome"
                width={larguraEixo}
                tick={<TickNome maxCaracteres={maxCaracteres} />}
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                formatter={(valor) => [rotular(Number(valor)), ""]}
                separator=""
                contentStyle={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border-strong)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "var(--text-xs)",
                }}
                labelStyle={{ color: "var(--color-text-secondary)" }}
                itemStyle={{ color: "var(--color-text-primary)", fontWeight: 700 }}
              />
              <Bar
                dataKey="quantidade"
                fill="var(--color-brand-primary)"
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="quantidade"
                  position="right"
                  style={{ fill: "var(--color-text-secondary)", fontSize: 12, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
