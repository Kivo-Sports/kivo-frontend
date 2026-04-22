"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Trophy, Users, Plus, TrendingUp } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { Card } from "@/components/molecules/Card";
import { PageHeader } from "@/components/molecules/PageHeader";
import { containerVariants, fadeIn, fadeInUp, itemVariants } from "@/lib/motion";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import { useGetPerfilUsuarioQuery } from "@/store/api/userApi";
import { useAppSelector } from "@/store/hooks";
import { Icon } from "@/components/atoms/Icon";

type StatusFilter = "todos" | "Rascunho" | "InscricoesAbertas" | "EmAndamento" | "Finalizado" | "Cancelado";

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  Rascunho:             { label: "Rascunho",              variant: "default"  },
  InscricoesAbertas:    { label: "Inscrições Abertas",    variant: "success"  },
  InscricoesEncerradas: { label: "Inscrições Encerradas", variant: "warning"  },
  Pausado:              { label: "Pausado",               variant: "warning"  },
  EmAndamento:          { label: "Em Andamento",          variant: "info"     },
  Finalizado:           { label: "Finalizado",            variant: "default"  },
  Cancelado:            { label: "Cancelado",             variant: "danger"   },
};

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "todos",             label: "Todos"             },
  { key: "Rascunho",          label: "Rascunho"          },
  { key: "InscricoesAbertas", label: "Inscrições Abertas"},
  { key: "EmAndamento",       label: "Em Andamento"      },
  { key: "Finalizado",        label: "Finalizado"        },
];

export default function OrganizadorCampeonatoPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("todos");

  const { data: perfil } = useGetPerfilUsuarioQuery(user?.id ?? "", { skip: !user?.id });
  const { data: todosCampeonatos = [], isLoading, isFetching, isError } = useListarCampeonatosQuery();

  const campeonatos = perfil?.organizadorCampeonatoId
    ? todosCampeonatos.filter((c) => c.organizadorCampeonatoId === perfil.organizadorCampeonatoId)
    : todosCampeonatos;

  const campeonatosFiltrados = activeFilter === "todos"
    ? campeonatos
    : campeonatos.filter((c) => c.status === activeFilter);

  const totalEmAndamento = campeonatos.filter((c) => c.status === "EmAndamento").length;
  const totalTimes       = campeonatos.reduce((acc, c) => acc + c.totalTimes, 0);
  const totalRascunho    = campeonatos.filter((c) => c.status === "Rascunho").length;

  const heroStats = [
    { label: "Campeonatos",   value: campeonatos.length, icon: Trophy    },
    { label: "Em andamento",  value: totalEmAndamento,   icon: TrendingUp },
    { label: "Times inscritos", value: totalTimes,       icon: Users     },
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

  return (
    <div style={{ width: "100%", maxWidth: "90rem", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

      {/* Hero */}
      <motion.div
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
              onClick={() => router.push("/organizador-campeonato/campeonatos/criar")}
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--space-3)", alignContent: "center" }}>
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
              <p style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 700, color: "white" }}>
                {stat.value}
              </p>
              <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", letterSpacing: "0.1em" }}>
                {stat.label}
              </p>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Filtros */}
      {campeonatos.length > 0 && (
        <motion.div variants={fadeIn} initial="initial" animate="animate" style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => {
            const count = f.key === "todos" ? campeonatos.length : campeonatos.filter((c) => c.status === f.key).length;
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-full)",
                  border: `1px solid ${isActive ? "rgba(0, 230, 118, 0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: isActive ? "rgba(0, 230, 118, 0.1)" : "transparent",
                  color: isActive ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {f.label}
                {count > 0 && (
                  <span style={{
                    marginLeft: "var(--space-1)",
                    fontSize: "var(--text-xs)",
                    opacity: 0.7,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Lista */}
      <div>
        <PageHeader
          title="Seus campeonatos"
          subtitle={campeonatosFiltrados.length > 0
            ? `${campeonatosFiltrados.length} campeonato${campeonatosFiltrados.length !== 1 ? "s" : ""} encontrado${campeonatosFiltrados.length !== 1 ? "s" : ""}`
            : "Nenhum campeonato nesta categoria"
          }
        />

        {isError || campeonatos.length === 0 ? (
          <motion.div variants={fadeInUp} initial="initial" animate="animate" style={{ display: "flex", justifyContent: "center" }}>
            <Card
              padding="lg"
              style={{
                maxWidth: "44rem",
                width: "100%",
                borderRadius: "var(--radius-2xl)",
                background: "linear-gradient(160deg, rgba(0, 230, 118, 0.08), rgba(0, 0, 0, 0.5))",
                textAlign: "center",
                color: "white",
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
                <Button variant="primary" onClick={() => router.push("/organizador-campeonato/campeonatos/criar")}>
                  <Icon icon={Plus} size={16} />
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
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-4)" }}
          >
            {campeonatosFiltrados.map((campeonato) => {
              const statusCfg = STATUS_CONFIG[campeonato.status] ?? { label: campeonato.status, variant: "default" as const };
              const dataInicio = new Date(campeonato.dataInicio);
              const dataFim    = new Date(campeonato.dataFim);
              const hoje       = new Date();
              const diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <motion.div key={campeonato.id} variants={itemVariants}>
                  <Card
                    padding="md"
                    hoverable
                    style={{
                      borderRadius: "var(--radius-xl)",
                      minHeight: "200px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      background: "linear-gradient(150deg, rgba(20,20,20,0.9), rgba(10,10,10,0.7))",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-2)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {campeonato.nome}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", marginTop: "var(--space-1)" }}>
                          <Icon icon={Calendar} size={12} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                          <p className="text-secondary" style={{ margin: 0, fontSize: "var(--text-xs)" }}>
                            {dataInicio.toLocaleDateString("pt-BR")} → {dataFim.toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusCfg.variant} size="sm" style={{ flexShrink: 0 }}>
                        {statusCfg.label}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--space-2)",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-lg)",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", marginBottom: "var(--space-1)" }}>
                          <Icon icon={Users} size={11} style={{ color: "var(--color-text-muted)" }} />
                          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Times</p>
                        </div>
                        <p style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700, color: "white" }}>
                          {campeonato.totalTimes}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {diasRestantes > 0 ? "Dias restantes" : "Encerrado"}
                        </p>
                        <p style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700, color: diasRestantes > 0 ? "white" : "var(--color-text-muted)" }}>
                          {diasRestantes > 0 ? diasRestantes : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        Criado em {new Date(campeonato.criadoEm).toLocaleDateString("pt-BR")}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {}}
                        style={{ fontSize: "var(--text-xs)", opacity: 0.5, cursor: "default" }}
                        title="Em breve"
                      >
                        Ver detalhes →
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
