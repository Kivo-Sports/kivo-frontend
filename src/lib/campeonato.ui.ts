import type { BadgeVariant } from "@/components/atoms/Badge";

/** Configuração visual compartilhada para os status de campeonato. */
export const CAMPEONATO_STATUS: Record<
  string,
  { label: string; variant: BadgeVariant; color: string; border: string; bg: string }
> = {
  Rascunho: {
    label: "Rascunho",
    variant: "default",
    color: "var(--color-text-muted)",
    border: "rgba(255,255,255,0.08)",
    bg: "rgba(255,255,255,0.03)",
  },
  InscricoesAbertas: {
    label: "Inscrições Abertas",
    variant: "success",
    color: "var(--color-brand-primary)",
    border: "rgba(0,230,118,0.3)",
    bg: "rgba(0,230,118,0.08)",
  },
  InscricoesEncerradas: {
    label: "Inscrições Encerradas",
    variant: "warning",
    color: "rgba(255,193,7,0.9)",
    border: "rgba(255,193,7,0.3)",
    bg: "rgba(255,193,7,0.08)",
  },
  EmAndamento: {
    label: "Em Andamento",
    variant: "info",
    color: "#60a5fa",
    border: "rgba(96,165,250,0.3)",
    bg: "rgba(96,165,250,0.08)",
  },
  Finalizado: {
    label: "Finalizado",
    variant: "default",
    color: "var(--color-text-secondary)",
    border: "rgba(255,255,255,0.1)",
    bg: "rgba(255,255,255,0.04)",
  },
  Cancelado: {
    label: "Cancelado",
    variant: "danger",
    color: "var(--color-feedback-danger)",
    border: "rgba(255,72,68,0.3)",
    bg: "rgba(255,72,68,0.08)",
  },
};

export function obterStatusCampeonato(status: string) {
  return CAMPEONATO_STATUS[status] ?? CAMPEONATO_STATUS.Rascunho;
}

/** Formata um intervalo de datas: "01/05/2026 → 30/06/2026". */
export function formatarPeriodo(dataInicio: string, dataFim: string): string {
  const inicio = new Date(dataInicio).toLocaleDateString("pt-BR");
  const fim = new Date(dataFim).toLocaleDateString("pt-BR");
  return `${inicio} → ${fim}`;
}

/** Formata data (e hora, se houver) de uma partida. Retorna null se inválida. */
export function formatarDataJogo(dataHora: string | null): string | null {
  if (!dataHora) return null;
  const data = new Date(dataHora);
  if (Number.isNaN(data.getTime())) return null;
  const dia = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const temHora = data.getHours() !== 0 || data.getMinutes() !== 0;
  return temHora ? `${dia} · ${hora}` : dia;
}
