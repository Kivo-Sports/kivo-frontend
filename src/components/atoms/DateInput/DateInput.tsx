/**
 * @file DateInput.tsx
 * @description Campo de data / data-hora no padrão Kivo. Usa o seletor nativo, porém
 * estilizado para o tema escuro (color-scheme dark + accent verde) e com os tokens do Kivo.
 * Componente único: alterar aqui muda todos os campos de data da aplicação.
 */

"use client";

import { forwardRef } from "react";
import type { CSSProperties, InputHTMLAttributes } from "react";

export interface DateInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  type?: "date" | "datetime-local" | "time";
}

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "var(--space-2)",
  fontSize: "var(--text-sm)",
  fontWeight: 600,
  color: "var(--color-text-primary)",
};

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { label, error, type = "date", id, style, disabled, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const invalido = Boolean(error) || ariaInvalid === true || ariaInvalid === "true";

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        type={type}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        style={{
          height: "3rem",
          width: "100%",
          padding: "0 var(--space-3)",
          borderRadius: "var(--radius-md)",
          border: `1px solid ${invalido ? "var(--color-feedback-danger)" : "var(--color-border-default)"}`,
          background: "var(--color-bg-input)",
          color: "var(--color-text-primary)",
          fontSize: "var(--text-sm)",
          // Faz o ícone do calendário/relógio e o popup nativos renderizarem no tema escuro
          colorScheme: "dark",
          accentColor: "var(--color-brand-primary)",
          outline: "none",
          opacity: disabled ? 0.6 : 1,
          ...style,
        }}
        {...props}
      />
      {error && (
        <p role="alert" style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-sm)", color: "var(--color-feedback-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
});
