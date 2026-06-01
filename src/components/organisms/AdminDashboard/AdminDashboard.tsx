/**
 * @file AdminDashboard.tsx
 * @description Painel inicial do Administrador — visão geral (estatísticas) + atalhos de gestão.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Icon } from '@/components/atoms/Icon';
import { Card } from '@/components/molecules/Card';
import { FadeIn } from '@/components/atoms/FadeIn';
import { useAppSelector } from '@/store/hooks';
import { useListarEsportesQuery } from '@/store/api/esporteApi';
import { useListarCampeonatosQuery, useListarTodosOsTimesQuery } from '@/store/api/campeonatoApi';
import { listarAdmins } from '@/services/admin.service';
import {
  Medal,
  Shield,
  Trophy,
  UserCog,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';

interface AdminDashboardProps {
  userName?: string;
}

export function AdminDashboard({ userName }: AdminDashboardProps) {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);

  const { data: esportes = [], isLoading: loadingEsportes } = useListarEsportesQuery();
  const { data: times = [], isLoading: loadingTimes } = useListarTodosOsTimesQuery();
  const { data: campeonatos = [], isLoading: loadingCamps } = useListarCampeonatosQuery();

  const [totalAdmins, setTotalAdmins] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    if (!token) return;
    listarAdmins(token).then((res) => {
      if (ativo && res.success && res.data) setTotalAdmins(res.data.length);
    });
    return () => {
      ativo = false;
    };
  }, [token]);

  const esportesAtivos = esportes.filter((e) => e.ativo).length;

  const stats = [
    {
      icon: Medal,
      label: 'Esportes',
      value: loadingEsportes ? null : esportes.length,
      hint: loadingEsportes ? '' : `${esportesAtivos} ativos`,
    },
    {
      icon: Shield,
      label: 'Times',
      value: loadingTimes ? null : times.length,
      hint: loadingTimes ? '' : 'cadastrados',
    },
    {
      icon: Trophy,
      label: 'Campeonatos',
      value: loadingCamps ? null : campeonatos.length,
      hint: loadingCamps ? '' : 'no total',
    },
    {
      icon: UserCog,
      label: 'Admins',
      value: totalAdmins,
      hint: totalAdmins === null ? '' : 'contas',
    },
  ];

  const actions = [
    {
      icon: Medal,
      title: 'Gerenciar Esportes',
      description: 'Cadastre e edite as modalidades (com ícone) usadas por times e campeonatos.',
      href: '/admin/esportes',
    },
    {
      icon: UserCog,
      title: 'Gerenciar Admins',
      description: 'Crie, edite e ative/desative contas de administrador.',
      href: '/configuracoes/admin',
    },
    {
      icon: Shield,
      title: 'Times',
      description: 'Veja todos os times cadastrados na plataforma.',
      href: '/organizador/times',
    },
    {
      icon: Trophy,
      title: 'Campeonatos',
      description: 'Acompanhe todos os campeonatos da plataforma.',
      href: '/organizador/campeonatos',
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Cabeçalho */}
      <FadeIn delay={0} direction="up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(0,230,118,0.1)',
              border: '1px solid rgba(0,230,118,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon icon={LayoutDashboard} size={26} color="var(--color-brand-primary)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--color-brand-primary)' }}>
              Painel do Administrador
            </p>
            <h1 style={{ margin: '2px 0 0', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>
              Olá, {userName || 'Admin'}
            </h1>
          </div>
        </div>
        <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Visão geral da plataforma Kivo Sports e atalhos de gestão.
        </p>
      </FadeIn>

      {/* Estatísticas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        {stats.map((stat, index) => (
          <FadeIn key={stat.label} delay={0.05 + index * 0.05} direction="up">
            <Card
              padding="lg"
              style={{
                background: 'linear-gradient(160deg, rgba(0,230,118,0.06), rgba(255,255,255,0.02))',
                border: '1px solid rgba(0,230,118,0.18)',
                height: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0,230,118,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon icon={stat.icon} size={20} color="var(--color-brand-primary)" />
                </div>
              </div>
              <div style={{ fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                {stat.value === null ? (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xl)' }}>—</span>
                ) : (
                  stat.value
                )}
              </div>
              <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{stat.label}</span>
                {stat.hint && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>· {stat.hint}</span>}
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* Atalhos de gestão */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <Icon icon={Shield} size={20} color="var(--color-brand-primary)" />
        <h2 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 700, color: 'white' }}>Gestão</h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {actions.map((item, index) => (
          <FadeIn key={item.title} delay={0.1 + index * 0.05} direction="up">
            <motion.div
              role="button"
              tabIndex={0}
              onClick={() => router.push(item.href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(item.href);
                }
              }}
              whileHover={{ y: -4 }}
              whileTap={{ y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ cursor: 'pointer', height: '100%', borderRadius: 'var(--radius-lg)' }}
            >
              <Card
                padding="lg"
                style={{
                  height: '100%',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(0,230,118,0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div
                    style={{
                      width: '3rem',
                      height: '3rem',
                      flexShrink: 0,
                      borderRadius: 'var(--radius-lg)',
                      background: 'rgba(0,230,118,0.1)',
                      border: '1px solid rgba(0,230,118,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon icon={item.icon} size={24} color="var(--color-brand-primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                      <h3 style={{ margin: 0, fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 600, color: 'white' }}>{item.title}</h3>
                      <Icon icon={ChevronRight} size={18} color="var(--color-brand-primary)" />
                    </div>
                    <p style={{ margin: 'var(--space-2) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
