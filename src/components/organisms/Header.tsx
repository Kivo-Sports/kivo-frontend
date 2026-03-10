/**
 * @file Header.tsx
 * @description Organism de cabecalho com navegacao principal.
 *
 * No momento ele esta simples porque o foco foi montar base do projeto.
 * Depois quero evoluir com menu responsivo e estado de usuario logado.
 *
 * @author Kivo Sports - TCC
 */

// - Next.js
import Link from "next/link";

export function Header() {
  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          Kivo Frontend
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <Link href="/" className="transition hover:text-slate-900">
            Inicio
          </Link>
          <Link href="/login" className="transition hover:text-slate-900">
            Login
          </Link>
          <Link href="/cadastro" className="transition hover:text-slate-900">
            Cadastro
          </Link>
        </nav>
      </div>
    </header>
  );
}

// TODO: adicionar CTA de "Criar campeonato" quando autenticacao estiver pronta
