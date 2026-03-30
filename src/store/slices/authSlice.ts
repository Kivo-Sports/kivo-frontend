/**
 * @file authSlice.ts
 * @description Centraliza o estado de autenticacao da aplicacao.
 *
 * Optei por manter token + user no Redux porque varias partes da app
 * (layout, chamadas RTK Query e futuras guards de rota) dependem disso.
 * Pensei em usar so Context API, mas para o TCC ficou mais facil escalar
 * com slices separados por dominio.
 *
 * Token é persistido em localStorage.
 * Logout automático após 2 horas de INATIVIDADE.
 *
 * @author Kivo Sports - TCC
 */

// - Redux Toolkit
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearInactivityTimestamp } from "@/lib/inactivity";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  cargo?: string; // Tipo de perfil: torcedor, organizador-time, organizador-campeonato, admin
}

export interface AuthState {
  token: string | null;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean; // Flag para saber se localStorage foi carregado
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string; user: AuthenticatedUser }>) => {
      // aqui eu preferi salvar token e user juntos para manter o estado coerente
      // se um existir sem o outro, as telas protegidas tendem a ficar inconsistentes
      const { token, user } = action.payload;

      state.token = token;
      state.user = user;
      state.isAuthenticated = true;

      // Persistir no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
    },
    clearCredentials: (state) => {
      // TODO: adicionar limpeza de cache de endpoints privados apos logout
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;

      // Remover do localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        clearInactivityTimestamp();
      }
    },
    // Restaurar autenticação do localStorage (chamado ao inicializar)
    restoreAuth: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        const userJson = localStorage.getItem('auth_user');

        if (token && userJson) {
          try {
            const user = JSON.parse(userJson);
            state.token = token;
            state.user = user;
            state.isAuthenticated = true;
          } catch (error) {
            // Se falhar ao parsear, limpar localStorage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      }
      state.isHydrated = true;
    },
  },
});

export const { setCredentials, clearCredentials, restoreAuth } = authSlice.actions;
export default authSlice.reducer;
