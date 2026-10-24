/**
 * @file (dashboard)/admin/page.tsx
 * @description Visão geral do painel admin — dashboard gerencial (filtros, indicadores,
 * gráficos e exportação) + atalhos para as áreas de gestão.
 */

"use client";

import { useRouter } from "next/navigation";
import { Trophy, Shield, Medal, ChevronRight, UserCog } from "lucide-react";

import { Icon } from "@/components/atoms/Icon";
import { Card } from "@/components/molecules/Card";
import { AdminDashboard } from "@/components/organisms/AdminDashboard";

const ATALHOS = [
  {
    title: "Campeonatos",
    description: "Editar em qualquer etapa, descancelar, excluir, reatribuir e gerir jogos.",
    href: "/admin/campeonatos",
    icon: Trophy,
  },
  {
    title: "Times",
    description: "Editar qualquer time, ativar/desativar, reatribuir dono e excluir.",
    href: "/admin/times",
    icon: Shield,
  },
  {
    title: "Esportes",
    description: "Modalidades disponíveis para times e campeonatos.",
    href: "/admin/esportes",
    icon: Medal,
  },
  {
    title: "Gerenciar Admins",
    description: "Criar, editar e ativar/desativar contas de administrador.",
    href: "/configuracoes/admin",
    icon: UserCog,
  },
];

export default function AdminOverviewPage() {
  const router = useRouter();

  return (
    <div>
      <AdminDashboard />

      <nav aria-label="Atalhos de gestão" style={{ marginTop: "var(--space-8)" }}>
        <h2
          style={{
            margin: "0 0 var(--space-4)",
            fontSize: "var(--text-base)",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          Gestão
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {ATALHOS.map((atalho) => (
            <button
              key={atalho.href}
              type="button"
              onClick={() => router.push(atalho.href)}
              style={{
                padding: 0,
                border: "none",
                background: "none",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <Card padding="md" hoverable style={{ height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <Icon icon={atalho.icon} size={20} color="var(--color-brand-primary)" />
                  <span style={{ flex: 1, fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {atalho.title}
                  </span>
                  <Icon icon={ChevronRight} size={18} color="var(--color-text-muted)" />
                </div>
                <p
                  style={{
                    margin: "var(--space-2) 0 0",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {atalho.description}
                </p>
              </Card>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
