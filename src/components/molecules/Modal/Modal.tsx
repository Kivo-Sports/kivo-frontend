/**
 * @file Modal.tsx
 * @description Shell de modal reutilizável no padrão Kivo: overlay, animação de entrada/saída,
 * fechar no ESC e no clique fora, título opcional + botão de fechar e área de rodapé.
 * Base única para todos os modais da aplicação.
 */

"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/molecules/Card";
import { Icon } from "@/components/atoms/Icon";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number | string;
  showClose?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  zIndex?: number;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 480,
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  zIndex = 1300,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, closeOnEsc, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => closeOnOverlayClick && onClose()}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            zIndex,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth }}
          >
            <Card padding="lg">
              {(title || showClose) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-2)",
                    marginBottom: title ? "var(--space-4)" : 0,
                  }}
                >
                  {title ? (
                    <h3 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 700, color: "white" }}>{title}</h3>
                  ) : (
                    <span />
                  )}
                  {showClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Fechar"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4 }}
                    >
                      <Icon icon={X} size={18} />
                    </button>
                  )}
                </div>
              )}

              {children}

              {footer && (
                <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                  {footer}
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
