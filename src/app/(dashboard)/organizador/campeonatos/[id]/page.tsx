"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Trophy, Calendar, Users, Star,
  CheckCircle, XCircle, UserPlus, AlertTriangle,
  Search, X, Clock, Play, Lock, Bell,
  Activity, FileText, Award, Pencil,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { useToast } from "@/components/atoms/Toast";
import { containerVariants, fadeInUp, getFadeTransition, itemVariants } from "@/lib/motion";
import {
  useListarCampeonatosQuery,
  useAbrirInscricoesMutation,
  useCancelarCampeonatoMutation,
  useConvidarTimeMutation,
  useListarTodosOsTimesQuery,
  useListarConvitesCampeonatoQuery,
} from "@/store/api/campeonatoApi";
import type { CampeonatoResponse } from "@/types/campeonato";
import type { TimeResponse } from "@/types/time";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  Rascunho:             { label: "Rascunho",              variant: "default" },
  InscricoesAbertas:    { label: "Inscrições Abertas",    variant: "success" },
  InscricoesEncerradas: { label: "Inscrições Encerradas", variant: "warning" },
  EmAndamento:          { label: "Em Andamento",          variant: "info"    },
  Finalizado:           { label: "Finalizado",            variant: "default" },
  Cancelado:            { label: "Cancelado",             variant: "danger"  },
};

const STATUS_LINE: Record<string, string> = {
  Rascunho:          "rgba(200,200,200,0.4)",
  InscricoesAbertas: "linear-gradient(90deg, rgba(0,230,118,0.9), rgba(0,230,118,0.1))",
  EmAndamento:       "linear-gradient(90deg, rgba(96,165,250,0.9), rgba(96,165,250,0.1))",
  Finalizado:        "rgba(180,180,180,0.3)",
  Cancelado:         "linear-gradient(90deg, rgba(255,72,68,0.9), rgba(255,72,68,0.1))",
};

// ─── Funcionalidades futuras ──────────────────────────────────────────────────

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Activity,  title: "Tabela de Classificação", desc: "Acompanhe pontuação e posição de cada time em tempo real." },
  { icon: Trophy,    title: "Rodadas e Partidas",       desc: "Organize e registre resultados de cada jogo do campeonato." },
  { icon: Activity,  title: "Estatísticas",             desc: "Métricas detalhadas por time: gols, assistências, cartões." },
  { icon: FileText,  title: "Regulamento",              desc: "Publique as regras oficiais acessíveis a todos os times." },
  { icon: Award,     title: "Premiação",                desc: "Configure troféus e reconhecimentos para os melhores." },
  { icon: Bell,      title: "Notificações",             desc: "Avise os times sobre partidas, resultados e mudanças." },
];

// ─── Modal: Convidar Time ─────────────────────────────────────────────────────

