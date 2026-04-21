"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Spinner } from '@/components/atoms/Spinner';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [isAuthenticated, isHydrated, router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        background:
          'radial-gradient(circle at 8% 12%, rgba(0, 230, 118, 0.15), transparent 35%), radial-gradient(circle at 100% 0%, rgba(255, 214, 0, 0.1), transparent 32%), linear-gradient(145deg, var(--color-bg-base), color-mix(in srgb, var(--color-bg-base), #000 10%))',
      }}
      aria-busy="true"
    >
      <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-3)' }}>
        <Spinner size="lg" ariaLabel="Carregando aplicação" />
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
          }}
        >
          Carregando...
        </p>
      </div>
    </main>
  );
}
