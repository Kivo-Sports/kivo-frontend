"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/molecules/Card";
import { FadeIn } from "@/components/atoms/FadeIn";
import { Spinner } from "@/components/atoms/Spinner";
import { isOrganizadorTime, normalizeCargo, getRedirectPathAfterLogin } from "@/lib/auth.utils";
import { Icon } from "@/components/atoms/Icon";
import { Shield, Trophy, BarChart3, MessageCircle } from "lucide-react";

function DashboardLoading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-busy="true"
    >
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <Spinner size="lg" ariaLabel="Carregando dashboard" />
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
          }}
        >
          Carregando seu dashboard...
        </p>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || !token)) {
      router.replace("/login");
    }
  }, [mounted, isAuthenticated, token, router]);

  useEffect(() => {
    if (mounted && isAuthenticated && token) {
      const redirectRoute = getRedirectPathAfterLogin(user?.cargo);
      if (redirectRoute !== "/dashboard") {
        router.replace(redirectRoute);
      }
    }
  }, [mounted, isAuthenticated, token, user?.cargo, router]);

  if (!mounted) {
    return <DashboardLoading />;
  }

  if (!isAuthenticated || !token || !user) {
    return <DashboardLoading />;
  }

  const getProfileType = (cargo?: string) => {
    const types: Record<string, string> = {
      torcedor: "Torcedor",
      "organizador-time": "Organizador de Time",
      "organizador-de-time": "Organizador de Time",
      "organizador-campeonato": "Organizador de Campeonato",
      "organizador-de-campeonato": "Organizador de Campeonato",
      admin: "Administrador",
    };
    const normalizedCargo = normalizeCargo(cargo);
    return types[normalizedCargo] || "Usuário";
  };

  const quickAccessItems = [
    {
      icon: <Icon icon={Shield} size={30} color="var(--color-brand-primary)" />,
      title: "Meus Times",
      description: "Gerencie seus times e membros",
      href: "#",
    },
    {
      icon: <Icon icon={Trophy} size={30} color="var(--color-brand-primary)" />,
      title: "Campeonatos",
      description: "Explore campeonatos disponíveis",
      href: "#",
    },
    {
      icon: <Icon icon={BarChart3} size={30} color="var(--color-brand-primary)" />,
      title: "Estatísticas",
      description: "Veja seus dados e performance",
      href: "#",
    },
    {
      icon: <Icon icon={MessageCircle} size={30} color="var(--color-brand-primary)" />,
      title: "Comunidade",
      description: "Conecte-se com outros usuários",
      href: "#",
    },
  ];

  return (
    <AppLayout>
      <FadeIn delay={0} direction="up">
        <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
          {/* Greeting */}
          <div style={{ marginBottom: "var(--space-8)" }}>
            <h1
              style={{
                fontSize: "clamp(28px, 5vw, 48px)",
                fontWeight: 700,
                color: "white",
                marginBottom: "var(--space-2)",
              }}
            >
              Bem-vindo, <span style={{ color: "var(--color-brand-primary)" }}>{user.name}</span>!
            </h1>
            <p
              style={{
                fontSize: "clamp(14px, 3vw, 18px)",
                color: "var(--color-text-secondary)",
              }}
            >
              Você está conectado como <strong>{user.email}</strong>
            </p>
          </div>

          {/* Profile Card */}
          <FadeIn delay={0.1} direction="up">
            <Card
              padding="lg"
              style={{
                background: "rgba(0, 230, 118, 0.05)",
                border: `1px solid rgba(0, 230, 118, 0.2)`,
                marginBottom: "var(--space-8)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "var(--space-4)",
                }}
              >
                {/* Nome */}
                <div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "var(--space-2)",
                      fontWeight: 600,
                    }}
                  >
                    Nome Completo
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(14px, 2vw, 18px)",
                      fontWeight: 600,
                      color: "white",
                    }}
                  >
                    {user?.name || "Não informado"}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "var(--space-2)",
                      fontWeight: 600,
                    }}
                  >
                    Email
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(12px, 1.5vw, 16px)",
                      fontWeight: 600,
                      color: "var(--color-brand-primary)",
                      wordBreak: "break-all",
                    }}
                  >
                    {user?.email || "Não informado"}
                  </div>
                </div>

                {/* Tipo de Perfil */}
                <div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "var(--space-2)",
                      fontWeight: 600,
                    }}
                  >
                    Tipo de Perfil
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-2) var(--space-3)",
                      background: "var(--color-brand-primary)",
                      color: "black",
                      borderRadius: "8px",
                      fontSize: "clamp(12px, 1.5vw, 14px)",
                      fontWeight: 600,
                    }}
                  >
                    {getProfileType(user?.cargo)}
                  </div>
                </div>
              </div>
            </Card>
          </FadeIn>

          {/* Quick Access Section */}
          <div>
            <h2
              style={{
                fontSize: "clamp(20px, 4vw, 32px)",
                fontWeight: 700,
                color: "white",
                marginBottom: "var(--space-4)",
              }}
            >
              Acesso Rápido
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              {quickAccessItems.map((item, index) => (
                <FadeIn key={item.title} delay={0.1 + index * 0.05} direction="up">
                  <div
                    style={{
                      textAlign: "center",
                      cursor: "pointer",
                      borderRadius: "12px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                      const elem = e.currentTarget as HTMLElement;
                      elem.style.background = "rgba(0, 230, 118, 0.08)";
                      elem.style.borderColor = "rgba(0, 230, 118, 0.3)";
                      elem.style.transform = "translateY(-4px)";
                      elem.style.boxShadow = "0 8px 24px rgba(0, 230, 118, 0.1)";
                    }}
                    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                      const elem = e.currentTarget as HTMLElement;
                      elem.style.background = "rgba(255, 255, 255, 0.02)";
                      elem.style.borderColor = "rgba(0, 230, 118, 0.1)";
                      elem.style.transform = "translateY(0)";
                      elem.style.boxShadow = "none";
                    }}
                  >
                    <Card
                      padding="md"
                      style={{
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(0, 230, 118, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          width: "3.5rem",
                          height: "3.5rem",
                          margin: "0 auto var(--space-3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {item.icon}
                      </div>
                      <h3
                        style={{
                          fontSize: "clamp(14px, 2vw, 18px)",
                          fontWeight: 600,
                          color: "white",
                          marginBottom: "var(--space-2)",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "clamp(12px, 1.5vw, 14px)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {item.description}
                      </p>
                    </Card>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>
    </AppLayout>
  );
}
