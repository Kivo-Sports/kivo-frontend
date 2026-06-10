/**
 * @file EsporteList.tsx
 * @description Lista de esportes em linhas compactas (ícone · nome/status · ações), estilo Kivo.
 */

'use client';

import { motion } from 'framer-motion';
import { Icon as IconifyIcon } from '@iconify/react';
import { Pencil, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/components/atoms/Toast';
import { Icon } from '@/components/atoms/Icon';
import { Spinner } from '@/components/atoms/Spinner';
import {
  useListarEsportesQuery,
  useToggleStatusEsporteMutation,
} from '@/store/api/esporteApi';
import type { EsporteResponse } from '@/types/esporte';

interface EsporteListProps {
  onEditClick?: (esporte: EsporteResponse) => void;
}

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR');

export function EsporteList({ onEditClick }: EsporteListProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: esportes = [], isLoading } = useListarEsportesQuery();
  const [toggleStatus, { isLoading: isToggling }] = useToggleStatusEsporteMutation();

  const handleToggle = async (esporte: EsporteResponse) => {
    try {
      await toggleStatus(esporte.id).unwrap();
      toastSuccess(`Esporte ${esporte.nome} ${esporte.ativo ? 'desativado' : 'ativado'}`);
    } catch {
      toastError('Erro ao alterar status do esporte');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Spinner size="md" ariaLabel="Carregando esportes" />
      </div>
    );
  }

  if (esportes.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-10) var(--space-4)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600, margin: '0 0 var(--space-1)' }}>
          Nenhum esporte cadastrado
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
          Clique em “+ Novo Esporte” para adicionar a primeira modalidade.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {esportes.map((esporte, index) => {
        const acaoBtnBase: React.CSSProperties = {
          width: '44px',
          height: '44px',
          flexShrink: 0,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isToggling ? 'default' : 'pointer',
          transition: 'all 0.15s',
        };

        return (
          <motion.div
            key={esporte.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.035, 0.25), duration: 0.25 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(150deg, rgba(22,22,22,0.96), rgba(12,12,12,0.85))',
                border: `1px solid ${esporte.ativo ? 'rgba(0,230,118,0.18)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
              }}
            >
              {/* Ícone */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  flexShrink: 0,
                  borderRadius: 'var(--radius-md)',
                  background: esporte.ativo
                    ? 'linear-gradient(150deg, rgba(0,230,118,0.2), rgba(0,230,118,0.05))'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${esporte.ativo ? 'rgba(0,230,118,0.32)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: esporte.ativo ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                }}
              >
                <IconifyIcon icon={esporte.icone} width={28} height={28} />
              </div>

              {/* Nome + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    color: 'white',
                    lineHeight: 1.15,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {esporte.nome}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: '3px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Adicionado em {formatDate(esporte.criadoEm)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: 'var(--text-xs)', fontWeight: 600, color: esporte.ativo ? 'var(--color-brand-primary)' : 'var(--color-text-muted)' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: esporte.ativo ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                        boxShadow: esporte.ativo ? '0 0 8px var(--color-brand-primary)' : 'none',
                      }}
                    />
                    {esporte.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              {/* Ações (botões quadrados) */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                <button
                  type="button"
                  title="Editar"
                  aria-label={`Editar ${esporte.nome}`}
                  disabled={isToggling}
                  onClick={() => onEditClick?.(esporte)}
                  style={{
                    ...acaoBtnBase,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                  <Icon icon={Pencil} size={17} />
                </button>

                <button
                  type="button"
                  title={esporte.ativo ? 'Desativar' : 'Ativar'}
                  aria-label={`${esporte.ativo ? 'Desativar' : 'Ativar'} ${esporte.nome}`}
                  disabled={isToggling}
                  onClick={() => handleToggle(esporte)}
                  style={{
                    ...acaoBtnBase,
                    background: esporte.ativo ? 'rgba(255,72,68,0.08)' : 'rgba(0,230,118,0.1)',
                    border: `1px solid ${esporte.ativo ? 'rgba(255,72,68,0.3)' : 'rgba(0,230,118,0.35)'}`,
                    color: esporte.ativo ? 'var(--color-feedback-danger)' : 'var(--color-brand-primary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = esporte.ativo ? 'rgba(255,72,68,0.16)' : 'rgba(0,230,118,0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = esporte.ativo ? 'rgba(255,72,68,0.08)' : 'rgba(0,230,118,0.1)';
                  }}
                >
                  <Icon icon={esporte.ativo ? PowerOff : Power} size={17} />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
