/**
 * @file AppLayout.tsx
 * @description Template layout para páginas autenticadas (com Header responsivo)
 *
 * Usado em: dashboard, times, campeonatos, etc
 * Inclui: Header automático (desktop/mobile) + Content area
 *
 * @author Kivo Sports - TCC
 */

'use client';

import { ReactNode } from 'react';
import { HeaderResponsive } from '@/components/organisms/HeaderResponsive';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
      }}
    >
      {/* Header Responsivo */}
      <HeaderResponsive />

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          paddingTop: 'calc(70px + var(--space-6))',
          paddingLeft: 'clamp(var(--space-3), 4vw, var(--space-6))',
          paddingRight: 'clamp(var(--space-3), 4vw, var(--space-6))',
          paddingBottom: 'var(--space-8)',
          maxWidth: '100%',
        }}
      >
        {children}
      </main>
    </div>
  );
}
