"use client";

/**
 * @file dashboard/page.tsx
 * @description Página de redirecionamento. Encaminha o usuário para o painel do seu
 * cargo (torcedor, organizador de time/campeonato, admin). Usada como destino
 * pós-cadastro e como fallback genérico.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/atoms/Spinner";
import { useAppSelector } from "@/store/hooks";
import { getRedirectPathAfterLogin } from "@/lib/auth.utils";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated || !token) {
      router.replace("/login");
      return;
    }

    const destino = getRedirectPathAfterLogin(user?.cargo);
    // Evita loop caso o cargo seja desconhecido (fallback aponta para /dashboard).
    router.replace(destino === "/dashboard" ? "/home" : destino);
  }, [mounted, isAuthenticated, token, user?.cargo, router]);

  return (
    <main
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      aria-busy="true"
    >
      <Spinner size="lg" ariaLabel="Redirecionando..." />
    </main>
  );
}
