/**
 * @file useInactivityTimeout.ts
 * @description Hook para monitorar inatividade e fazer logout automático
 *
 * Verifica a cada intervalo se usuário ficou 2 horas inativo.
 * Se inativo: logout silencioso (sem toast/aviso).
 * Se ativo: reseta timer automaticamente (via events).
 *
 * @author Kivo Sports - TCC
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  isUserInactive,
  initInactivityTracking,
  updateInactivityTimestamp,
  clearInactivityTimestamp,
} from '@/lib/inactivity';
import { clearCredentials } from '@/store/slices/authSlice';

const CHECK_INTERVAL = 5 * 60 * 1000; // Verificar a cada 5 minutos

/**
 * Hook que monitora inatividade do usuário
 * - Inicia rastreamento de atividade (mousedown, keydown, scroll, etc)
 * - Verifica a cada 5 minutos se passou 2 horas inativo
 * - Se inativo: logout automático (silenciosamente)
 * - Se ativo: reseta timer a cada ação do usuário
 */
export function useInactivityTimeout() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      clearInactivityTimestamp();
      return;
    }

    // Inicializar rastreamento de atividade (mousedown, keydown, scroll, touchstart)
    const cleanupTracking = initInactivityTracking();

    // Verificar inatividade periodicamente
    const interval = setInterval(() => {
      if (isUserInactive()) {
        // Logout silencioso - sem toast/aviso
        dispatch(clearCredentials());
        clearInterval(interval);
      }
    }, CHECK_INTERVAL);

    return () => {
      cleanupTracking();
      clearInterval(interval);
    };
  }, [isAuthenticated, dispatch]);
}
