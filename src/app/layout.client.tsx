/**
 * @file layout.client.tsx
 * @description Componentes client-side do layout raiz (ToastContainer, auth persistence, inactivity tracking)
 */

'use client';

import { ToastContainer, useToast } from '@/components/atoms/Toast';
import { useAuthPersist } from '@/hooks/useAuthPersist';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

export function RootLayoutClient() {
  const { toasts, removeToast } = useToast();

  // Restaurar autenticação persistida no localStorage
  useAuthPersist();

  // Monitorar inatividade - logout automático após 2 horas sem atividade
  useInactivityTimeout();

  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}
