"use client";

/**
 * @file StoreProvider.tsx
 * @description Provider raiz do Redux para App Router.
 *
 * Aqui eu precisei de um client component porque o Provider depende do contexto
 * do React no browser. Deixei separado do layout pra ficar mais facil testar depois.
 *
 * @author Kivo Sports - TCC
 */

// - React Redux
import { Provider } from "react-redux";

// - Store
import { store } from "./index";

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
