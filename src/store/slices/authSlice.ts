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
            // Verificar se o JWT expirou antes de restaurar
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            const isExpired = typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();

            if (isExpired) {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
            } else {
              const user: AuthenticatedUser = JSON.parse(userJson);
              // Compat: extrai cargo do JWT se o objeto salvo não tiver (sessão antiga)
              if (!user.cargo) {
                try {
                  const jwtPayload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                  const rawCargo: string = jwtPayload['Cargo'] || jwtPayload['cargo'] || '';
                  if (rawCargo) {
                    user.cargo = rawCargo;
                    localStorage.setItem('auth_user', JSON.stringify(user));
                  }
                } catch {
                  // falha silenciosa na decodificação do JWT
                }
              }
              state.token = token;
              state.user = user;
              state.isAuthenticated = true;
            }
          } catch {
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
