/**
 * @file (dashboard)/admin/campeonatos/page.tsx
 * @description Lista TODOS os campeonatos da plataforma com ações administrativas.
 */

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/molecules/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  Rascunho: { label: "Rascunho", variant: "default" },
  InscricoesAbertas: { label: "Inscrições Abertas", variant: "success" },
  InscricoesEncerradas: { label: "Inscrições Encerradas", variant: "warning" },
  Pausado: { label: "Pausado", variant: "warning" },
  EmAndamento: { label: "Em Andamento", variant: "info" },
  Finalizado: { label: "Finalizado", variant: "default" },
  Cancelado: { label: "Cancelado", variant: "danger" },
};

export default function AdminCampeonatosPage() {
  const router = useRouter();
  const { data: campeonatos = [], isLoading } = useListarCampeonatosQuery();

  const [busca, setBusca] = useState("");

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return campeonatos;
    return campeonatos.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        (c.organizadorNome ?? "").toLowerCase().includes(termo),
    );
  }, [campeonatos, busca]);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
          Todos os Campeonatos
        </h2>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou organizador..."
          style={{
            flex: "1 1 240px",
            maxWidth: "360px",
            height: "3rem",
            padding: "0 var(--space-3)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border-default)",
            background: "var(--color-bg-input)",
            color: "var(--color-text-primary)",
            fontSize: "var(--text-sm)",
          }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="lg" ariaLabel="Carregando campeonatos" />
        </div>
      ) : lista.length === 0 ? (
        <Card padding="lg">
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Nenhum campeonato encontrado.</p>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {lista.map((c) => {
            const status = STATUS_CONFIG[c.status] ?? { label: c.status, variant: "default" as const };
            return (
              <Card key={c.id} padding="md" style={{ border: "1px solid rgba(0,230,118,0.12)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
                      <h3 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 700, color: "white" }}>{c.nome}</h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {c.esporteNome ?? "—"} · {c.formatoCampeonato} · {c.totalTimes} times · Org.: {c.organizadorNome ?? "—"}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/campeonatos/${c.id}`)}>
                      Gerenciar
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
