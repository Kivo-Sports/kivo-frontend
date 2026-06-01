"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, CheckCircle, XCircle, Calendar, Star, Shield, MapPin, ArrowUpRight, Search, Users, Plus, GitFork, UserCog, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { Card } from "@/components/molecules/Card";
import { PageHeader } from "@/components/molecules/PageHeader";
import { containerVariants, fadeIn, fadeInUp, itemVariants } from "@/lib/motion";
import { useListarTimesOrganizadorQuery } from "@/store/api/timeApi";
import {
  useListarConvitesPendentesQuery,
  useResponderConviteMutation,
  useListarCampeonatosQuery,
} from "@/store/api/campeonatoApi";
import { useGetPerfilUsuarioQuery } from "@/store/api/userApi";
import { EsporteFilterSelect } from "@/components/molecules/EsporteFilterSelect";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/components/atoms/Toast";
import { Icon } from "@/components/atoms/Icon";
import { Icon as IconifyIcon } from "@iconify/react";
import { FORMATO_CAMPEONATO } from "@/types/campeonato";
import type { ConvitePendenteResponse, FormatoCampeonato, CampeonatoResponse } from "@/types/campeonato";

// ─── Painel de Convites ──────────────────────────────────────────────────────

interface ConvitesPainelProps {
  organizadorTimeId: string;
}

const STATUS_CAMPEONATO_LABEL: Record<string, string> = {
  InscricoesAbertas: "Inscrições Abertas",
  EmAndamento: "Em Andamento",
  Rascunho: "Rascunho",
  Finalizado: "Finalizado",
  Cancelado: "Cancelado",
};

// Linha de detalhe (ícone + rótulo + valor)
function DetalheLinha({ icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
      <Icon icon={icon} size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
        <span style={{ color: "var(--color-text-muted)" }}>{label}: </span>
        {children}
      </p>
    </div>
  );
}

