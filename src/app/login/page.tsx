"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { AnimatedPage } from "@/components/atoms/AnimatedPage";
import { Button } from "@/components/atoms/Button";
import { FormField } from "@/components/molecules/FormField";
import { AuthLayout } from "@/components/templates/AuthLayout";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";

const loginSchema = z.object({
  email: z.email("Informe um email valido."),
  password: z
    .string()
    .min(6, "A senha deve ter no minimo 6 caracteres.")
    .max(64, "A senha deve ter no maximo 64 caracteres."),
});

type LoginFormData = z.infer<typeof loginSchema>;
type LoginErrors = Partial<Record<keyof LoginFormData, string>>;

function formatNameFromEmail(email: string): string {
  const baseName = email.split("@")[0] ?? "usuario";
  return baseName
    .split(/[._-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function LoginPage() {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRememberMeEnabled, setIsRememberMeEnabled] = useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  function handleChange(field: keyof LoginFormData, value: string): void {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFeedbackMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFeedbackMessage("");

    const parsedResult = loginSchema.safeParse(formData);

    if (!parsedResult.success) {
      const fieldErrors = parsedResult.error.flatten().fieldErrors;

      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Simulacao local enquanto endpoint real de auth nao esta conectado.
      await new Promise((resolve) => setTimeout(resolve, 900));

      dispatch(
        setCredentials({
          token: "kivo-demo-token",
          user: {
            id: "demo-user-id",
            name: formatNameFromEmail(parsedResult.data.email),
            email: parsedResult.data.email,
          },
        }),
      );

      setFeedbackMessage(
        isRememberMeEnabled
          ? "Login realizado com sucesso. Sessao persistente ativada."
          : "Login realizado com sucesso.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatedPage>
      <AuthLayout
        title="Entrar na sua conta"
        subtitle="Acesse o painel de campeonatos, jogos e ingressos do Kivo Sports."
        sideTitle="Seu campeonato comecou aqui"
        sideDescription="Crie competicoes, organize rodadas e acompanhe o desempenho dos times com uma experiencia fluida para web e mobile."
        sideHighlights={[
          "Painel em tempo real",
          "Ingressos com confirmacao digital",
          "Gestao completa de equipes",
        ]}
      >
        <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: "var(--space-4)" }}>
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="voce@kivo.com"
            value={formData.email}
            onChange={(event) => handleChange("email", event.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <FormField
            id="password"
            label="Senha"
            type="password"
            placeholder="Digite sua senha"
            value={formData.password}
            onChange={(event) => handleChange("password", event.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor="remember-me"
              className="text-muted"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
              }}
            >
              <input
                id="remember-me"
                type="checkbox"
                checked={isRememberMeEnabled}
                onChange={(event) => setIsRememberMeEnabled(event.target.checked)}
              />
              Manter sessao ativa
            </label>

            <Link
              href="#"
              className="text-primary"
              style={{ fontSize: "var(--text-sm)", textDecoration: "underline" }}
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button type="submit" fullWidth loading={isSubmitting}>
            Entrar
          </Button>

          {feedbackMessage ? (
            <p
              role="status"
              style={{
                border: "1px solid var(--color-feedback-success)",
                backgroundColor: "var(--color-feedback-success-bg)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-feedback-success)",
                padding: "0.7rem 0.85rem",
                fontSize: "var(--text-sm)",
              }}
            >
              {feedbackMessage}
            </p>
          ) : null}
        </form>
      </AuthLayout>
    </AnimatedPage>
  );
}
