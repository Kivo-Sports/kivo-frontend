/**
 * @file layout.tsx
 * @description Layout raiz da aplicacao.
 */

// - Next.js
import type { Metadata } from "next";
import { Barlow_Condensed, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

// - Providers
import { StoreProvider } from "@/store/StoreProvider";
import { ToastProvider } from "@/components/atoms/Toast";

// - Componentes
import { PageTransition } from "@/components/atoms/PageTransition";
import { RootLayoutClient } from "./layout.client";

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
          <ToastProvider>
            <PageTransition>{children}</PageTransition>
            <RootLayoutClient />
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
