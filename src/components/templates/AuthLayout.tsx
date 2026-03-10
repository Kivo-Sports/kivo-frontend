/**
 * @file AuthLayout.tsx
 * @description Template base para telas de autenticacao.
 *
 * Eu quis separar esse layout para manter login e cadastro com visual consistente,
 * sem duplicar container, titulo e espacos toda hora.
 *
 * @author Kivo Sports - TCC
 */

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <section className="mx-auto mt-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}
