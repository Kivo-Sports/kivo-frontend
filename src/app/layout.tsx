/**
 * @file layout.tsx
 * @description Layout raiz da aplicacao.
 */

// - Next.js
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Barlow_Condensed, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

// - Providers
import { StoreProvider } from "@/store/StoreProvider";
import { ToastProvider } from "@/components/atoms/Toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TextScaleProvider } from "@/components/providers/TextScaleProvider";

// - Componentes
import { PageTransition } from "@/components/atoms/PageTransition";
import { RootLayoutClient } from "./layout.client";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Kivo Sports",
  description: "Plataforma de gestão de campeonatos esportivos amadores e semi-profissionais.",
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
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <body className="antialiased">
        <Script id="initial-theme" strategy="beforeInteractive">{`
        try {
          const user = JSON.parse(localStorage.getItem("auth_user") || "null");
          const key = user?.id ? "kivo:theme:v1:user:" + user.id : "kivo:theme:v1:guest";
          const theme = localStorage.getItem(key);
          if (theme === "light" || theme === "dark") document.documentElement.setAttribute("data-theme", theme);
        } catch {}
        `}</Script>
        <StoreProvider>
          <ThemeProvider>
            <TextScaleProvider>
              <ToastProvider>
                <PageTransition>{children}</PageTransition>
                <RootLayoutClient />
              </ToastProvider>
            </TextScaleProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
