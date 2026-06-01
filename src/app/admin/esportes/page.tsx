/**
 * @file /admin/esportes/page.tsx
 * @description Página de gerenciamento de esportes (modalidades) — acesso somente Administrador.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

import { Button } from '@/components/atoms/Button';
import { BotaoVoltar } from '@/components/molecules/BotaoVoltar';
import { EsporteList } from '@/components/molecules/EsporteList';
import { EsporteFormModal } from '@/components/molecules/EsporteFormModal';
import { AppLayout } from '@/components/templates/AppLayout';

import type { RootState } from '@/store';
import type { EsporteResponse } from '@/types/esporte';

export default function EsportesAdminPage() {
  const router = useRouter();

  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedEsporte, setSelectedEsporte] = useState<EsporteResponse | undefined>(undefined);

  useEffect(() => {
    if (user && user.cargo !== 'Administrador') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.cargo !== 'Administrador' || !token) {
    return null;
  }

  const handleNew = () => {
    setSelectedEsporte(undefined);
    setIsFormModalOpen(true);
  };

  const handleEdit = (esporte: EsporteResponse) => {
    setSelectedEsporte(esporte);
    setIsFormModalOpen(true);
  };

  const handleClose = () => {
    setIsFormModalOpen(false);
    setSelectedEsporte(undefined);
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Voltar */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <BotaoVoltar fallbackHref="/dashboard" label="Voltar ao painel" />
          </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 var(--space-2)' }}>
                Gerenciar Esportes
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
                Modalidades disponíveis para times e campeonatos no Kivo Sports
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleNew}>
              + Novo Esporte
            </Button>
          </div>

          <EsporteList onEditClick={handleEdit} />
        </motion.div>
      </div>

      <EsporteFormModal
        isOpen={isFormModalOpen}
        onClose={handleClose}
        esporte={selectedEsporte}
      />
    </AppLayout>
  );
}
