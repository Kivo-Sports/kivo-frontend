/**
 * @file DeactivateAccountModal.tsx
 * @description Modal para confirmar desativação de conta com avisos importantes
 */

'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Icon } from '@/components/atoms/Icon';
import { useToast } from '@/components/atoms/Toast';

interface DeactivateAccountModalProps {
  isOpen: boolean;
  userEmail: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

interface FormErrors {
  [key: string]: string;
}

export function DeactivateAccountModal({
  isOpen,
  userEmail,
  onClose,
  onConfirm,
}: DeactivateAccountModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleConfirm = async () => {
    const newErrors: FormErrors = {};

    if (!confirmCheck) {
      newErrors.confirm = 'Você precisa confirmar a desativação';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
      toastSuccess('Conta desativada com sucesso');
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desativar conta';
      toastError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmCheck(false);
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 'var(--space-4)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card
              padding="lg"
              style={{
                width: '100%',
                maxWidth: 450,
              }}
            >
              {/* Ícone de Alerta */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 72, 68, 0.1)',
                  border: '1px solid rgba(255, 72, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                }}
              >
                <Icon icon={AlertTriangle} size={22} style={{ color: 'var(--color-feedback-danger)' }} />
              </div>

              <h2
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  marginBottom: 'var(--space-2)',
                  color: 'var(--color-feedback-danger)',
                  textAlign: 'center',
                }}
              >
                Desativar Conta
              </h2>

              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-4)',
                  lineHeight: 1.6,
                  textAlign: 'center',
                }}
              >
                Ao desativar sua conta, você perderá acesso imediato a todas as funcionalidades. Sua conta pode ser reativada posteriormente clicando em "Reativar Conta" na página de login.
              </p>

              {/* Avisos */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginBottom: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderLeft: '4px solid var(--color-feedback-danger)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <li
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>Perderá acesso aos seus times e campeonatos</span>
                  </li>
                  <li
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span>Esta ação não pode ser desfeita imediatamente</span>
                  </li>
                </ul>
              </motion.div>

              {/* Email de Conta */}
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-4)',
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                Email associado: <strong>{userEmail}</strong>
              </p>

              {/* Checkbox de Confirmação */}
              <div
                style={{
                  marginBottom: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                }}
              >
                <input
                  type="checkbox"
                  id="confirm-deactivate"
                  checked={confirmCheck}
                  onChange={(e) => {
                    setConfirmCheck(e.target.checked);
                    setErrors({ ...errors, confirm: '' });
                  }}
                  style={{
                    marginTop: '4px',
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--color-feedback-danger)',
                  }}
                />
                <label
                  htmlFor="confirm-deactivate"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  Confirmo que desejo desativar minha conta permanentemente
                </label>
              </div>
              {errors.confirm && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-feedback-danger)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {errors.confirm}
                </motion.p>
              )}

              {/* Botões */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  justifyContent: 'flex-end',
                }}
              >
                <Button variant="secondary" size="md" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleConfirm}
                  loading={loading}
                  disabled={!confirmCheck}
                >
                  Desativar Conta
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
