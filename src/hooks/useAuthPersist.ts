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
import { useRouter } from 'next/navigation';
import { baseApi } from '@/store/api/baseApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCredentials, restoreAuth } from '@/store/slices/authSlice';

/**
 * Restaura autenticação persistida em localStorage
 * Deve ser chamado no root layout ou componente cliente principal
 */
export function useAuthPersist() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  useEffect(() => {
    const logout = () => {
      dispatch(clearCredentials());
      dispatch(baseApi.util.resetApiState());
      router.replace('/login?motivo=sessao');
    };
    window.addEventListener('kivo:session-invalid', logout);
    return () => window.removeEventListener('kivo:session-invalid', logout);
  }, [dispatch, router]);
  const isHydrated = useAppSelector(state => state.auth.isHydrated);

  useEffect(() => {
    if (!isHydrated) {
      dispatch(restoreAuth());
    }
  }, [dispatch, isHydrated]);
}
