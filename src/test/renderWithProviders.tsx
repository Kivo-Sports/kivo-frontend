/**
 * @file renderWithProviders.tsx
 * @description Helper de render para testes de componente/pagina.
 *
 * Monta uma store REAL (mesmos reducers de `src/store/index.ts`, incluindo o
 * middleware do RTK Query) com estado de auth pre-carregado. Nada de mock de
 * internals do RTK Query: as requisicoes saem de verdade e sao interceptadas
 * pelo MSW.
 *
 * Suporta os 3 estados de sessao (unauthenticated / hydrating / authenticated)
 * e os 4 cargos do dominio.
 */

import { configureStore } from "@reduxjs/toolkit";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { StrictMode, type ReactElement, type ReactNode } from "react";
import { Provider } from "react-redux";

import { ToastProvider } from "@/components/atoms/Toast";
import { baseApi } from "@/store/api/baseApi";
import authReducer, { type AuthState, type AuthenticatedUser } from "@/store/slices/authSlice";
import registrationReducer from "@/store/slices/registrationSlice";

// ─── Cargos ──────────────────────────────────────────────────────────────────

/** Strings de cargo exatamente como o backend as devolve. */
export const CARGOS = {
  torcedor: "Torcedor",
  organizadorTime: "OrganizadorTime",
  organizadorCampeonato: "OrganizadorCampeonato",
  administrador: "Administrador",
} as const;

export type CargoKey = keyof typeof CARGOS;

export const TEST_TOKEN = "test-token";

export function makeUser(cargo: string, overrides: Partial<AuthenticatedUser> = {}) {
  return {
    id: "99999999-9999-9999-9999-999999999999",
    name: `QA ${cargo}`,
    email: `qa.${cargo.toLowerCase()}@kivo.local`,
    cargo,
    ...overrides,
  } satisfies AuthenticatedUser;
}

// ─── Estados de auth ─────────────────────────────────────────────────────────

/** Sessao carregada do localStorage e autenticada com o cargo pedido. */
export function authenticatedAs(cargo: CargoKey | string): AuthState {
  const cargoString = cargo in CARGOS ? CARGOS[cargo as CargoKey] : String(cargo);
  return {
    token: TEST_TOKEN,
    user: makeUser(cargoString),
    isAuthenticated: true,
    isHydrated: true,
  };
}

/** Sessao ja resolvida como "nao logado". */
export const unauthenticated: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isHydrated: true,
};

/**
 * Primeiro(s) render(s) apos F5: localStorage ainda nao foi lido, portanto
 * `user` e `undefined`-ish e `isHydrated` e false. Guardas NAO podem decidir
 * nada neste estado (BUG-003).
 */
export const hydrating: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export function makeTestStore(auth: AuthState = unauthenticated) {
  return configureStore({
    reducer: {
      auth: authReducer,
      registration: registrationReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: { auth },
  });
}

export type TestStore = ReturnType<typeof makeTestStore>;

// ─── Render ──────────────────────────────────────────────────────────────────

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /** Estado inicial do slice de auth. */
  auth?: AuthState;
  /** Reaproveita uma store existente (util para re-render com estado mudado). */
  store?: TestStore;
  /**
   * Renderiza dentro de <StrictMode>. Em dev o React invoca as funcoes
   * updater de setState DUAS vezes, o que expoe updater impuro (side effect
   * dentro do updater) como efeito duplicado observavel.
   */
  strict?: boolean;
}

export interface RenderWithProvidersResult extends RenderResult {
  store: TestStore;
}

export function renderWithProviders(
  ui: ReactElement,
  { auth = unauthenticated, store, strict = false, ...options }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const testStore = store ?? makeTestStore(auth);

  const Wrapper = ({ children }: { children: ReactNode }) => {
    const tree = (
      <Provider store={testStore}>
        <ToastProvider>{children}</ToastProvider>
      </Provider>
    );

    return strict ? <StrictMode>{tree}</StrictMode> : tree;
  };

  const result = render(ui, { wrapper: Wrapper, ...options });

  return { ...result, store: testStore, rerender: result.rerender };
}
