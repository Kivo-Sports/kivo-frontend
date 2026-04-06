/**
 * @file home/admin/page.tsx
 * @description Tela home genérica para Administrador
 */

'use client';

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

// Components
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { Badge } from '@/components/atoms/Badge';
import { AppLayout } from '@/components/templates/AppLayout';

// Store
import type { RootState } from '@/store';

export default function AdminHome() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const adminLinks = [
    {
      id: 'users',
      titulo: 'Gerenciar Usuários',
      descricao: 'Visualizar e gerenciar todos os usuários do sistema',
      icon: '👥',
      path: '/admin/usuarios',
      color: 'success',
    },
    {
      id: 'campeonatos',
      titulo: 'Campeonatos',
      descricao: 'Supervisionar os campeonatos cadastrados',
      icon: '🏆',
      path: '/admin/campeonatos',
      color: 'warning',
    },
    {
      id: 'times',
      titulo: 'Times',
      descricao: 'Gerenciar times e suas informações',
      icon: '⚽',
      path: '/admin/times',
      color: 'info',
    },
    {
      id: 'admins',
      titulo: 'Gerenciar Admins',
      descricao: 'Controlar permissões de administradores',
      icon: '👨‍💼',
      path: '/configuracoes/admin',
      color: 'success',
    },
    {
      id: 'relatorios',
      titulo: 'Relatórios',
      descricao: 'Análise de dados e estatísticas',
      icon: '📊',
      path: '/admin/relatorios',
      color: 'danger',
    },
    {
      id: 'configuracoes',
      titulo: 'Configurações',
      descricao: 'Parâmetros e configurações do sistema',
      icon: '⚙️',
      path: '/admin/configuracoes',
      color: 'warning',
    },
  ];

  const badgeVariants = {
    success: 'success',
    warning: 'warning',
    info: 'info',
    danger: 'danger',
  } as const;

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
                🛡️ Painel de Administração
              </h1>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Bem-vindo ao painel administrativo do sistema
              </p>
            </div>
            <Badge variant="success">Sistema Online</Badge>
          </div>
        </motion.div>

        {/* Stats Overview */}
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
                0
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Usuários Total
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
                0
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
                0
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Times
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
                0
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Jogos Realizados
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Admin Functions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 var(--space-4) 0',
            }}
          >
            Funções Administrativas
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {adminLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              >
                <div
                  onClick={() => router.push(link.path)}
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-3)',
                      }}
                    >
                      <div style={{ fontSize: '2rem' }}>{link.icon}</div>
                      <Badge variant={badgeVariants[link.color as keyof typeof badgeVariants]}>
                        Ativo
                      </Badge>
                    </div>

                    <h3
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        margin: '0 0 var(--space-2) 0',
                      }}
                    >
                      {link.titulo}
                    </h3>

                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        margin: '0 0 var(--space-4) 0',
                        flex: 1,
                      }}
                    >
                      {link.descricao}
                    </p>

                    <Button size="sm" variant="secondary">
                      Acessar Função
                    </Button>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Alert Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          style={{ marginTop: 'var(--space-6)' }}
        >
          <Card
            padding="md"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)',
              borderLeft: '4px solid var(--color-feedback-warning)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>ℹ️</div>
              <div>
                <h4
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Sistema em Desenvolvimento
                </h4>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    margin: 0,
                  }}
                >
                  As funções administrativas estão sendo integradas. Em breve você terá acesso a todas as ferramentas de gerenciamento.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
