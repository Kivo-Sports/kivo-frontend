"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/atoms/Spinner";
import { AppLayout } from "@/components/templates/AppLayout";
import { useAppSelector } from "@/store/hooks";

interface ExplorarLayoutProps {
  children: React.ReactNode;
}

function ExplorarLoading() {
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
      <div style={{ display: "grid", justifyItems: "center", gap: "var(--space-3)" }}>
        <Spinner size="lg" ariaLabel="Carregando" />
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          Carregando...
        </p>
      </div>
    </main>
  );
}

/**
 * Layout das telas de exploração (campeonatos e times públicos).
 *
 * Diferente de (dashboard): exige apenas usuário autenticado, sem
 * redirecionar por cargo — qualquer perfil (incluindo Torcedor) navega aqui.
 */
export default function ExplorarLayout({ children }: ExplorarLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, token, isHydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isHydrated && (!isAuthenticated || !token)) {
      router.replace("/login");
    }
  }, [isAuthenticated, token, isHydrated, router]);

  if (!isHydrated || !isAuthenticated || !token) {
    return <ExplorarLoading />;
  }

  return <AppLayout>{children}</AppLayout>;
}
