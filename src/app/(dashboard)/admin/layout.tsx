/**
 * @file (dashboard)/admin/layout.tsx
 * @description Casca do painel administrativo: guard de cargo + navegação por abas.
 * A segurança real é feita no backend ([Authorize(Roles="Administrador")]); este
 * guard apenas esconde a UI e redireciona quem não for admin.
 */

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { ShieldAlert } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { normalizeCargo } from "@/lib/auth.utils";

const TABS: { href: string; label: string }[] = [
  { href: "/admin", label: "Visão Geral" },
  { href: "/admin/campeonatos", label: "Campeonatos" },
  { href: "/admin/times", label: "Times" },
  { href: "/admin/esportes", label: "Esportes" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isHydrated } = useAppSelector((state) => state.auth);
  const isAdmin = normalizeCargo(user?.cargo) === "administrador";

  useEffect(() => {
    if (isHydrated && user && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isHydrated, user, isAdmin, router]);

  if (!isHydrated) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
        <Spinner size="lg" ariaLabel="Carregando painel administrativo" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
          <div
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "var(--radius-lg)",
              background: "rgba(0,230,118,0.1)",
              border: "1px solid rgba(0,230,118,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon icon={ShieldAlert} size={26} color="var(--color-brand-primary)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-brand-primary)" }}>
              Modo Administrador
            </p>
            <h1 style={{ margin: "2px 0 0", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: "white", lineHeight: 1.1 }}>
              Painel Administrativo
            </h1>
          </div>
        </div>

        {/* Abas */}
        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2)",
            borderBottom: "1px solid rgba(0,230,118,0.15)",
            marginBottom: "var(--space-6)",
            paddingBottom: "var(--space-2)",
          }}
        >
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            return (
              <button
                key={tab.href}
                type="button"
                onClick={() => router.push(tab.href)}
                style={{
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  border: active ? "1px solid rgba(0,230,118,0.4)" : "1px solid transparent",
                  background: active ? "rgba(0,230,118,0.12)" : "transparent",
                  color: active ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
                  fontSize: "var(--text-sm)",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {children}
      </motion.div>
    </div>
  );
}
