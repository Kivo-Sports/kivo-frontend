/**
 * @file vitest.config.mts
 * @description Configuracao do Vitest para testes de unidade/componente (jsdom + RTL).
 *
 * Nao substitui `next build`/`tsc`: e uma camada extra de regressao para bugs
 * de guard de rota, estados de erro de API e notificacoes.
 */

import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    css: false,
    env: {
      // MSW intercepta essa base; precisa casar com o baseUrl do RTK Query.
      NEXT_PUBLIC_API_URL: "http://localhost:5211",
    },
    restoreMocks: true,
    clearMocks: true,
  },
});
