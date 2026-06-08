/**
 * @file PasswordConfirmModal.tsx
 * @description Modal de confirmação que exige a senha do admin (reautenticação) antes de
 * executar uma ação sensível. Usa o Modal base. Padrão Kivo.
 */

"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/molecules/Modal";
import { Button } from "@/components/atoms/Button";
import { useToast } from "@/components/atoms/Toast";
import { useAppSelector } from "@/store/hooks";
import { loginUser } from "@/services/auth.service";

interface PasswordConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  /** Executado somente após a senha ser validada. Lance erro para manter o modal aberto. */
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  height: "3rem",
  width: "100%",
  padding: "0 var(--space-3)",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-default)",
  background: "var(--color-bg-input)",
  color: "var(--color-text-primary)",
  fontSize: "var(--text-sm)",
};

export function PasswordConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  danger = false,
  onConfirm,
  onClose,
}: PasswordConfirmModalProps) {
  const { error } = useToast();
  const usuario = useAppSelector((state) => state.auth.user);
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setSenha("");
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!senha) {
      error("Digite sua senha para confirmar.");
      return;
    }
    if (!usuario?.email) {
      error("Sessão inválida. Faça login novamente.");
      return;
    }
    setLoading(true);
    try {
      const check = await loginUser(usuario.email, senha);
      if (!check.success) {
        error(check.error || "Senha incorreta.");
        return;
      }
      await onConfirm();
      setSenha("");
      onClose();
    } catch {
      // erro da ação é tratado pelo chamador; mantém o modal aberto
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !loading && onClose()}
      title={title}
      maxWidth={440}
      footer={
        <>
          <Button variant="ghost" size="sm" disabled={loading} onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={danger ? "danger" : "primary"} size="sm" loading={loading} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && (
        <div style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          {description}
        </div>
      )}
      <label style={{ display: "block", marginBottom: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
        Senha de administrador
      </label>
      <input
        type="password"
        style={inputStyle}
        value={senha}
        autoFocus
        onChange={(e) => setSenha(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleConfirm();
        }}
        placeholder="Sua senha"
      />
    </Modal>
  );
}
