"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Trophy, Users, Plus, TrendingUp, ArrowUpRight, Search, X, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { Card } from "@/components/molecules/Card";
import { ErrorState } from "@/components/molecules/ErrorState";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Icon } from "@/components/atoms/Icon";
import { Icon as IconifyIcon } from "@iconify/react";
import { containerVariants, fadeIn, fadeInUp, itemVariants } from "@/lib/motion";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import { useGetPerfilUsuarioQuery } from "@/store/api/userApi";
import { useAppSelector } from "@/store/hooks";

type StatusFilter = "todos" | "Rascunho" | "InscricoesAbertas" | "EmAndamento" | "Finalizado" | "Cancelado";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  Rascunho:             { label: "Rascunho",              variant: "default" },
  InscricoesAbertas:    { label: "Inscrições Abertas",    variant: "success" },
  InscricoesEncerradas: { label: "Inscrições Encerradas", variant: "warning" },
  Pausado:              { label: "Pausado",               variant: "warning" },
  EmAndamento:          { label: "Em Andamento",          variant: "info"    },
  Finalizado:           { label: "Finalizado",            variant: "default" },
  Cancelado:            { label: "Cancelado",             variant: "danger"  },
};

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "todos",             label: "Todos"              },
  { key: "Rascunho",          label: "Rascunho"           },
  { key: "InscricoesAbertas", label: "Inscrições Abertas" },
  { key: "EmAndamento",       label: "Em Andamento"       },
  { key: "Finalizado",        label: "Finalizado"         },
  { key: "Cancelado",         label: "Cancelado"          },
];

const STATUS_DOT: Record<string, string> = {
  todos:             "rgba(255,255,255,0.3)",
  Rascunho:          "rgba(180,180,180,0.7)",
  InscricoesAbertas: "rgba(0,230,118,0.9)",
  EmAndamento:       "rgba(96,165,250,0.9)",
  Finalizado:        "rgba(160,160,160,0.6)",
  Cancelado:         "rgba(255,72,68,0.9)",
};

// ─── Select de status customizado ────────────────────────────────────────────

