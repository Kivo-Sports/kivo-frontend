/**
 * @file useAuthPersist.ts
 * @description Hook para restaurar autenticação do localStorage ao inicializar
 *
 * Chamado no root layout para manter a sessão do usuário após reload.
 * Só funciona no cliente (useEffect).
 *
 * @author Kivo Sports - TCC
 */

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { restoreAuth } from '@/store/slices/authSlice';

/**
 * Restaura autenticação persistida em localStorage
 * Deve ser chamado no root layout ou componente cliente principal
 */
export function useAuthPersist() {
  const dispatch = useAppDispatch();
  const isHydrated = useAppSelector(state => state.auth.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      dispatch(restoreAuth());
    }
  }, [dispatch, isHydrated]);
}
