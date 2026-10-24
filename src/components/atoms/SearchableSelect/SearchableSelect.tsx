/**
 * @file SearchableSelect.tsx
 * @description Combobox no padrão Kivo: campo com busca interna que filtra as opções
 * e limita a quantidade renderizada (não despeja a lista inteira de uma vez).
 * Componente controlado.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";
import { Icon } from "@/components/atoms/Icon";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxResults?: number;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum resultado.",
  maxResults = 8,
  disabled,
}: SearchableSelectProps) {
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selecionado = options.find((o) => o.value === value);

  const filtradas = useMemo(() => {
    const t = termo.trim().toLowerCase();
    const base = t
      ? options.filter((o) => o.label.toLowerCase().includes(t) || (o.sublabel ?? "").toLowerCase().includes(t))
      : options;
    return base.slice(0, maxResults);
  }, [options, termo, maxResults]);

  const totalDisponivel = useMemo(() => {
    const t = termo.trim().toLowerCase();
    if (!t) return options.length;
    return options.filter((o) => o.label.toLowerCase().includes(t) || (o.sublabel ?? "").toLowerCase().includes(t)).length;
  }, [options, termo]);

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    if (aberto) {
      document.addEventListener("mousedown", handleClickFora);
      // foca o campo de busca ao abrir
      setTimeout(() => inputRef.current?.focus(), 40);
    }
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [aberto]);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {label && (
        <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setAberto((v) => !v)}
        style={{
          height: "3rem",
          width: "100%",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border-default)",
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
        <Icon icon={ChevronDown} size={16} style={{ flexShrink: 0, color: "var(--color-text-muted)", transform: aberto ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
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
              background: "rgba(20,20,20,0.99)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(0,230,118,0.25)",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            {/* Barra de busca */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Icon icon={Search} size={15} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--color-text-primary)",
                  fontSize: "var(--text-sm)",
                }}
              />
            </div>

            {/* Resultados */}
            <ul style={{ listStyle: "none", margin: 0, padding: "var(--space-1)", maxHeight: "240px", overflowY: "auto" }}>
              {filtradas.length === 0 ? (
                <li style={{ padding: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textAlign: "center" }}>{emptyText}</li>
              ) : (
                filtradas.map((opt) => {
                  const ativoSel = opt.value === value;
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setAberto(false);
                          setTermo("");
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
                        onMouseEnter={(e) => { if (!ativoSel) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { if (!ativoSel) e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt.label}</span>
                          {opt.sublabel && (
                            <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {opt.sublabel}
                            </span>
                          )}
                        </span>
                        {ativoSel && <Icon icon={Check} size={14} style={{ flexShrink: 0 }} />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            {/* Rodapé: indica que a lista é limitada */}
            {totalDisponivel > filtradas.length && (
              <div style={{ padding: "var(--space-2) var(--space-3)", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textAlign: "center" }}>
                Mostrando {filtradas.length} de {totalDisponivel}. Refine a busca para ver mais.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