function StatusSelect({
  value,
  onChange,
  options,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  options: { key: StatusFilter; label: string; count: number }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.key === value)!;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          height: "42px",
          background: open ? "rgba(0,230,118,0.04)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(0,230,118,0.45)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "0 var(--space-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-2)",
          cursor: "pointer",
          boxSizing: "border-box",
          transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
          boxShadow: open ? "0 0 0 2px rgba(0,230,118,0.1)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: STATUS_DOT[value] ?? "rgba(255,255,255,0.3)",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          />
          <span style={{ fontSize: "var(--text-sm)", color: open ? "var(--color-brand-primary)" : "var(--color-text-primary)", transition: "color 0.15s" }}>
            {selected.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {value !== "todos" && selected.count > 0 && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "var(--color-brand-primary)",
                background: "rgba(0,230,118,0.14)",
                padding: "1px 7px",
                borderRadius: "var(--radius-full)",
                lineHeight: 1.6,
              }}
            >
              {selected.count}
            </span>
          )}
          <Icon
            icon={ChevronDown}
            size={14}
            style={{
              color: open ? "var(--color-brand-primary)" : "var(--color-text-muted)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s, color 0.15s",
            }}
          />
        </div>
      </button>

      {/* Overlay fecha ao clicar fora */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 49 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="status-dropdown"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: "rgba(13,13,13,0.98)",
              border: "1px solid rgba(0,230,118,0.22)",
              borderRadius: "var(--radius-lg)",
              zIndex: 50,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,230,118,0.06)",
            }}
          >
            {options.map((opt, i) => {
              const isActive = opt.key === value;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { onChange(opt.key); setOpen(false); }}
                  style={{
                    width: "100%",
                    padding: "10px var(--space-4)",
                    background: isActive ? "rgba(0,230,118,0.07)" : "transparent",
                    border: "none",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    transition: "background 0.12s",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: STATUS_DOT[opt.key] ?? "rgba(255,255,255,0.2)",
                      }}
                    />
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: isActive ? 600 : 400, color: isActive ? "var(--color-brand-primary)" : "var(--color-text-primary)" }}>
                      {opt.label}
                    </span>
                  </div>
                  {opt.count > 0 && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: isActive ? "var(--color-brand-primary)" : "var(--color-text-muted)",
                        background: isActive ? "rgba(0,230,118,0.15)" : "rgba(255,255,255,0.07)",
                        padding: "1px 7px",
                        borderRadius: "var(--radius-full)",
                        lineHeight: 1.6,
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrganizadorCampeonatoPage() {
  const router   = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("todos");
  const [search, setSearch]             = useState("");

  const { data: perfil }                                           = useGetPerfilUsuarioQuery(user?.id ?? "", { skip: !user?.id });
  const { data: todosCampeonatos = [], isLoading, isFetching, isError, refetch } = useListarCampeonatosQuery();

  const campeonatos = perfil?.organizadorCampeonatoId
    ? todosCampeonatos.filter((c) => c.organizadorCampeonatoId === perfil.organizadorCampeonatoId)
    : todosCampeonatos;

  const campeonatosFiltrados = campeonatos
    .filter((c) => activeFilter === "todos" || c.status === activeFilter)
    .filter((c) => search === "" || c.nome.toLowerCase().includes(search.toLowerCase()));

  const totalEmAndamento = campeonatos.filter((c) => c.status === "EmAndamento").length;
  const totalTimes       = campeonatos.reduce((acc, c) => acc + c.totalTimes, 0);
  const totalRascunho    = campeonatos.filter((c) => c.status === "Rascunho").length;

  const heroStats = [
    { label: "Campeonatos",     value: campeonatos.length, icon: Trophy     },
    { label: "Em andamento",    value: totalEmAndamento,   icon: TrendingUp },
    { label: "Times inscritos", value: totalTimes,         icon: Users      },
  ];

  const userName = user?.name?.split(" ")[0] ?? "Organizador";

  if (isLoading || isFetching) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }} aria-busy="true">
        <div style={{ display: "grid", justifyItems: "center", gap: "var(--space-3)" }}>
          <Spinner size="lg" ariaLabel="Carregando campeonatos" />
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Preparando sua central de campeonatos...
          </p>
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main style={{ width: "100%", maxWidth: "48rem", margin: "0 auto", padding: "var(--space-6) 0" }}>
        <ErrorState
          title="Não foi possível carregar seus campeonatos"
          message="Houve uma falha de conexão com o servidor. Seus campeonatos não foram perdidos."
          onRetry={() => refetch()}
        />
      </main>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: "90rem", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

      {/* Hero */}
      <motion.div
        data-camp-list-hero
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.45 }}
        style={{
          borderRadius: "var(--radius-2xl)",
          padding: "var(--space-6)",
          background: "linear-gradient(145deg, rgba(0, 230, 118, 0.15) 0%, rgba(0, 0, 0, 0.7) 100%)",
          border: "1px solid rgba(0, 230, 118, 0.2)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: "var(--space-6)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-xs)", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-brand-primary)" }}>
              Central de Campeonatos
            </p>
            <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", fontWeight: 700, color: "white", lineHeight: 1.15 }}>
              Olá, {userName}
            </h1>
            <p className="text-secondary" style={{ marginTop: "var(--space-2)", maxWidth: "30rem", lineHeight: 1.6 }}>
              Crie e gerencie campeonatos, convide times e acompanhe cada etapa da competição em um só lugar.
            </p>
          </div>
          <div style={{ marginTop: "var(--space-4)", display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
            <Button
              variant="secondary"
              onClick={() => router.push("/organizador/campeonatos/criar")}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
            >
              <Icon icon={Plus} size={16} />
              Novo campeonato
            </Button>
            {totalRascunho > 0 && (
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                {totalRascunho} rascunho{totalRascunho > 1 ? "s" : ""} aguardando
              </p>
            )}
          </div>
        </div>

        <div data-camp-list-hero-stats style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--space-3)", alignContent: "center" }}>
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

      {/* Busca + Filtros */}
      {campeonatos.length > 0 && (
        <motion.div variants={fadeIn} initial="initial" animate="animate">
          <div
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "var(--radius-xl)",
              padding: "var(--space-4)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
            }}
          >
            {/* Barra de pesquisa */}
            <div style={{ position: "relative" }}>
              <Icon
                icon={Search}
                size={15}
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
                placeholder="Pesquisar campeonato pelo nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: "42px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "var(--radius-lg)",
                  paddingLeft: "calc(var(--space-3) + 15px + var(--space-2))",
                  paddingRight: search ? "40px" : "var(--space-3)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.4)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: "var(--space-3)",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255,255,255,0.08)",
                    border: "none",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-muted)",
                    padding: 0,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                >
                  <Icon icon={X} size={11} />
                </button>
              )}
            </div>

            {/* Separador */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

            {/* Filtros de status */}
            <StatusSelect
              value={activeFilter}
              onChange={setActiveFilter}
              options={STATUS_FILTERS.map((f) => ({
                key: f.key,
                label: f.label,
                count: f.key === "todos" ? campeonatos.length : campeonatos.filter((c) => c.status === f.key).length,
              }))}
            />
          </div>
        </motion.div>
      )}

      {/* Lista */}
      <div>
        <PageHeader
          title="Seus campeonatos"
          subtitle={
            campeonatos.length === 0
              ? "Crie seu primeiro campeonato para começar"
              : campeonatosFiltrados.length > 0
                ? `${campeonatosFiltrados.length} campeonato${campeonatosFiltrados.length !== 1 ? "s" : ""} encontrado${campeonatosFiltrados.length !== 1 ? "s" : ""}`
                : "Nenhum campeonato nesta categoria"
          }
        />

        {campeonatos.length === 0 ? (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" style={{ display: "flex", justifyContent: "center" }}>
            <Card
              padding="lg"
              style={{
                maxWidth: "44rem", width: "100%",
                borderRadius: "var(--radius-2xl)",
                background: "linear-gradient(160deg, rgba(0, 230, 118, 0.08), rgba(0, 0, 0, 0.5))",
                textAlign: "center", color: "white",
                border: "1px solid rgba(0, 230, 118, 0.15)",
              }}
            >
              <div
                role="presentation"
                style={{
                  width: "4.5rem", height: "4.5rem",
                  margin: "0 auto var(--space-4)",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0, 230, 118, 0.08)",
                  border: "1px solid rgba(0, 230, 118, 0.2)",
                }}
              >
                <Icon icon={Trophy} size={28} style={{ color: "var(--color-brand-primary)" }} />
              </div>
              <h2 style={{ marginBottom: "var(--space-2)", fontSize: "var(--text-xl)", fontWeight: 600 }}>
                Nenhum campeonato ainda
              </h2>
              <p className="text-secondary" style={{ margin: "0 auto", maxWidth: "28rem", lineHeight: 1.6 }}>
                Crie seu primeiro campeonato, defina as regras e comece a convidar times para competir.
              </p>
              <div style={{ marginTop: "var(--space-5)" }}>
                <Button variant="primary" onClick={() => router.push("/organizador/campeonatos/criar")}>
                  Criar primeiro campeonato
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : campeonatosFiltrados.length === 0 ? (
          <motion.div variants={fadeInUp} initial="initial" animate="animate">
            <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-8)" }}>
              Nenhum campeonato com este filtro.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}
          >
            {campeonatosFiltrados.map((campeonato) => {
              const statusCfg      = STATUS_CONFIG[campeonato.status] ?? { label: campeonato.status, variant: "default" as const };
              const dataInicio     = new Date(campeonato.dataInicio);
              const dataFim        = new Date(campeonato.dataFim);

              return (
                <motion.div key={campeonato.id} variants={itemVariants}>
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
                        <Avatar name={campeonato.nome} src={campeonato.logoUrl || undefined} size="md" />
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {campeonato.nome}
                          </h3>
                          <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                            Criado em {new Date(campeonato.criadoEm).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusCfg.variant} size="sm" style={{ flexShrink: 0 }}>
                        {statusCfg.label}
                      </Badge>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                      <Icon icon={Calendar} size={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                      <p className="text-secondary" style={{ margin: 0, fontSize: "var(--text-xs)" }}>
                        {dataInicio.toLocaleDateString("pt-BR")} → {dataFim.toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "var(--space-4)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <Icon icon={Users} size={11} style={{ color: "var(--color-text-muted)" }} />
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {campeonato.totalTimes} {campeonato.totalTimes === 1 ? "time" : "times"}
                        </span>
                      </div>
                      {campeonato.esporteNome && (
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                          {campeonato.esporteIcone && (
                            <IconifyIcon icon={campeonato.esporteIcone} width={13} height={13} style={{ color: "var(--color-text-muted)" }} />
                          )}
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                            {campeonato.esporteNome}
                          </span>
                        </div>
                      )}
                    </div>

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
                      onClick={() => router.push(`/organizador/campeonatos/${campeonato.id}`)}
                    >
                      Gerenciar campeonato
                      <Icon icon={ArrowUpRight} size={14} style={{ color: "var(--color-brand-primary)" }} />
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
      <style>{`
        @media (max-width: 720px) {
          [data-camp-list-hero] {
            grid-template-columns: 1fr !important;
            gap: var(--space-4) !important;
            padding: var(--space-4) !important;
          }
        }
      `}</style>
    </div>
  );
}
