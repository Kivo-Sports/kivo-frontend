/**
 * @file home/organizador-campeonato/page.tsx
 * @description Tela home para Organizador de Campeonato
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
interface Campeonato {
  id: string;
  nome: string;
  status: string;
  dataInicio: string;
  times: number;
  inscricoes: number;
  descricao?: string;
}

const statusBadgeVariant = (status: string): 'success' | 'warning' | 'info' | 'danger' => {
  switch (status?.toLowerCase()) {
    case 'rascunho':
      return 'info';
    case 'incrioesabertas':
      return 'success';
    case 'emandamento':
      return 'warning';
    case 'finalizado':
      return 'danger';
    default:
      return 'info';
  }
};

export default function OrganizadorCampeonatoHome() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Integrar com serviço de campeonatos
    // Por enquanto, usar dados mockados para estruturar a UI
    setIsLoading(true);
    setTimeout(() => {
      setCampeonatos([
        {
          id: '1',
          nome: 'Campeonato Estadual 2025',
          status: 'IncrioesAbertas',
          dataInicio: '2025-05-15',
          times: 8,
          inscricoes: 5,
          descricao: 'Campeonato com as melhores equipes do estado',
        },
        {
          id: '2',
          nome: 'Torneio Regional',
          status: 'Rascunho',
          dataInicio: '2025-06-20',
          times: 0,
          inscricoes: 0,
          descricao: 'Torneio em planejamento',
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

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
                🏆 Meus Campeonatos
              </h1>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Gerencie e monitore todos os seus campeonatos
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => router.push('/campeonatos/novo')}
              style={{
                whiteSpace: 'nowrap',
              }}
            >
              ➕ Novo Campeonato
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
                {campeonatos.length}
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Campeonatos Criados
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
                {campeonatos.reduce((acc, c) => acc + c.times, 0)}
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Times Inscritos
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
                {campeonatos.filter((c) => c.status.toLowerCase() === 'emandamento').length}
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Em Andamento
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Campeonatos Grid */}
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
        ) : campeonatos.length === 0 ? (
          <Card padding="lg" style={{ textAlign: 'center' }}>
            <div style={{ padding: 'var(--space-6)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🏆</div>
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Nenhum campeonato criado ainda
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Comece criando seu primeiro campeonato para reunir times e competir!
              </p>
              <Button onClick={() => router.push('/campeonatos/novo')}>Criar Campeonato</Button>
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
            {campeonatos.map((campeonato, index) => (
              <motion.div
                key={campeonato.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div
                  onClick={() => router.push(`/campeonatos/${campeonato.id}`)}
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
                        {campeonato.nome}
                      </h3>
                    </div>
                    <Badge variant={statusBadgeVariant(campeonato.status)}>
                      {campeonato.status}
                    </Badge>
                  </div>

                  {/* Description */}
                  {campeonato.descricao && (
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        margin: '0 0 var(--space-3) 0',
                        flex: 1,
                      }}
                    >
                      {campeonato.descricao}
                    </p>
                  )}

                  {/* Stats */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-3)',
                      background: 'rgba(0, 230, 118, 0.05)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        Times Inscritos
                      </div>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: 'var(--color-brand-primary)',
                        }}
                      >
                        {campeonato.times}/{campeonato.inscricoes}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        Início
                      </div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {new Date(campeonato.dataInicio).toLocaleDateString('pt-BR')}
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
                        router.push(`/campeonatos/${campeonato.id}/editar`);
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
