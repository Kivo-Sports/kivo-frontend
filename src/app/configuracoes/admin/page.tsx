/**
 * @file /configuracoes/admin/page.tsx
 * @description Página de gerenciamento de administradores - Mesmo padrão de /configuracoes
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

// Components
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { SettingsSidebar } from '@/components/organisms/SettingsSidebar';
import { AdminList } from '@/components/molecules/AdminList/AdminList';
import { AdminFormModal } from '@/components/molecules/AdminFormModal/AdminFormModal';
import { AppLayout } from '@/components/templates/AppLayout';
import { Spinner } from '@/components/atoms/Spinner';

// Store
import type { RootState } from '@/store';

// Lib
import { normalizeCargo } from '@/lib/auth.utils';

// Services
import { AdminData } from '@/services/admin.service';

// Hooks
import { useToast } from '@/components/atoms/Toast';

export default function AdminPage() {
  const router = useRouter();
  const { error: toastError } = useToast();

  // Estado
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const isHydrated = useSelector((state: RootState) => state.auth.isHydrated);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminData | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isAdmin = normalizeCargo(user?.cargo) === 'administrador';

  // Verificar se é admin - só depois que a sessão terminar de hidratar do localStorage
  useEffect(() => {
    if (isHydrated && (!user || !isAdmin)) {
      router.push('/configuracoes');
    }
  }, [isHydrated, user, isAdmin, router]);

  if (!isHydrated) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <Spinner size="lg" ariaLabel="Verificando permissões" />
        </div>
      </AppLayout>
    );
  }

  if (!user || !isAdmin || !token) {
    return null;
  }

  const handleNewAdmin = () => {
    setSelectedAdmin(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditAdmin = (admin: AdminData) => {
    setSelectedAdmin(admin);
    setIsFormModalOpen(true);
  };

  const handleFormClose = () => {
    setIsFormModalOpen(false);
    setSelectedAdmin(undefined);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AppLayout>
      <div
        style={{
          display: 'grid',
          gap: 'var(--space-6)',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          gridTemplateColumns: 'clamp(150px, 25%, 250px) 1fr',
        }}
        data-settings-grid
      >
        {/* Sidebar */}
        <div data-settings-sidebar>
          <SettingsSidebar activeItem="manage-admins" />
        </div>

        {/* Conteúdo Principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <h1
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                >
                  👨‍💼 Gerenciar Admins
                </h1>
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Controle de contas administrativas do sistema Kivo Sports
              </p>
            </div>

            {/* Seção: Lista de Admins */}
            <Card padding="lg" style={{ marginBottom: 'var(--space-6)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                >
                  Administradores
                </h2>
                <Button variant="primary" size="sm" onClick={handleNewAdmin}>
                  + Novo Admin
                </Button>
              </div>

              <AdminList
                token={token}
                refreshTrigger={refreshTrigger}
                onEditClick={handleEditAdmin}
              />
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modal para criar/editar admins */}
      <AdminFormModal
        isOpen={isFormModalOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        admin={selectedAdmin}
        token={token}
      />

      {/* Responsivo */}
      <style>{`
        @media (max-width: 1024px) {
          [data-settings-grid] {
            grid-template-columns: 1fr !important;
          }

          [data-settings-sidebar] {
            order: -1;
          }

          h1 {
            font-size: var(--text-xl) !important;
          }
        }

        @media (max-width: 640px) {
          h1 {
            font-size: var(--text-lg) !important;
          }

          h2 {
            font-size: var(--text-sm) !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}
