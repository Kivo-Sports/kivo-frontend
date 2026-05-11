/**
 * @file InactiveAccountModal.tsx
 * @description Modal para avisar conta desativada com opção de reativar
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/atoms/Icon';
import { Lock } from 'lucide-react';

interface InactiveAccountModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
}

export function InactiveAccountModal({ isOpen, email, onClose }: InactiveAccountModalProps) {
  const router = useRouter();

  const handleReactivate = () => {
    router.push('/reativar-conta');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card
              padding="lg"
              style={{
                maxWidth: 450,
                width: '100%',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '3rem',
                  marginBottom: 'var(--space-3)',
                  color: 'var(--color-feedback-danger)',
                }}
              >
                <Icon icon={Lock} size={36} />
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  marginBottom: 'var(--space-2)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Conta Desativada
              </h2>

              {/* Message */}
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-4)',
                  lineHeight: 1.6,
                }}
              >
                Sua conta foi desativada. Você pode reativá-la clicando no botão abaixo para retomar o acesso.
              </p>

              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-4)',
                  fontWeight: 500,
                }}
              >
                Email: <strong>{email}</strong>
              </p>

              {/* Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  justifyContent: 'center',
                }}
              >
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleReactivate}
                >
                  Reativar Conta
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
