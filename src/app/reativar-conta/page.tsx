/**
 * @file page.tsx (reativar-conta)
 * @description Página para reativar conta desativada com código de confirmação
 *
 * Funcionalidades:
 * - Solicitação de código de confirmação por email
 * - Validação de código enviado
 * - Reativação de conta após confirmação
 *
 * @author Kivo Sports - TCC
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/molecules/Card';
import { VerificationCodeInput } from '@/components/molecules/VerificationCodeInput';
import { FadeIn } from '@/components/atoms/FadeIn';
import { useToast } from '@/components/atoms/Toast';
import { Icon } from '@/components/atoms/Icon';
import { Unlock, Clock, RefreshCcw, Hourglass } from 'lucide-react';

type Step = 'email' | 'code';

export default function ReativarContaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();

  const emailParam = searchParams.get('email') || '';

  // Estado
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [codeSent, setCodeSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Timer para reenviar código
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailTrim = email.trim();
    if (!emailTrim) {
      setErrors({ email: 'Email é obrigatório' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      setErrors({ email: 'Email inválido' });
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL não configurada');
      }

      const response = await fetch(`${apiUrl}/api/auth/enviar-codigo-reativacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailTrim }),
      });

      if (response.ok) {
        toastSuccess(
          `Código enviado para ${emailTrim}`,
          undefined,
          3000
        );
        setCodeSent(true);
        setStep('code');
        setTimeLeft(300); // 5 minutos para inseri código
      } else {
        const data = await response.json().catch(() => ({}));
        const errorMsg = data.message || 'Erro ao enviar código';
        toastError(errorMsg, 'Erro', 5000);
        setErrors({ email: errorMsg });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro de conexão';
      toastError(errorMsg, 'Erro ao conectar', 5000);
      setErrors({ email: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!code.trim()) {
      setErrors({ code: 'Código de confirmação é obrigatório' });
      return;
    }

    if (code.length !== 6) {
      setErrors({ code: 'Código deve ter 6 dígitos' });
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL não configurada');
      }

      const response = await fetch(`${apiUrl}/api/auth/confirmar-reativacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          codigo: code.trim(),
        }),
      });

      if (response.ok) {
        toastSuccess(
          'Sua conta foi reativada com sucesso!',
          undefined,
          3000
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));
        router.push('/login');
      } else {
        const data = await response.json().catch(() => ({}));
        const errorMsg = data.message || 'Código inválido ou expirado';
        toastError(errorMsg, 'Erro na reativação', 5000);
        setErrors({ code: errorMsg });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro de conexão';
      toastError(errorMsg, 'Erro ao conectar', 5000);
      setErrors({ code: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setCodeSent(false);
    setErrors({});
  };

  const handleResendCode = async () => {
    // Reenviar código é basicamente chamar handleSendCode novamente
    setErrors({});
    setCanResend(false);
    setCode(''); // Limpar código anterior

    const emailTrim = email.trim();
    if (!emailTrim) {
      setErrors({ email: 'Email é obrigatório' });
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL não configurada');
      }

      const response = await fetch(`${apiUrl}/api/auth/enviar-codigo-reativacao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailTrim }),
      });

      if (response.ok) {
        toastSuccess(
          `Novo código enviado para ${emailTrim}`,
          undefined,
          3000
        );
        setCodeSent(true);
        setTimeLeft(300); // 5 minutos novamente
      } else {
        const data = await response.json().catch(() => ({}));
        const errorMsg = data.message || 'Erro ao reenviar código';
        toastError(errorMsg, 'Erro', 5000);
        setErrors({ email: errorMsg });
        setCanResend(true); // Permite tentar novamente
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro de conexão';
      toastError(errorMsg, 'Erro ao conectar', 5000);
      setErrors({ email: errorMsg });
      setCanResend(true); // Permite tentar novamente
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        background:
          'radial-gradient(circle at 8% 12%, rgba(0, 230, 118, 0.15), transparent 35%), radial-gradient(circle at 100% 0%, rgba(255, 214, 0, 0.1), transparent 32%), linear-gradient(145deg, var(--color-bg-base), color-mix(in srgb, var(--color-bg-base), #000 10%))',
      }}
    >
      <FadeIn delay={0} direction="up">
        <Card
          padding="lg"
          className="w-full"
          style={{
            maxWidth: 420,
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
            <div
              style={{
                fontSize: '3rem',
                marginBottom: 'var(--space-3)',
                color: 'var(--color-brand-primary)',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Icon icon={Unlock} size={48} />
            </div>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                marginBottom: 'var(--space-2)',
                color: 'var(--color-text-primary)',
              }}
            >
              Reativar Conta
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              {step === 'email'
                ? 'Informe seu email para receber o código de confirmação'
                : 'Insira o código enviado para seu email'}
            </p>
          </div>

          {/* PASSO 1: Enviar Código */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <Input
                label="Email:"
                placeholder="seu.email@kivo.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={loading}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Enviar Código
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => router.push('/login')}
                disabled={loading}
              >
                Voltar ao Login
              </Button>
            </form>
          )}

          {/* PASSO 2: Confirmar Código */}
          {step === 'code' && (
            <form onSubmit={handleConfirmCode} style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {/* Email readonly */}
              <div>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Email:
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {email}
                </p>
              </div>

              {/* Campo Código com 6 Quadradinhos */}
              <VerificationCodeInput
                label="Código de Confirmação:"
                code={code}
                onChange={(value) => setCode(value)}
                disabled={loading}
                error={errors.code}
                digitCount={6}
              />

              {/* Timer */}
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: timeLeft === 0 ? 'var(--color-feedback-danger-bg)' : 'transparent',
                  border: timeLeft === 0 ? '1px solid var(--color-feedback-danger)' : 'none',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: timeLeft < 60 ? 'var(--color-feedback-danger)' : 'var(--color-text-muted)',
                    margin: 0,
                  }}
                >
                {timeLeft === 0 ? (
                  <>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Icon icon={Hourglass} size={18} />
                      <strong>Código expirado!</strong>
                    </span>
                    <br />
                    Clique em "Reenviar Código" abaixo para solicitar um novo
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Icon icon={Clock} size={16} />
                      Código válido por:
                    </span>{' '}
                    <strong>{formatTime(timeLeft)}</strong>
                  </>
                )}
                </p>
              </div>

              {/* Botão Reenviar (quando expirar) */}
              {canResend && (
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleResendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon icon={Clock} size={16} />
                      Enviando...
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon icon={RefreshCcw} size={16} />
                      Reenviar Código
                    </span>
                  )}
                </Button>
              )}

              {/* Erro geral */}
              {errors.general && (
                <div
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--color-feedback-danger-bg)',
                    border: '1px solid var(--color-feedback-danger)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-feedback-danger)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {errors.general}
                </div>
              )}

              {/* Botão Confirmar */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading || timeLeft === 0}
              >
                Confirmar Código
              </Button>

              {/* Link Voltar */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={handleBackToEmail}
                disabled={loading}
              >
                Voltar
              </Button>
            </form>
          )}
        </Card>
      </FadeIn>
    </main>
  );
}
