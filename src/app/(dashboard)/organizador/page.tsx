"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/atoms/Spinner";
import { Card } from "@/components/molecules/Card";
import { PageHeader } from "@/components/molecules/PageHeader";
import { containerVariants, fadeIn, fadeInUp, itemVariants } from "@/lib/motion";
import { useListarTimesOrganizadorQuery } from "@/store/api/timeApi";
import { useAppSelector } from "@/store/hooks";
import { Icon } from "@/components/atoms/Icon";
import { Shield } from "lucide-react";

export default function OrganizadorHomePage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { data: times = [], isLoading, isFetching, isError } = useListarTimesOrganizadorQuery();

  const activeTeams = times.filter((time) => time.ativo);
  const heroStats = [
    { label: "Times ativos", value: activeTeams.length },
    { label: "Total de times", value: times.length },
  ];
  const quickTimes = times.slice(0, 3);
  const campeonatos = ["Copa Regional 2026", "Liga Metropolitana", "Copa das Capitais"];
  const userName = user?.name?.split(" ")[0] ?? "Organizador";

  if (isLoading || isFetching) {
    return (
      <main
        style={{
          minHeight: "55vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-busy="true"
      >
        <div style={{ display: "grid", justifyItems: "center", gap: "var(--space-3)" }}>
          <Spinner size="lg" ariaLabel="Carregando times" />
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            Preparando sua central de times...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "90rem",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
    >
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.45 }}
        style={{
          borderRadius: "var(--radius-2xl)",
          padding: "var(--space-6)",
          background:
            "linear-gradient(145deg, rgba(0, 230, 118, 0.2), rgba(0, 0, 0, 0.65)), color-mix(in srgb, var(--color-bg-base), black 5%)",
          border: "1px solid rgba(0, 230, 118, 0.25)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: "var(--space-6)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "white",
            }}
          >
            Bem-vindo, {userName}
          </h1>
          <p className="text-secondary" style={{ marginTop: "var(--space-2)", maxWidth: "32rem" }}>
            Organize seus times, acompanhe o status de cada frente e mantenha torcedores engajados
            em uma experiência premium.
          </p>
          <div
            style={{
              marginTop: "var(--space-4)",
              display: "flex",
              gap: "var(--space-3)",
              flexWrap: "wrap",
            }}
          >
            <Button variant="secondary" onClick={() => router.push("/organizador/times/criar")}>
              Criar meu time
            </Button>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          {heroStats.map((stat) => (
            <Card
              key={stat.label}
              padding="sm"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "white",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-xs)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  margin: "var(--space-2) 0 0",
                  fontSize: "var(--text-2xl)",
                  fontWeight: 700,
                }}
              >
                {stat.value}
              </p>
            </Card>
          ))}
        </div>
      </motion.div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: "var(--space-5)",
        }}
      >
        <div>
          <PageHeader
            title="Meus times"
            subtitle="Assuma o controle das equipes vinculadas à sua organização"
          />

          {isError || times.length === 0 ? (
            <motion.div
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Card
                padding="lg"
                style={{
                  maxWidth: "48rem",
                  width: "100%",
                  borderRadius: "var(--radius-2xl)",
                  background: "linear-gradient(160deg, rgba(0, 230, 118, 0.2), rgba(0, 0, 0, 0.6))",
                  textAlign: "center",
                  color: "white",
                  border: "1px solid rgba(0, 230, 118, 0.3)",
                }}
              >
                <div
                  role="presentation"
                  style={{
                    width: "5rem",
                    height: "5rem",
                    margin: "0 auto var(--space-3)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    background: "color-mix(in srgb, var(--color-brand-secondary), transparent 65%)",
                  }}
                >
                  <Icon icon={Shield} size={32} />
                </div>

                <h2 style={{ marginBottom: "var(--space-2)", fontSize: "var(--text-2xl)" }}>
                  Você ainda não tem um time ativo
                </h2>
                <p className="text-secondary" style={{ margin: 0 }}>
                  Comece o processo criando seu time, definindo a identidade e liberando o acesso a
                  campeonatos.
                </p>
                <div style={{ marginTop: "var(--space-4)" }}>
                  <Button variant="primary" onClick={() => router.push("/organizador/times/criar")}>
                    Criar meu time
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              {times.map((time) => (
                <motion.div key={time.id} variants={itemVariants}>
                  <Card
                    padding="md"
                    hoverable
                    style={{
                      borderRadius: "var(--radius-xl)",
                      minHeight: "240px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      background: "linear-gradient(140deg, rgba(0,0,0,0.6), rgba(0,0,0,0.25))",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "var(--space-3)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <Avatar name={time.nome} src={time.logoUrl || undefined} size="lg" />
                        <div>
                          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", color: "white" }}>
                            {time.nome}
                          </h3>
                          <p
                            className="text-secondary"
                            style={{ margin: 0, fontSize: "var(--text-sm)" }}
                          >
                            {time.cidade} · {time.estado}
                          </p>
                        </div>
                      </div>
                      <Badge variant={time.ativo ? "success" : "danger"} size="sm">
                        {time.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    <div
                      style={{
                        marginTop: "var(--space-3)",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <p
                          className="text-secondary"
                          style={{ margin: 0, fontSize: "var(--text-xs)" }}
                        >
                          Criado em
                        </p>
                        <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
                          {new Date(time.criadoEm).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          className="text-secondary"
                          style={{ margin: 0, fontSize: "var(--text-xs)" }}
                        >
                          Organizador
                        </p>
                        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "white" }}>
                          {time.organizadorTimeId.slice(0, 8)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      style={{ marginTop: "var(--space-3)", alignSelf: "flex-end" }}
                      onClick={() => router.push(`/organizador/times/${time.id}`)}
                    >
                      Ver detalhes
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <motion.div variants={fadeIn} initial="initial" animate="animate">
          <Card
            padding="lg"
            style={{
              borderRadius: "var(--radius-xl)",
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--text-xs)",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Meus times // Campeonatos
              </p>
              <p
                style={{
                  margin: "var(--space-2) 0 0",
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                }}
              >
                Visão rápida
              </p>
            </div>
            <div>
              <p
                style={{
                  marginBottom: "var(--space-2)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Times recentes
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                {quickTimes.map((time) => (
                  <li key={time.id} style={{ fontWeight: 600 }}>
                    {time.nome}
                  </li>
                ))}
                {!times.length && (
                  <li style={{ color: "var(--color-text-muted)" }}>
                    Cadastre um time para vê-lo aqui.
                  </li>
                )}
              </ul>
            </div>
            <div>
              <p
                style={{
                  marginBottom: "var(--space-2)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Campeonatos sugeridos
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                {campeonatos.map((campeonato) => (
                  <li key={campeonato} style={{ fontWeight: 600 }}>
                    {campeonato}
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="ghost" onClick={() => router.push("/organizador/times/criar")}>
              Explorar campeonatos
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
