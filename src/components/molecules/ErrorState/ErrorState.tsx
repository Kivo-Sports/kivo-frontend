/**
 * @file ErrorState.tsx
 * @description Estado visual de erro de carregamento (falha de API/rede).
 *
 * Existe para que erro de requisicao NUNCA seja renderizado como estado vazio.
 * O padrao visual segue o que ja era usado inline em telas como
 * `organizador/times/jogos` (Card centralizado + texto em danger + "Tentar novamente").
 *
 * @author Kivo Sports - TCC
 */

"use client";

import { AlertCircle } from "lucide-react";
import type { CSSProperties } from "react";

import { Icon } from "@/components/atoms/Icon";
import { Card } from "@/components/molecules/Card";

export interface ErrorStateProps {
  /** Titulo curto do erro. */
  title?: string;
  /** Detalhe/mensagem auxiliar. */
  message?: string;
  /** Quando informado, renderiza o botao "Tentar novamente". */
  onRetry?: () => void;
  /** Rotulo do botao de retry. */
  retryLabel?: string;
  style?: CSSProperties;
}

export function ErrorState({
  title = "Não foi possível carregar",
  message = "Verifique sua conexão e tente novamente.",
  onRetry,
  retryLabel = "Tentar novamente",
  style,
}: ErrorStateProps) {
  return (
    <Card padding="lg" style={{ textAlign: "center", ...style }}>
      <div role="alert" data-testid="error-state">
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(255,72,68,0.12)",
            border: "1px solid rgba(255,72,68,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto var(--space-3)",
          }}
        >
          <Icon icon={AlertCircle} size={22} style={{ color: "var(--color-feedback-danger)" }} />
        </div>

        <p
          style={{
            margin: "0 0 var(--space-1)",
            fontWeight: 600,
            color: "var(--color-feedback-danger)",
            fontSize: "var(--text-sm)",
          }}
        >
          {title}
        </p>

        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          {message}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              marginTop: "var(--space-3)",
              border: "1px solid rgba(0,230,118,0.28)",
              background: "rgba(0,230,118,0.08)",
              color: "var(--color-brand-primary)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-2) var(--space-4)",
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {retryLabel}
          </button>
        )}
      </div>
    </Card>
  );
}
