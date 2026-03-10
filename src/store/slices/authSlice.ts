/**
 * @file authSlice.ts
 * @description Centraliza o estado de autenticacao da aplicacao.
 *
 * Optei por manter token + user no Redux porque varias partes da app
 * (layout, chamadas RTK Query e futuras guards de rota) dependem disso.
 * Pensei em usar so Context API, mas para o TCC ficou mais facil escalar
 * com slices separados por dominio.
 *
 * @author Kivo Sports - TCC
 */

// - Redux Toolkit
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  token: string | null;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
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
    },
    clearCredentials: (state) => {
      // TODO: adicionar limpeza de cache de endpoints privados apos logout
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