function ConvidarTimeModal({ campeonato, onClose, convidadosIniciais }: { campeonato: CampeonatoResponse; onClose: () => void; convidadosIniciais: string[] }) {
  const [busca, setBusca]               = useState("");
  const [convidandoId, setConvidandoId] = useState<string | null>(null);
  const [convidados, setConvidados]     = useState<Set<string>>(() => new Set(convidadosIniciais));
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: todosOsTimes = [], isLoading } = useListarTodosOsTimesQuery();
  const [convidarTime] = useConvidarTimeMutation();

  const timesFiltrados = todosOsTimes.filter(
    (t) => t.ativo && (busca === "" || t.nome.toLowerCase().includes(busca.toLowerCase()) || t.cidade.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleConvidar = async (time: TimeResponse) => {
    setConvidandoId(time.id);
    try {
      await convidarTime({ campeonatoId: campeonato.id, timeId: time.id }).unwrap();
      setConvidados((prev) => new Set([...prev, time.id]));
      toastSuccess(`Convite enviado para ${time.nome}!`);
    } catch {
      toastError("Não foi possível enviar o convite. Tente novamente.", "Erro");
    } finally {
      setConvidandoId(null);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "480px", background: "rgba(18,18,18,0.99)", border: "1px solid rgba(0,230,118,0.25)", borderRadius: "var(--radius-2xl)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", maxHeight: "80vh", overflow: "hidden" }}
      >
        <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-brand-primary)" }}>
              Convidar Time
            </p>
            <h2 style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-lg)", fontWeight: 600, color: "white" }}>
              {campeonato.nome}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            <Icon icon={X} size={16} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4) var(--space-5)", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <Icon icon={Search} size={14} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Buscar por nome ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ width: "100%", padding: "var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 22px)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", color: "white", fontSize: "var(--text-sm)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "0 var(--space-5) var(--space-4)" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-6)" }}>
              <Spinner size="md" ariaLabel="Carregando times" />
            </div>
          ) : timesFiltrados.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-6)", fontSize: "var(--text-sm)" }}>
              {busca ? "Nenhum time encontrado." : "Nenhum time ativo disponível."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {timesFiltrados.map((time) => {
                const jaConvidado = convidados.has(time.id);
                return (
                  <div
                    key={time.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: jaConvidado ? "rgba(0,230,118,0.04)" : "rgba(255,255,255,0.03)", border: `1px solid ${jaConvidado ? "rgba(0,230,118,0.15)" : "rgba(255,255,255,0.05)"}`, transition: "background 0.15s" }}
                    onMouseEnter={(e) => { if (!jaConvidado) e.currentTarget.style.background = "rgba(0,230,118,0.04)"; }}
                    onMouseLeave={(e) => { if (!jaConvidado) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
                      <Avatar name={time.nome} src={time.logoUrl || undefined} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "white", fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{time.nome}</p>
                        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{time.cidade} · {time.estado}</p>
                      </div>
                    </div>
                    {jaConvidado ? (
                      <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-feedback-success)", background: "color-mix(in srgb, var(--color-feedback-success) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-feedback-success) 30%, transparent)" }}>
                        <Icon icon={CheckCircle} size={11} />
                        Convidado
                      </span>
                    ) : (
                      <Button variant="primary" size="sm" loading={convidandoId === time.id} onClick={() => handleConvidar(time)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <Icon icon={UserPlus} size={13} />
                        Convidar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Cancelar Campeonato ───────────────────────────────────────────────

function CancelarModal({ nome, onConfirm, onClose, isLoading }: { nome: string; onConfirm: () => void; onClose: () => void; isLoading: boolean }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "400px", background: "rgba(18,18,18,0.99)", border: "1px solid rgba(255,72,68,0.3)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", textAlign: "center" }}
      >
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,72,68,0.1)", border: "1px solid rgba(255,72,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
          <Icon icon={AlertTriangle} size={22} style={{ color: "var(--color-feedback-danger)" }} />
        </div>
        <h2 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)", fontWeight: 600, color: "white" }}>
          Cancelar campeonato?
        </h2>
        <p style={{ margin: "0 0 var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          <strong style={{ color: "white" }}>{nome}</strong> será marcado como cancelado. Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Voltar</Button>
          <Button variant="danger" onClick={onConfirm} loading={isLoading} style={{ minWidth: "140px" }}>
            Cancelar campeonato
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Página de detalhes ───────────────────────────────────────────────────────

export default function DetalhesCampeonatoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [modalConvidar, setModalConvidar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [teamSearch, setTeamSearch]       = useState("");

  const { data: todos = [], isLoading }         = useListarCampeonatosQuery();
  const { data: todosOsTimes = [] }             = useListarTodosOsTimesQuery();
  const { data: convitesCampeonato = [] }       = useListarConvitesCampeonatoQuery(id);
  const [abrirInscricoes, { isLoading: isAbrindo }]       = useAbrirInscricoesMutation();
  const [cancelarCampeonato, { isLoading: isCancelando }] = useCancelarCampeonatoMutation();

  const campeonato = todos.find((c) => c.id === id) ?? null;

  const participacoesDisplay = convitesCampeonato.map((convite) => {
    const t = todosOsTimes.find((x) => x.id === convite.timeId);
    const aceito =
      convite.statusParticipacao === "Aceito" ? true :
      convite.statusParticipacao === "Recusado" ? false : null;
    return {
      participacaoId: convite.participacaoId,
      timeId: convite.timeId,
      nomeTime: t?.nome ?? convite.nomeTime,
      logoUrl: t?.logoUrl ?? null,
      cidade: t?.cidade ?? "",
      estado: t?.estado ?? "",
      convidadoEm: convite.convidadoEm,
      aceito: aceito as boolean | null,
    };
  });

  const todosConvidadosIds = convitesCampeonato.map((c) => c.timeId);

  const participacoesBuscadas = participacoesDisplay.filter((p) =>
    teamSearch === "" ||
    p.nomeTime.toLowerCase().includes(teamSearch.toLowerCase()) ||
    p.cidade.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const handleAbrirInscricoes = async () => {
    if (!campeonato) return;
    try {
      await abrirInscricoes(campeonato.id).unwrap();
      toastSuccess("Inscrições abertas com sucesso!");
    } catch {
      toastError("Não foi possível abrir as inscrições. Tente novamente.", "Erro");
    }
  };

  const handleConfirmarCancelamento = async () => {
    if (!campeonato) return;
    try {
      await cancelarCampeonato(campeonato.id).unwrap();
      toastSuccess(`${campeonato.nome} foi cancelado.`);
      setModalCancelar(false);
      router.push("/organizador/campeonatos");
    } catch {
      toastError("Não foi possível cancelar. Tente novamente.", "Erro");
    }
  };

  // ─── Loading / not found ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="lg" ariaLabel="Carregando campeonato" />
      </main>
    );
  }

  if (!campeonato) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
        <p style={{ color: "var(--color-feedback-danger)", margin: 0 }}>Campeonato não encontrado.</p>
        <Link href="/organizador/campeonatos" style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
          Voltar para campeonatos
        </Link>
      </main>
    );
  }

  const statusCfg  = STATUS_CONFIG[campeonato.status] ?? { label: campeonato.status, variant: "default" as const };
  const dataInicio = new Date(campeonato.dataInicio);
  const dataFim    = new Date(campeonato.dataFim);

  const diasParaInicio = Math.ceil((dataInicio.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const diasParaFim    = Math.ceil((dataFim.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const contagem = (() => {
    switch (campeonato.status) {
      case "Rascunho":
      case "InscricoesAbertas":
      case "InscricoesEncerradas":
        return diasParaInicio > 0
          ? { valor: diasParaInicio, label: "Dias p/ início" }
          : { valor: null as null, label: "Iniciando" };
      case "EmAndamento":
        return diasParaFim > 0
          ? { valor: diasParaFim, label: "Dias p/ fim" }
          : { valor: null as null, label: "Encerrando" };
      case "Finalizado":
        return { valor: null as null, label: "Finalizado" };
      case "Cancelado":
        return { valor: null as null, label: "Cancelado" };
      default:
        return { valor: null as null, label: "—" };
    }
  })();
  const podeConvidar   = campeonato.status === "InscricoesAbertas";
  const podeAbrir      = campeonato.status === "Rascunho";
  const podeCancelar   = !["Finalizado", "Cancelado"].includes(campeonato.status);
  const isClosed       = ["Finalizado", "Cancelado"].includes(campeonato.status);

  const grpConfirmados = participacoesBuscadas.filter((p) => p.aceito === true);
  const grpPendentes   = participacoesBuscadas.filter((p) => p.aceito === null);
  const grpRecusados   = participacoesBuscadas.filter((p) => p.aceito === false);

  const mostrarTodos = campeonato.status === "InscricoesAbertas";

  const GRUPOS = [
    { key: "confirmados", label: "Confirmados", items: grpConfirmados, color: "var(--color-feedback-success)",  bg: "rgba(0,230,118,0.06)",  border: "rgba(0,230,118,0.18)",  icon: CheckCircle },
    ...(mostrarTodos ? [
      { key: "pendentes", label: "Pendentes",   items: grpPendentes,   color: "rgba(255,193,7,0.9)",            bg: "rgba(255,193,7,0.06)",  border: "rgba(255,193,7,0.2)",   icon: Clock       },
      { key: "recusados", label: "Recusados",   items: grpRecusados,   color: "var(--color-feedback-danger)",   bg: "rgba(255,72,68,0.06)",  border: "rgba(255,72,68,0.18)",  icon: XCircle     },
    ] : []),
  ].filter((g) => g.items.length > 0);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "var(--space-6) var(--space-4)" }}
    >
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: "var(--space-5)" }}
      >
        <Link
          href="/organizador/campeonatos"
          style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-muted)", textDecoration: "none", fontSize: "var(--text-sm)", transition: "color 0.15s" }}
        >
          <Icon icon={ArrowLeft} size={14} />
          Voltar para campeonatos
        </Link>
      </motion.div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.04 }}
        style={{ marginBottom: "var(--space-6)" }}
      >
        <Card
          padding="lg"
          style={{
            background: "linear-gradient(145deg, rgba(0,230,118,0.12) 0%, rgba(0,0,0,0.65) 70%)",
            border: "1px solid rgba(0,230,118,0.2)",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            aria-hidden="true"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "3px", background: STATUS_LINE[campeonato.status] ?? "rgba(255,255,255,0.2)" }}
          />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-5)", alignItems: "flex-start" }}>
            {/* Ícone + título */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flex: 1, minWidth: "240px" }}>
              <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "var(--radius-lg)", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon icon={Trophy} size={24} style={{ color: "var(--color-brand-primary)" }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
                  <h1 style={{ margin: 0, fontSize: "clamp(1.3rem, 3vw, 2rem)", fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                    {campeonato.nome}
                  </h1>
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <Icon icon={Calendar} size={13} style={{ color: "var(--color-text-muted)" }} />
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {dataInicio.toLocaleDateString("pt-BR")} → {dataFim.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <Icon icon={Clock} size={13} style={{ color: "var(--color-text-muted)" }} />
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      Criado em {new Date(campeonato.criadoEm).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div data-camp-hero-stats style={{ display: "flex", gap: "var(--space-5)", flexShrink: 0, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-brand-primary)", lineHeight: 1 }}>
                  {campeonato.totalTimes}
                </p>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Times
                </p>
              </div>
              <div data-camp-stat-divider style={{ width: 1, background: "rgba(255,255,255,0.08)", alignSelf: "stretch" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "var(--text-3xl)", fontWeight: 700, color: contagem.valor != null ? "white" : "var(--color-text-muted)", lineHeight: 1 }}>
                  {contagem.valor ?? "—"}
                </p>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  {contagem.label}
                </p>
              </div>
              <div data-camp-stat-divider style={{ width: 1, background: "rgba(255,255,255,0.08)", alignSelf: "stretch" }} />
              {/* Pontuação compacta */}
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-feedback-success)" }}>V {campeonato.pontosVitoria}</span>
                  <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-feedback-warning)" }}>E {campeonato.pontosEmpate}</span>
                  <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-muted)" }}>D {campeonato.pontosDerrota}</span>
                </div>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Pontuação
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div
        data-camp-grid
        style={{ display: "grid", gridTemplateColumns: "minmax(0,5fr) minmax(0,7fr)", gap: "var(--space-6)", alignItems: "start" }}
      >
        {/* ── Esquerda: Ações + Configurações ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
        >
          {/* Ações */}
          <Card
            padding="md"
            style={{ background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "var(--radius-2xl)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
          >
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Ações disponíveis
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {/* Abrir inscrições */}
              {podeAbrir && (
                <Button
                  variant="primary"
                  fullWidth
                  loading={isAbrindo}
                  onClick={handleAbrirInscricoes}
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)" }}
                >
                  <Icon icon={Play} size={14} />
                  Abrir Inscrições
                </Button>
              )}

              {/* Convidar time */}
              {podeConvidar && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setModalConvidar(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)" }}
                >
                  <Icon icon={UserPlus} size={14} />
                  Convidar Time
                </Button>
              )}

              {/* Encerrar inscrições — placeholder */}
              {podeConvidar && (
                <Button
                  variant="ghost"
                  fullWidth
                  disabled
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)", opacity: 0.45, cursor: "not-allowed" }}
                >
                  <Icon icon={Lock} size={14} />
                  Encerrar Inscrições
                  <span style={{ marginLeft: "auto", fontSize: "10px", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "var(--radius-full)", letterSpacing: "0.05em" }}>
                    Em breve
                  </span>
                </Button>
              )}

              {/* Iniciar campeonato — placeholder */}
              {campeonato.status === "InscricoesAbertas" && (
                <Button
                  variant="ghost"
                  fullWidth
                  disabled
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)", opacity: 0.45, cursor: "not-allowed" }}
                >
                  <Icon icon={Lock} size={14} />
                  Iniciar Campeonato
                  <span style={{ marginLeft: "auto", fontSize: "10px", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "var(--radius-full)", letterSpacing: "0.05em" }}>
                    Em breve
                  </span>
                </Button>
              )}

              {/* Encerrar campeonato — placeholder */}
              {campeonato.status === "EmAndamento" && (
                <Button
                  variant="ghost"
                  fullWidth
                  disabled
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)", opacity: 0.45, cursor: "not-allowed" }}
                >
                  <Icon icon={Lock} size={14} />
                  Encerrar Campeonato
                  <span style={{ marginLeft: "auto", fontSize: "10px", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "var(--radius-full)", letterSpacing: "0.05em" }}>
                    Em breve
                  </span>
                </Button>
              )}

              {/* Finalizado/Cancelado — read-only notice */}
              {isClosed && (
                <div style={{ padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    Este campeonato está encerrado e não aceita mais ações.
                  </p>
                </div>
              )}

              {/* Cancelar */}
              {podeCancelar && (
                <>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "var(--space-1) 0" }} />
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => setModalCancelar(true)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)", color: "var(--color-feedback-danger)", border: "1px solid rgba(255,72,68,0.25)" }}
                  >
                    <Icon icon={XCircle} size={14} />
                    Cancelar campeonato
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Configurações — placeholders */}
          <Card
            padding="md"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-xl)" }}
          >
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Configurações
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {[
                { icon: Pencil,   label: "Editar datas"      },
                { icon: Star,     label: "Editar pontuação"  },
                { icon: FileText, label: "Regulamento"       },
                { icon: Award,    label: "Premiação"         },
              ].map((item) => (
                <button
                  key={item.label}
                  disabled
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", background: "transparent", border: "none", cursor: "not-allowed", opacity: 0.45, width: "100%", textAlign: "left" }}
                >
                  <Icon icon={item.icon} size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "var(--radius-full)", color: "var(--color-text-muted)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    Em breve
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ── Direita: Times ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card
            padding="lg"
            style={{ background: "linear-gradient(160deg, rgba(15,15,15,0.98), rgba(8,8,8,0.99))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "var(--radius-2xl)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
          >
            {/* Cabeçalho */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", marginBottom: "var(--space-4)", paddingBottom: "var(--space-4)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)", flexShrink: 0 }}>
                  <Icon icon={Users} size={16} style={{ color: "var(--color-brand-primary)" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "white" }}>Times participantes</p>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {participacoesDisplay.length === 0
                      ? "Nenhum time convidado ainda"
                      : (() => {
                          const c = participacoesDisplay.filter((p) => p.aceito === true).length;
                          const p = participacoesDisplay.filter((x) => x.aceito === null).length;
                          const r = participacoesDisplay.filter((x) => x.aceito === false).length;
                          return [
                            c > 0 && `${c} confirmado${c !== 1 ? "s" : ""}`,
                            mostrarTodos && p > 0 && `${p} pendente${p !== 1 ? "s" : ""}`,
                            mostrarTodos && r > 0 && `${r} recusado${r !== 1 ? "s" : ""}`,
                          ].filter(Boolean).join(" · ");
                        })()
                    }
                  </p>
                </div>
              </div>
              {podeConvidar && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalConvidar(true)}
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", flexShrink: 0 }}
                >
                  <Icon icon={UserPlus} size={13} />
                  Convidar
                </Button>
              )}
            </div>

            {/* Busca (só se tiver convidados) */}
            {participacoesDisplay.length > 0 && (
              <div style={{ position: "relative", marginBottom: "var(--space-4)" }}>
                <Icon icon={Search} size={14} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Buscar time..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  style={{ width: "100%", height: "36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", paddingLeft: "calc(var(--space-3) + 14px + var(--space-2))", paddingRight: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.35)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
              </div>
            )}

            {/* Times agrupados por categoria */}
            {participacoesDisplay.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-8) var(--space-4)" }}>
                <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
                  <Icon icon={Users} size={22} style={{ color: "var(--color-text-muted)" }} />
                </div>
                <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>
                  Nenhum time convidado ainda
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {podeConvidar ? "Convide times para participar deste campeonato." : "Os convites aparecerão aqui assim que forem enviados."}
                </p>
              </div>
            ) : participacoesBuscadas.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-6)", fontSize: "var(--text-sm)", margin: 0 }}>
                Nenhum time encontrado para &quot;{teamSearch}&quot;.
              </p>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}
              >
                {GRUPOS.map((grupo) => (
                  <div key={grupo.key}>
                    {/* Cabeçalho do grupo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: grupo.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: grupo.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {grupo.label}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", background: "rgba(255,255,255,0.06)", padding: "1px 8px", borderRadius: "var(--radius-full)", lineHeight: 1.7 }}>
                        {grupo.items.length}
                      </span>
                      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
                    </div>

                    {/* Lista do grupo */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {grupo.items.map((p) => (
                        <motion.div
                          key={p.participacaoId}
                          variants={itemVariants}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-3)",
                            padding: "var(--space-3)",
                            borderRadius: "var(--radius-lg)",
                            background: "rgba(255,255,255,0.025)",
                            border: `1px solid ${grupo.border}`,
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = grupo.bg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                        >
                          <Avatar name={p.nomeTime} src={p.logoUrl || undefined} size="sm" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, color: "white", fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.nomeTime}
                            </p>
                            {(p.cidade || p.estado) && (
                              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                {[p.cidade, p.estado].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", fontWeight: 600, color: grupo.color, background: grupo.bg, border: `1px solid ${grupo.border}`, flexShrink: 0 }}>
                            <Icon icon={grupo.icon} size={10} />
                            {grupo.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── Em breve ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div style={{ marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
            Funcionalidades em desenvolvimento
          </p>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-3)" }}>
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              style={{ padding: "var(--space-4)", borderRadius: "var(--radius-xl)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "var(--space-2)", opacity: 0.7 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Icon icon={feat.icon} size={18} style={{ color: "var(--color-text-muted)" }} />
                <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "var(--radius-full)", color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Em breve
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                {feat.title}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Modais ───────────────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          [data-camp-grid] { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 640px) {
          [data-camp-hero-stats] {
            flex-shrink: 1 !important;
            width: 100%;
            gap: var(--space-3) !important;
          }
          [data-camp-stat-divider] {
            display: none !important;
          }
        }
      `}</style>

      <AnimatePresence>
        {modalConvidar && (
          <ConvidarTimeModal campeonato={campeonato} onClose={() => setModalConvidar(false)} convidadosIniciais={todosConvidadosIds} />
        )}
        {modalCancelar && (
          <CancelarModal
            nome={campeonato.nome}
            onConfirm={handleConfirmarCancelamento}
            onClose={() => setModalCancelar(false)}
            isLoading={isCancelando}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
