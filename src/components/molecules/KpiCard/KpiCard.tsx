/**
 * @file KpiCard.tsx
 * @description Cartão de indicador (número principal + rótulo + dica) usado nos dashboards.
 * Mesmo visual dos cartões de estatística que já existiam inline no painel admin.
 */

"use client";

import type { LucideIcon } from "lucide-react";

import { Icon } from "@/components/atoms/Icon";
import { Card } from "@/components/molecules/Card";

export interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  /** Selo curto no canto (ex.: "Situação atual" para indicadores que ignoram o período). */
  badge?: string;
}

export function KpiCard({ label, value, hint, icon, badge }: KpiCardProps) {
  return (
    <Card
      padding="lg"
      style={{
        background: "linear-gradient(160deg, rgba(0,230,118,0.06), rgba(255,255,255,0.02))",
        border: "1px solid rgba(0,230,118,0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-2)",
        }}
      >
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "var(--radius-md)",
            background: "rgba(0,230,118,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "var(--space-3)",
          }}
        >
          <Icon icon={icon} size={20} color="var(--color-brand-primary)" />
        </div>
        {badge && (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "999px",
              border: "1px solid var(--color-border-strong)",
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: "clamp(22px, 3vw, 30px)",
          whiteSpace: "nowrap",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: "var(--space-2)" }}>
        <span
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          {label}
        </span>
        {hint && (
          // text-secondary (não muted): a dica carrega a definição do número e precisa de contraste legível.
          <div
            style={{
              marginTop: 2,
              fontSize: "var(--text-xs)",
              color: "var(--color-text-secondary)",
            }}
          >
            {hint}
          </div>
        )}
      </div>
    </Card>
  );
}
