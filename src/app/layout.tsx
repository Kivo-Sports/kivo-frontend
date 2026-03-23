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
import { Barlow_Condensed, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

// - Providers
import { StoreProvider } from "@/store/StoreProvider";

// - Componentes
import { PageTransition } from "@/components/atoms/PageTransition";

export const metadata: Metadata = {
  title: "Kivo Frontend",
  description: "Base Next.js 16 com Redux Toolkit, RTK Query e Atomic Design.",
};

const fontDisplay = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const fontBody = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fontMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <body className="antialiased">
        <StoreProvider>
          <PageTransition>{children}</PageTransition>
        </StoreProvider>
      </body>
    </html>
  );
}
