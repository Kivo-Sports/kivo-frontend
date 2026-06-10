/**
 * @file Select.tsx
 * @description Select genérico no padrão Kivo (dropdown customizado, borda verde,
 * chevron animado e marcação do item ativo). Componente controlado.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = "Selecione...",
  disabled,
  error,
}: SelectProps) {
  const [aberto, setAberto] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selecionado = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    if (aberto) document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [aberto]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "var(--space-2)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setAberto((v) => !v)}
        aria-invalid={Boolean(error)}
        style={{
          height: "3rem",
          width: "100%",
          borderRadius: "var(--radius-md)",
          border: `1px solid ${error ? "var(--color-feedback-danger)" : "var(--color-border-default)"}`,
          background: "var(--color-bg-input)",
          padding: "0 var(--space-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-2)",
          cursor: disabled ? "not-allowed" : "pointer",
          color: selecionado ? "var(--color-text-primary)" : "var(--color-text-muted)",
          fontSize: "var(--text-sm)",
          textAlign: "left",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selecionado ? selecionado.label : placeholder}
        </span>
        <Icon
          icon={ChevronDown}
          size={16}
          style={{
            flexShrink: 0,
            color: "var(--color-text-muted)",
            transform: aberto ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>

      <AnimatePresence>
        {aberto && options.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 1200,
              listStyle: "none",
              margin: 0,
              padding: "var(--space-1)",
              maxHeight: "260px",
              overflowY: "auto",
              background: "rgba(20,20,20,0.99)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0,230,118,0.25)",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
          >
            {options.map((opt) => {
              const ativoSel = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setAberto(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-2)",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: ativoSel ? "rgba(0,230,118,0.1)" : "transparent",
                      color: ativoSel ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
                      cursor: "pointer",
                      fontSize: "var(--text-sm)",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!ativoSel) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!ativoSel) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {opt.label}
                    </span>
                    {ativoSel && <Icon icon={Check} size={14} style={{ flexShrink: 0 }} />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" style={{ marginTop: "var(--space-2)", marginBottom: 0, fontSize: "var(--text-sm)", color: "var(--color-feedback-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
