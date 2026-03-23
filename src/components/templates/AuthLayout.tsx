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
  sideTitle?: string;
  sideDescription?: string;
  sideHighlights?: string[];
  children: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  sideTitle = "Kivo Sports",
  sideDescription = "Acompanhe campeonatos, resultados em tempo real e toda a jornada do esporte amador em uma plataforma moderna.",
  sideHighlights = ["Gestao de campeonatos", "Ingressos digitais", "Experiencia mobile-first"],
  children,
}: AuthLayoutProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "clamp(1rem, 2.5vw, 2rem)",
        background:
          "radial-gradient(circle at 8% 12%, rgba(0, 230, 118, 0.2), transparent 35%), radial-gradient(circle at 100% 0%, rgba(255, 214, 0, 0.14), transparent 32%), linear-gradient(145deg, var(--color-bg-base), color-mix(in srgb, var(--color-bg-base), #000 10%))",
      }}
    >
      <section
        className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-(--color-border-strong) shadow-(--shadow-lg) lg:grid-cols-[1.05fr_1fr]"
        style={{ backgroundColor: "var(--color-bg-surface)" }}
      >
        <aside
          className="flex flex-col justify-between gap-8 border-b border-(--color-border-default) p-6 md:p-8 lg:border-b-0 lg:border-r"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in srgb, var(--color-bg-elevated), black 8%), color-mix(in srgb, var(--color-bg-surface), black 14%))",
          }}
        >
          <div>
            <p
              className="text-muted"
              style={{
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: 2,
                fontSize: "var(--text-xs)",
                marginBottom: "var(--space-3)",
              }}
            >
              Plataforma Oficial
            </p>

            <h2
              style={{
                fontSize: "clamp(2rem, 5vw, 3.6rem)",
                lineHeight: 1,
                marginBottom: "var(--space-4)",
              }}
            >
              {sideTitle}
            </h2>

            <p className="text-secondary" style={{ maxWidth: 500 }}>
              {sideDescription}
            </p>
          </div>

          <div style={{ display: "grid", gap: "var(--space-2)" }}>
            {sideHighlights.map((highlight) => (
              <p
                key={highlight}
                className="text-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  width: "fit-content",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--color-border-default)",
                  backgroundColor: "var(--color-feedback-success-bg)",
                  padding: "0.35rem 0.85rem",
                  fontSize: "var(--text-sm)",
                }}
              >
                {highlight}
              </p>
            ))}
          </div>
        </aside>

        <div className="p-6 md:p-8 lg:p-10" style={{ backgroundColor: "var(--color-bg-surface)" }}>
          <header style={{ marginBottom: "var(--space-6)" }}>
            <h1 style={{ marginBottom: "var(--space-2)" }}>{title}</h1>
            <p className="text-secondary">{subtitle}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
