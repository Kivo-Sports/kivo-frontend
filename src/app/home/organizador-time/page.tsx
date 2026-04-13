/**
 * @file home/organizador-time/page.tsx
 * @description Tela home para Organizador de Time
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

// Components
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Badge } from '@/components/atoms/Badge';
import { AppLayout } from '@/components/templates/AppLayout';
import { Spinner } from '@/components/atoms/Spinner';

// Store
import type { RootState } from '@/store';

// Types
interface Time {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  ativo: boolean;
  logoUrl?: string;
  jogadores: number;
  campeonatos: number;
  dataCriacao: string;
}

export default function OrganizadorTimeHome() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [times, setTimes] = useState<Time[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Integrar com serviço de times
    // Por enquanto, usar dados mockados para estruturar a UI
    setIsLoading(true);
    setTimeout(() => {
      setTimes([
        {
          id: '1',
          nome: 'FC Campeões',
          cidade: 'Curitiba',
          estado: 'PR',
          ativo: true,
          jogadores: 15,
          campeonatos: 3,
          dataCriacao: '2024-01-15',
        },
        {
          id: '2',
          nome: 'Athletico FC',
          cidade: 'Curitiba',
          estado: 'PR',
          ativo: true,
          jogadores: 22,
          campeonatos: 5,
          dataCriacao: '2023-06-20',
        },
        {
          id: '3',
          nome: 'Time em Formação',
          cidade: 'Ponta Grossa',
          estado: 'PR',
          ativo: false,
          jogadores: 8,
          campeonatos: 0,
          dataCriacao: '2025-01-01',
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

  const timesAtivos = times.filter((t) => t.ativo).length;
  const totalJogadores = times.reduce((acc, t) => acc + t.jogadores, 0);
  const totalCampeonatos = times.reduce((acc, t) => acc + t.campeonatos, 0);

  return (
    <AppLayout>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          padding: 'var(--space-6)',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: 'var(--space-6)' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-3)',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  marginBottom: 'var(--space-2)',
                }}
              >
                ⚽ Meus Times
              </h1>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Gerencie e acompanhe todos os seus times
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => router.push('/times/novo')}
              style={{
                whiteSpace: 'nowrap',
              }}
            >
              ➕ Novo Time
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <Card padding="md">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--color-brand-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {times.length}
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Times Criados
              </p>
            </div>
          </Card>

          <Card padding="md">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--color-brand-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {timesAtivos}
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Times Ativos
              </p>
            </div>
          </Card>

          <Card padding="md">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--color-brand-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {totalJogadores}
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Jogadores Total
              </p>
            </div>
          </Card>

          <Card padding="md">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--color-brand-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {totalCampeonatos}
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Campeonatos
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Times Grid */}
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-6)',
              minHeight: '300px',
            }}
          >
            <Spinner />
          </div>
        ) : times.length === 0 ? (
          <Card padding="lg" style={{ textAlign: 'center' }}>
            <div style={{ padding: 'var(--space-6)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>⚽</div>
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Nenhum time criado ainda
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Comece criando seu primeiro time para reunir jogadores e participar de campeonatos!
              </p>
              <Button onClick={() => router.push('/times/novo')}>Criar Time</Button>
            </div>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {times.map((time, index) => (
              <motion.div
                key={time.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div
                  onClick={() => router.push(`/times/${time.id}`)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      '0 12px 24px rgba(0, 230, 118, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  }}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Card
                    padding="md"
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                  {/* Header */}
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                          margin: 0,
                          flex: 1,
                        }}
                      >
                        {time.nome}
                      </h3>
                    </div>
                    <Badge variant={time.ativo ? 'success' : 'info'}>
                      {time.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  {/* Location */}
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      margin: '0 0 var(--space-3) 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                    }}
                  >
                    📍 {time.cidade}, {time.estado}
                  </p>

                  {/* Stats */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-3)',
                      background: 'rgba(0, 230, 118, 0.05)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        Jogadores
                      </div>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: 'var(--color-brand-primary)',
                        }}
                      >
                        {time.jogadores}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        Campeonatos
                      </div>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: 'var(--color-brand-primary)',
                        }}
                      >
                        {time.campeonatos}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        Desde
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {new Date(time.dataCriacao).toLocaleDateString('pt-BR', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-2)',
                      marginTop: 'auto',
                    }}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      style={{ flex: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/times/${time.id}/editar`);
                      }}
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      style={{ flex: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implementar exclusão
                      }}
                    >
                      🗑️ Deletar
                    </Button>
                  </div>
                </Card>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
