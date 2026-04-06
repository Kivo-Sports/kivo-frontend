'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Se não autenticado, volta para login
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    // Se autenticado, redireciona para a home específica do tipo de usuário
    if (user?.cargo) {
      const cargo = user.cargo.toLowerCase();

      switch (cargo) {
        case 'torcedor':
          router.push('/home/torcedor');
          break;
        case 'organizadortime':
          router.push('/home/organizador-time');
          break;
        case 'organizadorcampeonato':
          router.push('/home/organizador-campeonato');
          break;
        case 'administrador':
          router.push('/home/admin');
          break;
        default:
          router.push('/login');
      }
    }
  }, [isAuthenticated, token, mounted, router, user?.cargo]);

  // Tela de carregamento enquanto redireciona
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
        color: 'var(--color-brand-primary)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '2rem',
            marginBottom: 'var(--space-3)',
            animation: 'spin 2s linear infinite',
          }}
        >
          ⌛
        </div>
        <p style={{ margin: 0 }}>Redirecionando...</p>
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
