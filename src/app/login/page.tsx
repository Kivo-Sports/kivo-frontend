"use client";

/**
 * @file page.tsx (login)
 * @description Tela de login centralizada e refinada.
 *
 * Funcionalidades:
 * - Input unico que detecta automaticamente email ou CPF
 * - Validacoes inteligentes em tempo real
 * - Layout centralizado responsivo
 * - Sem abas, sem selecao de tipo
 * - Integrado com Redux para persistencia
 *
 * @author Kivo Sports - TCC
 */

// - React
import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// - Redux
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";

// - Toast
import { useToast } from "@/components/atoms/Toast";

// - Components
import { Input } from "@/components/atoms/Input";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { FadeIn } from "@/components/atoms/FadeIn";
import { InactiveAccountModal } from "@/components/molecules/InactiveAccountModal/InactiveAccountModal";

// - Utils
import {
  detectIdentifierType,
  formatCPFInput,
  isEmailValid,
  isCPFValid,
  isPasswordValid,
} from "@/lib/auth.utils";

// - Services
import { loginUser } from "@/services/auth.service";

interface LoginFormErrors {
  identifier?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  // Toast hook - chamado no topo do componente
  const { success: toastSuccess, error: toastError } = useToast();

  // Estado do formulario
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [showInactiveModal, setShowInactiveModal] = useState<boolean>(false);

  // Detectar tipo de identificador em tempo real
  const identifierType = useMemo(
    () => detectIdentifierType(identifier),
    [identifier]
  );

  // Handle input de identificador com formatacao automatica
  const handleIdentifierChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const hasAtSymbol = value.includes("@");

    // Se tiver exatamente 11 digitos (CPF), formata
    if (cleaned.length === 11 && !hasAtSymbol) {
      setIdentifier(formatCPFInput(value));
    } else {
      // Caso contrario, deixa como esta (sem formatacao)
      setIdentifier(value);
    }

    // Limpar erro do identificador enquanto digita
    if (errors.identifier) {
      setErrors((prev) => ({ ...prev, identifier: undefined }));
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    if (!identifier.trim()) {
      newErrors.identifier = "Email ou CPF é obrigatório";
    } else if (identifierType === "email" && !isEmailValid(identifier)) {
      newErrors.identifier = "Email inválido. Use: usuario@dominio.com";
    } else if (identifierType === "cpf" && !isCPFValid(identifier)) {
      newErrors.identifier = "CPF deve ter 11 dígitos";
    } else if (identifierType === "invalid" && identifier.trim().length > 0) {
      // So valida como inválido se digitar algo não reconhecível
      newErrors.identifier = "Digite um email válido (usuario@dominio.com) ou 11 dígitos do CPF";
    }

    if (!password.trim()) {
      newErrors.password = "Senha é obrigatória";
    } else if (!isPasswordValid(password)) {
      newErrors.password = "Senha deve ter no mínimo 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login real com Backend
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Chamar API de login
      const result = await loginUser(identifier, password);

      if (result.success && result.token && result.user) {
        // Salvar credenciais no Redux
        dispatch(setCredentials({ token: result.token, user: result.user }));

        // Mostrar notificação de bem-vindo
        toastSuccess(`Bem-vindo, ${result.user.name}!`);

        // Redirecionar para dashboard imediatamente
        router.push("/dashboard");
      } else {
        // Se for conta desativada, mostrar modal
        if (result.errorType === 'user-inactive') {
          setShowInactiveModal(true);
        } else {
          // Erro de autenticação - mostrar toast
          toastError(
            result.error || "Tente novamente",
            result.errorTitle || "Erro na autenticação",
            10000
          );
        }
      }
    } catch (err) {
      // Erro inesperado
      const errorMsg =
        err instanceof Error ? err.message : "Erro de conexão";
      toastError(
        "Verifique sua conexão e tente novamente",
        errorMsg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
        background:
          "radial-gradient(circle at 8% 12%, rgba(0, 230, 118, 0.18), transparent 35%), radial-gradient(circle at 100% 0%, rgba(255, 214, 0, 0.1), transparent 32%), linear-gradient(145deg, var(--color-bg-base), color-mix(in srgb, var(--color-bg-base), #000 10%))",
      }}
    >
      {/* Logo acima do card */}
      <FadeIn delay={0} direction="down">
        <div style={{ marginBottom: "var(--space-6)", textAlign: "center" }}>
          <Image
            src="/LogoKivoSportsSFundoBranca.png"
            alt="Kivo Sports"
            width={200}
            height={68}
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.1} direction="up">
        <Card
          padding="lg"
          className="w-full"
          style={{
            maxWidth: 420,
            border: "1px solid rgba(0, 230, 118, 0.2)",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "var(--space-6)", textAlign: "center" }}>
            <h1
              style={{
                fontSize: "var(--text-xl)",
                marginBottom: "var(--space-1)",
                color: "var(--color-text-primary)",
              }}
            >
              Bem-vindo de volta
            </h1>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              Faça login para acessar sua conta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--space-4)" }}>
            {/* Identificador (Email ou CPF) */}
            <Input
              label="Email ou CPF:"
              placeholder=""
              type="text"
              value={identifier}
              onChange={(e) => handleIdentifierChange(e.target.value)}
              error={errors.identifier}
              
              autoComplete="username"
            />

            {/* Hint dinamico */}
            {identifier.length > 0 && identifierType !== "invalid" && (
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color:
                    identifierType === "email"
                      ? "var(--color-brand-secondary)"
                      : "var(--color-brand-primary)",
                  marginTop: "-var(--space-3)",
                  marginBottom: "var(--space-1)",
                  fontWeight: "500",
                }}
              >
                Detectado como{" "}
                {identifierType === "email" ? "Email" : "CPF"}
              </p>
            )}

            {/* Senha */}
            <Input
              label="Senha:"
              placeholder=""
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              
              autoComplete="current-password"
            />

            {/* Link Recuperar Senha */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link
                href="/recuperar-senha"
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-brand-secondary)",
                  textDecoration: "none",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-brand-primary)";
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-brand-secondary)";
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Botao Login */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              Fazer Login
            </Button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                margin: "var(--space-2) 0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--color-border-default)",
                }}
              />
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  fontWeight: "600",
                  letterSpacing: 1,
                }}
              >
                ou
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--color-border-default)",
                }}
              />
            </div>

            {/* Link Cadastro */}
            <Link
              href="/cadastro"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "var(--space-3)",
                border: "1px solid var(--color-border-default)",
                borderRadius: "var(--radius-md)",
                background: "transparent",
                color: "var(--color-text-primary)",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "var(--text-sm)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-bg-elevated)";
                e.currentTarget.style.borderColor = "var(--color-brand-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--color-border-default)";
              }}
            >
              Criar uma nova conta
            </Link>
          </form>

          {/* Footer */}
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              textAlign: "center",
              marginTop: "var(--space-5)",
              lineHeight: 1.6,
            }}
          >
            Ao fazer login, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </Card>
      </FadeIn>

      {/* Modal Conta Desativada */}
      <InactiveAccountModal
        isOpen={showInactiveModal}
        email={identifier}
        onClose={() => setShowInactiveModal(false)}
      />
    </main>
  );
}

