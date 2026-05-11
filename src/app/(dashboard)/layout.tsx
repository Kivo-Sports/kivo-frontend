"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/atoms/Spinner";
import { DashboardLayout } from "@/components/templates";
import { useAppSelector } from "@/store/hooks";

interface DashboardRouteLayoutProps {
  children: React.ReactNode;
}

function DashboardRouteLoading() {
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
        <Spinner size="lg" ariaLabel="Carregando área autenticada" />
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
          }}
        >
          Carregando...
        </p>
      </div>
    </main>
  );
}

export default function DashboardRouteLayout({ children }: DashboardRouteLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, token, isHydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isHydrated && (!isAuthenticated || !token)) {
      router.replace("/login");
    }
  }, [isAuthenticated, token, isHydrated, router]);

  if (!isHydrated || !isAuthenticated || !token) {
    return <DashboardRouteLoading />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
