"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { isOrganizadorCampeonato, getRedirectPathAfterLogin } from "@/lib/auth.utils";
import { Spinner } from "@/components/atoms/Spinner";
import { Button } from "@/components/atoms/Button";

export default function OrganizadorCampeonatosLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  const hasAccess = isHydrated && isOrganizadorCampeonato(user?.cargo);

  useEffect(() => {
    if (!isHydrated || hasAccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isHydrated, hasAccess]);

  useEffect(() => {
    if (!isHydrated || hasAccess || countdown > 0) return;
    router.replace(getRedirectPathAfterLogin(user?.cargo));
  }, [countdown, hasAccess, isHydrated, router, user?.cargo]);

  if (!isHydrated) {
    return (
      <main
        style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}
        aria-busy="true"
      >
        <Spinner size="lg" ariaLabel="Verificando permissões" />
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main
        style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: "480px",
            padding: "var(--space-8)",
            borderRadius: "var(--radius-2xl)",
            background: "linear-gradient(160deg, rgba(255,72,68,0.08), rgba(0,0,0,0.4))",
            border: "1px solid rgba(255,72,68,0.25)",
          }}
        >
          <div
            style={{
              width: "5rem",
              height: "5rem",
              margin: "0 auto var(--space-4)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,72,68,0.12)",
              border: "1px solid rgba(255,72,68,0.3)",
            }}
          >
            <Lock size={32} color="var(--color-feedback-danger)" />
          </div>

          <h1
            style={{
              margin: "0 0 var(--space-2)",
              fontSize: "var(--text-2xl)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            Acesso negado
          </h1>

          <p
            style={{
              margin: "0 0 var(--space-5)",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
              lineHeight: 1.6,
            }}
          >
            Esta área é exclusiva para{" "}
            <strong style={{ color: "var(--color-text-secondary)" }}>
              Organizadores de Campeonato
            </strong>
            . Seu perfil não tem permissão para acessar esta página.
          </p>

          <p
            style={{
              margin: "0 0 var(--space-5)",
              color: "var(--color-text-muted)",
              fontSize: "var(--text-sm)",
            }}
          >
            Redirecionando em{" "}
            <strong style={{ color: "var(--color-feedback-danger)" }}>{countdown}s</strong>...
          </p>

          <Button
            variant="primary"
            onClick={() => router.replace(getRedirectPathAfterLogin(user?.cargo))}
          >
            Ir agora
          </Button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
