"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Tema atual: ${theme === "dark" ? "escuro" : "claro"}. Mudar para ${next === "dark" ? "escuro" : "claro"}`}
      title={`Tema ${theme === "dark" ? "escuro" : "claro"}`}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 40, padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-default)", background: "var(--color-bg-surface)", color: "var(--color-text-primary)", cursor: "pointer" }}
    >
      {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      <span>{theme === "dark" ? "Tema claro" : "Tema escuro"}</span>
    </button>
  );
}
