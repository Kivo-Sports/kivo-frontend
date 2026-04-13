/**
 * @file home/torcedor/page.tsx
 * @description Tela home genérica para Torcedor
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

export default function TorcedorHome() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const quickLinks = [
    {
      id: 'campeonatos',
      titulo: 'Campeonatos',
      descricao: 'Acompanhe os campeonatos em andamento',
      icon: '🏆',
      path: '/campeonatos',
    },
    {
      id: 'times',
      titulo: 'Times',
      descricao: 'Conheça os times participantes',
      icon: '⚽',
      path: '/times',
    },
    {
      id: 'placar',
      titulo: 'Placares',
      descricao: 'Resultados e estatísticas dos jogos',
      icon: '📊',
      path: '/placares',
    },
    {
      id: 'comunidade',
      titulo: 'Comunidade',
      descricao: 'Interaja com outros torcedores',
      icon: '👥',
      path: '/comunidade',
    },
  ];

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
              ⚽ Bem-vindo, {user?.name?.split(' ')[0]}!
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                margin: 0,
              }}
            >
              Acompanhe os melhores times e campeonatos do momento
            </p>
          </div>
        </motion.div>

        {/* Featured Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ marginBottom: 'var(--space-6)' }}
        >
          <Card padding="lg" style={{ background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.1) 0%, rgba(0, 230, 118, 0.05) 100%)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 'var(--space-4)',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <Badge variant="success">Destaque</Badge>
                </div>
                <h2
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Campeonato Estadual 2025
                </h2>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                    margin: 0,
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  Inscrições abertas para as melhores equipes do estado. Prepare-se para grandes emoções!
                </p>
                <Button onClick={() => router.push('/campeonatos')}>
                  Conhecer Campeonato
                </Button>
              </div>
              <div
                style={{
                  fontSize: '4rem',
                  textAlign: 'center',
                }}
              >
                🏆
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Links */}
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
            Acesso Rápido
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {quickLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
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
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>
                      {link.icon}
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
                        margin: 0,
                        flex: 1,
                        marginBottom: 'var(--space-3)',
                      }}
                    >
                      {link.descricao}
                    </p>
                    <Button size="sm" variant="secondary">
                      Acessar
                    </Button>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
