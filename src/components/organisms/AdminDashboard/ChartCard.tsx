"use client";

import type { ReactNode } from "react";

import { Card } from "@/components/molecules/Card";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Controles alinhados à direita do título (ex.: alternância de métrica). */
  actions?: ReactNode;
  children: ReactNode;
}

/** Moldura padrão de um gráfico do dashboard: título, subtítulo e corpo. */
export function ChartCard({ title, subtitle, actions, children }: ChartCardProps) {
  return (
    <Card padding="lg" style={{ minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          flexWrap: "wrap",
          marginBottom: "var(--space-4)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: "var(--text-base)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-secondary)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}

export function ChartVazio({
  mensagem = "Sem dados para o filtro selecionado.",
}: {
  mensagem?: string;
}) {
  return (
    <p
      style={{
        margin: 0,
        padding: "var(--space-8) var(--space-4)",
        textAlign: "center",
        fontSize: "var(--text-sm)",
        color: "var(--color-text-secondary)",
      }}
    >
      {mensagem}
    </p>
  );
}
