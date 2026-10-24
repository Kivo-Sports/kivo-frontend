/**
 * @file ConfirmModal.tsx
 * @description Modal de confirmação no padrão Kivo (substitui window.confirm). Usa o Modal base.
 */

"use client";

import { Modal } from "@/components/molecules/Modal";
import { Button } from "@/components/atoms/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title={title}
      maxWidth={440}
      footer={
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} size="sm" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && (
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{description}</div>
      )}
    </Modal>
  );
}
