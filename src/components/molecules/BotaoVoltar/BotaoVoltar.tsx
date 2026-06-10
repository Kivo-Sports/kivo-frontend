"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";

interface BotaoVoltarProps {
  /** Rota usada quando não há página anterior no histórico (ex.: tela aberta diretamente). */
  fallbackHref: string;
  label?: string;
}

/**
 * Botão "Voltar" que retorna para a página anterior do histórico do navegador.
 * Se a tela foi aberta diretamente (sem histórico), navega para `fallbackHref`.
 */
export function BotaoVoltar({ fallbackHref, label = "Voltar" }: BotaoVoltarProps) {
  const router = useRouter();

  const handleVoltar = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleVoltar}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: "var(--color-text-muted)",
        fontSize: "var(--text-sm)",
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-brand-primary)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
    >
      <Icon icon={ArrowLeft} size={14} />
      {label}
    </button>
  );
}
