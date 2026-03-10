/**
 * @file layout.tsx
 * @description Layout raiz da aplicacao.
 *
 * Aqui eu concentrei os providers globais (Redux + transicao de rota)
 * para manter as paginas o mais limpas possivel.
 *
 * @author Kivo Sports - TCC
 */

// - Next.js
import type { Metadata } from "next";
import "./globals.css";

// - Providers
import { StoreProvider } from "@/store/StoreProvider";

// - Componentes
import { PageTransition } from "@/components/atoms/PageTransition";

export const metadata: Metadata = {
  title: "Kivo Frontend",
  description: "Base Next.js 16 com Redux Toolkit, RTK Query e Atomic Design.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <StoreProvider>
          <PageTransition>{children}</PageTransition>
        </StoreProvider>
      </body>
    </html>
  );
}
