"use client";

import type { ReactNode } from "react";
import { HeaderResponsive } from "@/components/organisms/HeaderResponsive";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 6% 10%, color-mix(in srgb, var(--color-brand-primary), transparent 86%), transparent 36%), radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--color-brand-secondary), transparent 86%), transparent 30%), linear-gradient(145deg, var(--color-bg-base), color-mix(in srgb, var(--color-bg-base), var(--color-bg-elevated) 8%))",
      }}
    >
      <HeaderResponsive />

      <main
        style={{
          flex: 1,
          paddingTop: "calc(70px + var(--space-6))",
          paddingLeft: "clamp(var(--space-3), 4vw, var(--space-6))",
          paddingRight: "clamp(var(--space-3), 4vw, var(--space-6))",
          paddingBottom: "var(--space-8)",
          maxWidth: "100%",
        }}
      >
        {children}
      </main>
    </div>
  );
}
