/**
 * @file AdminList.tsx
 * @description Componente para listar e gerenciar admins - Tabela desktop / Cards mobile
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/atoms/Toast';
import { Card } from '@/components/molecules/Card/Card';
import { Button } from '@/components/atoms/Button';
import { AdminData, listarAdmins, ativarAdmin, desativarAdmin } from '@/services/admin.service';

interface AdminListProps {
  token: string;
  refreshTrigger?: number;
  onEditClick?: (admin: AdminData) => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

export function AdminList({ token, refreshTrigger = 0, onEditClick }: AdminListProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    const result = await listarAdmins(token);
    if (result.success && result.data) {
      setAdmins(result.data);
    } else {
      toastError(result.error || 'Erro ao carregar admins');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAdmins();
  }, [refreshTrigger]);

  const handleAtivar = async (id: string, nome: string) => {
    setActionLoading(id);
    const result = await ativarAdmin(id, token);
    if (result.success) {
      toastSuccess(`Admin ${nome} ativado`);
      await fetchAdmins();
    } else {
      toastError(result.error || 'Erro ao ativar admin');
    }
    setActionLoading(null);
  };

  const handleDesativar = async (id: string, nome: string) => {
    setActionLoading(id);
    const result = await desativarAdmin(id, token);
    if (result.success) {
      toastSuccess(`Admin ${nome} desativado`);
      await fetchAdmins();
    } else {
      toastError(result.error || 'Erro ao desativar admin');
    }
    setActionLoading(null);
  };

  if (isLoading) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Carregando admins...</p>
        </div>
      </Card>
    );
  }

  if (admins.length === 0) {
    return (
      <Card padding="lg">
        <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Nenhum administrador encontrado</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop: Tabela */}
      <div data-admin-list-table>
        <Card padding="lg">
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--text-sm)',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--color-border-default)',
                  }}
                >
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 'var(--space-3)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Nome
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 'var(--space-3)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: 'var(--space-3)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Criado em
                  </th>
                  <th
                    style={{
                      textAlign: 'center',
                      padding: 'var(--space-3)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: 'var(--space-3)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, index) => (
                  <motion.tr
                    key={admin.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      borderBottom: '1px solid var(--color-border-default)',
                      transition: 'background-color 0.2s ease-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {admin.nome}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {admin.email}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {formatDate(admin.criadoEm || '')}
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        textAlign: 'center',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          backgroundColor: admin.ativo ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: admin.ativo ? '#15803d' : '#991b1b',
                        }}
                      >
                        {admin.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 'var(--space-3)',
                        textAlign: 'right',
                        display: 'flex',
                        gap: 'var(--space-2)',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEditClick?.(admin)}
                        disabled={actionLoading === admin.id}
                      >
                        Editar
                      </Button>
                      {admin.ativo ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDesativar(admin.id!, admin.nome)}
                          loading={actionLoading === admin.id}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAtivar(admin.id!, admin.nome)}
                          loading={actionLoading === admin.id}
                        >
                          Ativar
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile: Cards */}
      <div data-admin-list-cards>
        {admins.map((admin, index) => (
          <motion.div
            key={admin.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              padding="lg"
              style={{
                borderLeft: `4px solid ${admin.ativo ? 'var(--color-brand-primary)' : 'var(--color-feedback-danger)'}`,
              }}
            >
              {/* Header do Card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 'var(--space-3)',
                  paddingBottom: 'var(--space-3)',
                  borderBottom: '1px solid var(--color-border-default)',
                  gap: 'var(--space-2)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      marginBottom: 'var(--space-1)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Nome
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-primary)',
                      fontWeight: 600,
                      wordBreak: 'break-word',
                    }}
                  >
                    {admin.nome}
                  </p>
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    backgroundColor: admin.ativo ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: admin.ativo ? '#15803d' : '#991b1b',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {admin.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Body do Card */}
              <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                {/* Email */}
                <div>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      marginBottom: 'var(--space-1)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Email
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-primary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {admin.email}
                  </p>
                </div>

                {/* Data de Criação */}
                <div>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      marginBottom: 'var(--space-1)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Criado em
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {formatDate(admin.criadoEm || '')}
                  </p>
                </div>
              </div>

              {/* Footer do Card - Ações */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexDirection: 'column' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEditClick?.(admin)}
                  disabled={actionLoading === admin.id}
                  fullWidth
                >
                  ✏️ Editar
                </Button>
                {admin.ativo ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDesativar(admin.id!, admin.nome)}
                    loading={actionLoading === admin.id}
                    fullWidth
                  >
                    Desativar
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAtivar(admin.id!, admin.nome)}
                    loading={actionLoading === admin.id}
                    fullWidth
                  >
                    Ativar
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <style>{`
        /* Desktop: Mostrar tabela */
        @media (min-width: 1025px) {
          [data-admin-list-table] {
            display: block;
          }

          [data-admin-list-cards] {
            display: none;
          }
        }

        /* Mobile: Mostrar cards */
        @media (max-width: 1024px) {
          [data-admin-list-table] {
            display: none;
          }

          [data-admin-list-cards] {
            display: grid;
            gridTemplateColumns: 1fr;
            gap: var(--space-4);
          }
        }

        @media (max-width: 640px) {
          [data-admin-list-cards] {
            gap: var(--space-3);
          }
        }
      `}</style>
    </>
  );
}
