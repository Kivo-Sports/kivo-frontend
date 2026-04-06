/**
 * @file ChangePasswordModal.tsx
 * @description Modal para redefinir senha com validação
 */

'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/molecules/Card';
import { useToast } from '@/components/atoms/Toast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}

interface FormErrors {
  [key: string]: string;
}

const PASSWORD_REQUIREMENTS = [
  { regex: /[A-Z]/, message: 'Uma letra maiúscula' },
  { regex: /[a-z]/, message: 'Uma letra minúscula' },
  { regex: /[0-9]/, message: 'Um número' },
  { regex: /[!@#$%^&*(),.?":{}|<>]/, message: 'Um caractere especial' },
  { regex: /.{6,}/, message: '6 ou mais caracteres' },
];

function validatePassword(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((req) => req.regex.test(password));
}

function getPasswordErrors(password: string): string[] {
  return PASSWORD_REQUIREMENTS.filter((req) => !req.regex.test(password)).map((req) => req.message);
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
}: ChangePasswordModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const passwordErrors = getPasswordErrors(newPassword);
  const isPasswordValid = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSubmit = async () => {
    const newErrors: FormErrors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Insira sua senha atual';
    }
    if (!newPassword.trim()) {
      newErrors.newPassword = 'Insira uma nova senha';
    } else if (!isPasswordValid) {
      newErrors.newPassword = 'A senha não atende aos requisitos';
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirme a nova senha';
    } else if (!passwordsMatch) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(currentPassword, newPassword);
      toastSuccess('Senha atualizada com sucesso!');
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar senha';
      toastError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
              <h2
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  marginBottom: 'var(--space-2)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Redefinir Senha
              </h2>

              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-4)',
                  lineHeight: 1.6,
                }}
              >
                Digite sua senha atual e a nova senha que deseja usar.
              </p>

              {/* Senha Atual */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <Input
                  type="password"
                  label="Senha Atual"
                  placeholder="••••••"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setErrors({ ...errors, currentPassword: '' });
                  }}
                  error={errors.currentPassword}
                />
              </div>

              {/* Nova Senha */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <Input
                  type="password"
                  label="Nova Senha"
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors({ ...errors, newPassword: '' });
                  }}
                  error={errors.newPassword}
                />

                {/* Requisitos de Senha */}
                {newPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        marginBottom: 'var(--space-2)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      Requisitos:
                    </p>
                    <ul
                      style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-1)',
                      }}
                    >
                      {PASSWORD_REQUIREMENTS.map((req, index) => (
                        <li
                          key={index}
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: req.regex.test(newPassword)
                              ? 'var(--color-feedback-success)'
                              : 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                          }}
                        >
                          <span>{req.regex.test(newPassword) ? '✓' : '○'}</span>
                          {req.message}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>

              {/* Confirmar Nova Senha */}
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <Input
                  type="password"
                  label="Confirmar Nova Senha"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors({ ...errors, confirmPassword: '' });
                  }}
                  error={errors.confirmPassword}
                />
              </div>

              {/* Botões */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  justifyContent: 'flex-end',
                }}
              >
                <Button variant="ghost" size="md" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                >
                  Atualizar Senha
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