// Card de um convite (campeonato)
function ConviteCard({
  convite,
  camp,
  isLoading,
  onResponder,
}: {
  convite: ConvitePendenteResponse;
  camp: CampeonatoResponse | undefined;
  isLoading: boolean;
  onResponder: (convite: ConvitePendenteResponse, aceito: boolean) => void;
}) {
  const statusLabel = STATUS_CAMPEONATO_LABEL[convite.statusCampeonato] ?? convite.statusCampeonato;
  const formatoLabel = camp
    ? (FORMATO_CAMPEONATO[camp.formatoCampeonato as FormatoCampeonato]?.label ?? camp.formatoCampeonato)
    : null;
  const href = `/campeonatos/${convite.campeonatoId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: "var(--radius-xl)",
        background: "linear-gradient(150deg, rgba(20,20,20,0.95), rgba(10,10,10,0.8))",
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
      }}
    >
      {/* Cabeçalho: logo + nome (clicáveis) + status */}
      <div style={{ padding: "var(--space-3)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <Link href={href} title="Ver campeonato" style={{ flexShrink: 0, borderRadius: "var(--radius-lg)", outline: "none" }}>
          <Avatar name={convite.nomeCampeonato} src={camp?.logoUrl || undefined} size="md" />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={href}
            style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", color: "white", maxWidth: "100%" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-brand-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "white"; }}
          >
            <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {convite.nomeCampeonato}
            </span>
            <Icon icon={ArrowUpRight} size={13} style={{ flexShrink: 0 }} />
          </Link>
          <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Recebido em {new Date(convite.convidadoEm).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", fontWeight: 600, background: "rgba(0,230,118,0.1)", color: "var(--color-brand-primary)", border: "1px solid rgba(0,230,118,0.2)" }}>
          {statusLabel}
        </span>
      </div>

      {/* Detalhes do campeonato */}
      <div style={{ padding: "var(--space-3)", display: "grid", gap: "var(--space-2)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {formatoLabel && <DetalheLinha icon={GitFork} label="Formato">{formatoLabel}</DetalheLinha>}
        {camp?.organizadorNome && <DetalheLinha icon={UserCog} label="Organização">{camp.organizadorNome}</DetalheLinha>}
        <DetalheLinha icon={Calendar} label="Período">
          {new Date(convite.dataInicio).toLocaleDateString("pt-BR")} → {new Date(convite.dataFim).toLocaleDateString("pt-BR")}
        </DetalheLinha>
        <DetalheLinha icon={Star} label="Pontuação">
          <span style={{ color: "var(--color-feedback-success)", fontWeight: 600 }}>V {convite.pontosVitoria}</span>
          {" · "}
          <span style={{ color: "var(--color-feedback-warning)", fontWeight: 600 }}>E {convite.pontosEmpate}</span>
          {" · "}
          <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>D {convite.pontosDerrota}</span>
        </DetalheLinha>
      </div>

      {/* Ações */}
      <div style={{ padding: "var(--space-3)", display: "flex", gap: "var(--space-2)" }}>
        <Button
          variant="primary"
          size="sm"
          loading={isLoading}
          disabled={isLoading}
          onClick={() => onResponder(convite, true)}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-1)" }}
        >
          <Icon icon={CheckCircle} size={13} />
          Aceitar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          loading={isLoading}
          disabled={isLoading}
          onClick={() => onResponder(convite, false)}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-1)", color: "var(--color-feedback-danger)", border: "1px solid rgba(255,72,68,0.3)" }}
        >
          <Icon icon={XCircle} size={13} />
          Recusar
        </Button>
      </div>
    </motion.div>
  );
}

function ConvitesPainel({ organizadorTimeId }: ConvitesPainelProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: convites = [], isLoading } = useListarConvitesPendentesQuery(organizadorTimeId);
  const { data: campeonatos = [] } = useListarCampeonatosQuery();
  const { data: times = [] } = useListarTimesOrganizadorQuery();
  const [responderConvite, { isLoading: isRespondendo }] = useResponderConviteMutation();
  const [respondendoId, setRespondendoId] = useState<string | null>(null);

  const campeonatosPorId = new Map(campeonatos.map((c) => [c.id, c]));
  const timesPorNome = new Map(times.map((t) => [t.nome, t]));

  // Agrupa os convites por time
  const gruposPorTime = new Map<string, ConvitePendenteResponse[]>();
  for (const convite of convites) {
    const lista = gruposPorTime.get(convite.nomeTime) ?? [];
    lista.push(convite);
    gruposPorTime.set(convite.nomeTime, lista);
  }

  const handleResponder = async (convite: ConvitePendenteResponse, aceito: boolean) => {
    setRespondendoId(convite.participacaoId);
    try {
      await responderConvite({
        participacaoId: convite.participacaoId,
        body: { organizadorTimeId, aceito },
      }).unwrap();
      toastSuccess(
        aceito
          ? `Você aceitou o convite para ${convite.nomeCampeonato}!`
          : `Convite para ${convite.nomeCampeonato} recusado.`,
      );
    } catch {
      toastError("Não foi possível responder ao convite. Tente novamente.", "Erro");
    } finally {
      setRespondendoId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-6)" }}>
        <Spinner size="md" ariaLabel="Carregando convites" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        <Icon icon={Bell} size={16} style={{ color: "var(--color-brand-primary)" }} />
        <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>
          Convites pendentes
        </p>
        {convites.length > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "20px",
              height: "20px",
              borderRadius: "var(--radius-full)",
              background: "var(--color-brand-primary)",
              color: "black",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              padding: "0 var(--space-1)",
            }}
          >
            {convites.length}
          </span>
        )}
      </div>

      {convites.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-6) var(--space-3)", textAlign: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon icon={Bell} size={20} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>Nenhum convite no momento</p>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Quando um organizador convidar seu time, o convite aparece aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {Array.from(gruposPorTime.entries()).map(([nomeTime, lista]) => {
            const time = timesPorNome.get(nomeTime);
            return (
              <div key={nomeTime}>
                {/* Cabeçalho do time — nome + linha divisória */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                  <Avatar name={nomeTime} src={time?.logoUrl || undefined} size="sm" />
                  <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "55%" }}>
                    {nomeTime}
                  </span>
                  <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "18px", height: "18px", padding: "0 5px", borderRadius: "var(--radius-full)", background: "rgba(0,230,118,0.12)", color: "var(--color-brand-primary)", fontSize: "10px", fontWeight: 700 }}>
                    {lista.length}
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(0,230,118,0.3), rgba(255,255,255,0.04))" }} />
                </div>

                {/* Convites do time */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  {lista.map((convite) => (
                    <ConviteCard
                      key={convite.participacaoId}
                      convite={convite}
                      camp={campeonatosPorId.get(convite.campeonatoId)}
                      isLoading={respondendoId === convite.participacaoId && isRespondendo}
                      onResponder={handleResponder}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function OrganizadorTimePage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { data: times = [], isLoading, isFetching, isError } = useListarTimesOrganizadorQuery();
  const { data: perfil } = useGetPerfilUsuarioQuery(user?.id ?? "", { skip: !user?.id });

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos");
  const [esporteFilter, setEsporteFilter] = useState<string>("todos");

  const activeTeams = times.filter((time) => time.ativo);
  const heroStats   = [
    { label: "Times ativos",   value: activeTeams.length, icon: Shield },
    { label: "Total de times", value: times.length,       icon: Users  },
  ];
  const userName = user?.name?.split(" ")[0] ?? "Organizador";

  const timesFiltrados = times.filter((t) => {
    const matchNome    = t.nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus  = statusFilter === "todos" ? true : t.ativo === (statusFilter === "ativo");
    const matchEsporte = esporteFilter === "todos" ? true : t.esporteId === esporteFilter;
    return matchNome && matchStatus && matchEsporte;
  });

  if (isLoading || isFetching) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }} aria-busy="true">
        <div style={{ display: "grid", justifyItems: "center", gap: "var(--space-3)" }}>
          <Spinner size="lg" ariaLabel="Carregando times" />
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Preparando sua central de times...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div
      data-times-page
      style={{ width: "100%", maxWidth: "90rem", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}
    >

      {/* Hero */}
      <motion.div
        data-times-hero
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.45 }}
        style={{
          borderRadius: "var(--radius-2xl)",
          padding: "var(--space-6)",
          background: "linear-gradient(145deg, rgba(0, 230, 118, 0.15) 0%, rgba(0, 0, 0, 0.7) 100%)",
          border: "1px solid rgba(0, 230, 118, 0.2)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: "var(--space-6)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-xs)", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-brand-primary)" }}>
              Central de Times
            </p>
            <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 700, color: "white", lineHeight: 1.15 }}>
              Olá, {userName}
            </h1>
            <p className="text-secondary" style={{ marginTop: "var(--space-2)", maxWidth: "30rem", lineHeight: 1.6 }}>
              Organize seus times, acompanhe o status de cada frente e mantenha torcedores engajados.
            </p>
          </div>
          <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
            <Button
              variant="secondary"
              onClick={() => router.push("/organizador/times/criar")}
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}
            >
              <Icon icon={Plus} size={16} />
              Criar time
            </Button>
          </div>
        </div>

        <div data-times-hero-stats style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "var(--space-3)", alignContent: "center" }}>
          {heroStats.map((stat) => (
            <Card
              key={stat.label}
              padding="sm"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "var(--radius-lg)",
                textAlign: "center",
              }}
            >
              <Icon icon={stat.icon} size={20} style={{ color: "var(--color-brand-primary)", margin: "0 auto var(--space-2)" }} />
              <p style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 700, color: "white" }}>{stat.value}</p>
              <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                {stat.label}
              </p>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Conteúdo principal */}
      <div data-times-layout style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: "var(--space-5)" }}>

        {/* Lista de times */}
        <div>
          <PageHeader
            title="Meus times"
            subtitle={
              times.length === 0
                ? "Crie seu primeiro time para começar"
                : timesFiltrados.length > 0
                  ? `${timesFiltrados.length} time${timesFiltrados.length !== 1 ? "s" : ""} encontrado${timesFiltrados.length !== 1 ? "s" : ""}`
                  : "Nenhum time com estes filtros"
            }
          />

          {isError || times.length === 0 ? (
            <motion.div variants={fadeInUp} initial="initial" animate="animate" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Card
                padding="lg"
                style={{
                  maxWidth: "48rem", width: "100%",
                  borderRadius: "var(--radius-2xl)",
                  background: "linear-gradient(160deg, rgba(0, 230, 118, 0.2), rgba(0, 0, 0, 0.6))",
                  textAlign: "center", color: "white",
                  border: "1px solid rgba(0, 230, 118, 0.3)",
                }}
              >
                <div
                  role="presentation"
                  style={{
                    width: "5rem", height: "5rem",
                    margin: "0 auto var(--space-3)",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "color-mix(in srgb, var(--color-brand-secondary), transparent 65%)",
                  }}
                >
                  <Icon icon={Shield} size={32} />
                </div>
                <h2 style={{ marginBottom: "var(--space-2)", fontSize: "var(--text-2xl)" }}>
                  Você ainda não tem um time ativo
                </h2>
                <p className="text-secondary" style={{ margin: 0 }}>
                  Comece criando seu time, definindo a identidade e liberando o acesso a campeonatos.
                </p>
                <div style={{ marginTop: "var(--space-4)" }}>
                  <Button variant="primary" onClick={() => router.push("/organizador/times/criar")}>
                    Criar meu time
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : timesFiltrados.length === 0 ? (
            <motion.div variants={fadeInUp} initial="initial" animate="animate">
              <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-8)" }}>
                Nenhum time encontrado com estes filtros.
              </p>
            </motion.div>
          ) : (
            <motion.div
              data-times-cards-grid
              variants={containerVariants}
              initial="initial"
              animate="animate"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "var(--space-4)",
                maxWidth: timesFiltrados.length === 1 ? "380px" : "100%",
              }}
            >
              {timesFiltrados.map((time) => {
                const criadoEmDate = new Date(time.criadoEm);
                const diasDesdeCriacao = Math.max(
                  0,
                  Math.floor((Date.now() - criadoEmDate.getTime()) / (1000 * 60 * 60 * 24)),
                );

                const tempoDeCriacao =
                  diasDesdeCriacao === 0
                    ? "Criado hoje"
                    : diasDesdeCriacao === 1
                      ? "Criado ontem"
                      : `Criado há ${diasDesdeCriacao} dias`;

                return (
                <motion.div key={time.id} variants={itemVariants}>
                  <Card
                    padding="md"
                    hoverable
                    style={{
                      borderRadius: "var(--radius-xl)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--space-3)",
                      background: "linear-gradient(150deg, rgba(20,20,20,0.95), rgba(10,10,10,0.8))",
                      border: "1px solid rgba(255,255,255,0.06)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Cabeçalho */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                        <Avatar name={time.nome} src={time.logoUrl || undefined} size="md" />
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {time.nome}
                          </h3>
                          <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            {tempoDeCriacao}
                          </p>
                        </div>
                      </div>
                      <Badge variant={time.ativo ? "success" : "danger"} size="sm" style={{ flexShrink: 0 }}>
                        {time.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    {/* Localização + Esporte */}
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <Icon icon={MapPin} size={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                        <span className="text-secondary" style={{ fontSize: "var(--text-xs)" }}>
                          {time.cidade} · {time.estado}
                        </span>
                      </span>
                      {time.esporteNome && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                          {time.esporteIcone && (
                            <IconifyIcon icon={time.esporteIcone} width={13} height={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                          )}
                          <span className="text-secondary" style={{ fontSize: "var(--text-xs)" }}>
                            {time.esporteNome}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <Button
                      variant="ghost"
                      style={{
                        marginTop: "var(--space-1)",
                        width: "100%",
                        justifyContent: "space-between",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        color: "white",
                        fontWeight: 600,
                      }}
                      onClick={() => router.push(`/organizador/times/${time.id}`)}
                    >
                      Gerenciar time
                      <Icon icon={ArrowUpRight} size={14} style={{ color: "var(--color-brand-primary)" }} />
                    </Button>
                  </Card>
                </motion.div>
              );
              })}
            </motion.div>
          )}
        </div>

        {/* Sidebar direita */}
        <div data-times-sidebar style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Painel de convites */}
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <Card
              padding="lg"
              style={{
                borderRadius: "var(--radius-xl)",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
              }}
            >
              {perfil?.organizadorTimeId ? (
                <ConvitesPainel organizadorTimeId={perfil.organizadorTimeId} />
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                    <Icon icon={Bell} size={16} style={{ color: "var(--color-brand-primary)" }} />
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>
                      Convites pendentes
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    Carregando perfil...
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Times recentes com filtros */}
          <motion.div variants={fadeIn} initial="initial" animate="animate">
            <Card
              padding="lg"
              style={{
                borderRadius: "var(--radius-xl)",
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-default)",
                display: "flex", flexDirection: "column", gap: "var(--space-3)",
              }}
            >
              {/* Cabeçalho */}
              <p style={{ margin: 0, fontSize: "var(--text-xs)", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                Filtros
              </p>

              {/* Barra de pesquisa */}
              <div style={{ position: "relative" }}>
                <Icon
                  icon={Search}
                  size={14}
                  style={{
                    position: "absolute",
                    left: "var(--space-3)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder="Pesquisar time..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    height: "36px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "var(--radius-md)",
                    paddingLeft: "calc(var(--space-3) + 14px + var(--space-2))",
                    paddingRight: "var(--space-3)",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                />
              </div>

              {/* Linha de filtros: Meus times + Esporte */}
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                {/* Meus times — ativo */}
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: "default",
                    border: "1px solid rgba(0, 230, 118, 0.35)",
                    background: "rgba(0, 230, 118, 0.1)",
                    color: "var(--color-brand-primary)",
                  }}
                >
                  <Icon icon={Users} size={11} />
                  Meus times
                </button>

                {/* Esporte — filtro */}
                <EsporteFilterSelect value={esporteFilter} onChange={setEsporteFilter} />
              </div>

              {/* Filtro de status */}
              <div style={{ display: "flex", gap: "var(--space-1)" }}>
                {(["todos", "ativo", "inativo"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    style={{
                      flex: 1,
                      padding: "4px 0",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: statusFilter === s ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                      background: statusFilter === s ? "rgba(255,255,255,0.07)" : "transparent",
                      color: statusFilter === s ? "white" : "var(--color-text-muted)",
                      transition: "all 0.15s",
                      textTransform: "capitalize",
                    }}
                  >
                    {s === "todos" ? "Todos" : s === "ativo" ? "Ativos" : "Inativos"}
                  </button>
                ))}
              </div>

            </Card>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          [data-times-layout] {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          [data-times-page] {
            gap: var(--space-5) !important;
          }
          [data-times-sidebar] {
            order: -1;
          }
          [data-times-hero] {
            grid-template-columns: 1fr !important;
            gap: var(--space-4) !important;
            padding: var(--space-4) !important;
          }
          [data-times-cards-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
