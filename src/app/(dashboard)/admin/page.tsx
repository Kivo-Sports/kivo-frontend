/**
 * @file (dashboard)/admin/page.tsx
 * @description Visão geral do painel admin — estatísticas globais + atalhos.
 */

"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/molecules/Card";
import { ErrorState } from "@/components/molecules/ErrorState";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { Trophy, Shield, Medal, ScrollText, ChevronRight, UserCog } from "lucide-react";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import { useListarTodosTimesQuery } from "@/store/api/timeApi";
import { useListarEsportesQuery } from "@/store/api/esporteApi";

export default function AdminOverviewPage() {
  const router = useRouter();
  const {
    data: campeonatos = [],
    isLoading: carregandoCampeonatos,
    isError: erroCampeonatos,
    refetch: refetchCampeonatos,
  } = useListarCampeonatosQuery();
  const {
    data: times = [],
    isLoading: carregandoTimes,
    isError: erroTimes,
    refetch: refetchTimes,
  } = useListarTodosTimesQuery();
  const {
    data: esportes = [],
    isLoading: carregandoEsportes,
    isError: erroEsportes,
    refetch: refetchEsportes,
  } = useListarEsportesQuery();

  // Estados de carregamento/erro precisam ser distintos das metricas zeradas (BUG-001).
  const carregandoMetricas = carregandoCampeonatos || carregandoTimes || carregandoEsportes;
  const erroMetricas = erroCampeonatos || erroTimes || erroEsportes;

  const recarregarMetricas = () => {
    refetchCampeonatos();
    refetchTimes();
    refetchEsportes();
  };

  const emAndamento = campeonatos.filter((c) => c.status === "EmAndamento").length;
  const cancelados = campeonatos.filter((c) => c.status === "Cancelado").length;

  const stats = [
    { label: "Campeonatos", value: campeonatos.length, hint: `${emAndamento} em andamento`, icon: Trophy },
    { label: "Times", value: times.length, hint: "cadastrados", icon: Shield },
    { label: "Esportes", value: esportes.length, hint: `${esportes.filter((e) => e.ativo).length} ativos`, icon: Medal },
    { label: "Cancelados", value: cancelados, hint: "podem ser reativados", icon: ScrollText },
  ];

  const links = [
    { title: "Campeonatos", description: "Editar em qualquer etapa, descancelar, excluir, reatribuir e gerir jogos.", href: "/admin/campeonatos", icon: Trophy },
    { title: "Times", description: "Editar qualquer time, ativar/desativar, reatribuir dono e excluir.", href: "/admin/times", icon: Shield },
    { title: "Esportes", description: "Modalidades disponíveis para times e campeonatos.", href: "/admin/esportes", icon: Medal },
    { title: "Gerenciar Admins", description: "Criar, editar e ativar/desativar contas de administrador.", href: "/configuracoes/admin", icon: UserCog },
  ];

  return (
    <div>
      {/* Estatísticas */}
      {carregandoMetricas ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "var(--space-8)",
            marginBottom: "var(--space-8)",
          }}
          aria-busy="true"
        >
          <Spinner size="lg" ariaLabel="Carregando métricas" />
        </div>
      ) : erroMetricas ? (
        <div style={{ marginBottom: "var(--space-8)" }}>
          <ErrorState
            title="Não foi possível carregar as métricas"
            message="Houve uma falha de conexão com o servidor. Os números abaixo não representam zero de verdade."
            onRetry={recarregarMetricas}
          />
        </div>
      ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-8)",
        }}
      >
        {stats.map((stat) => (
          <Card
            key={stat.label}
            padding="lg"
            style={{
              background: "linear-gradient(160deg, rgba(0,230,118,0.06), rgba(255,255,255,0.02))",
              border: "1px solid rgba(0,230,118,0.18)",
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
              <Icon icon={stat.icon} size={20} color="var(--color-brand-primary)" />
            </div>
            <div style={{ fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 700, color: "white", lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ marginTop: "var(--space-2)" }}>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>{stat.label}</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}> · {stat.hint}</span>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
