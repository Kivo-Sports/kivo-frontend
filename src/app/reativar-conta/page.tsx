'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/molecules/Card';
import { VerificationCodeInput } from '@/components/molecules/VerificationCodeInput';
import { FadeIn } from '@/components/atoms/FadeIn';
import { useToast } from '@/components/atoms/Toast';
import { Icon } from '@/components/atoms/Icon';
import { Unlock, Clock, RefreshCcw, Hourglass } from 'lucide-react';

type Step = 'email' | 'code' | 'success';

function ReativarContaFallback() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spinner size="lg" ariaLabel="Carregando página de reativação" />
    </main>
  );
}

function ReativarContaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();

  const emailParam = searchParams.get('email') || '';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);

  // Timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ======== HANDLERS ========
  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

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

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toastSuccess('Código enviado!', undefined, 2000);
        setStep('code');
        setTimeLeft(300);
      } else {
        toastError(data.message || 'Erro ao enviar código', 'Erro', 5000);
        setErrors({ email: data.message });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro de conexão';
      toastError(errorMsg, 'Erro', 5000);
      setErrors({ email: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!code.trim() || code.length !== 6) {
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
        body: JSON.stringify({ email: email.trim(), codigo: code.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toastSuccess('Conta reativada!', undefined, 2000);
        setStep('success');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        const errorMsg = data.message || 'Código inválido ou expirado';
        toastError(errorMsg, 'Erro', 5000);
        setErrors({ code: errorMsg });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro de conexão';
      toastError(errorMsg, 'Erro', 5000);
      setErrors({ code: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const canResend = timeLeft === 0;

  const handleResendCode = async () => {
    const emailTrim = email.trim();
    if (!emailTrim) {
      setErrors({ general: 'Email inválido para reenviar código' });
      return;
    }

    setLoading(true);
    setErrors({});

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

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toastSuccess('Novo código enviado!', undefined, 2000);
        setCode('');
        setTimeLeft(300);
      } else {
        const errorMsg = data.message || 'Erro ao reenviar código';
        toastError(errorMsg, 'Erro', 5000);
        setErrors({ general: errorMsg });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro de conexão';
      toastError(errorMsg, 'Erro', 5000);
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
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
            maxWidth: '100%',
            width: '450px',
            padding: 'var(--space-6)',
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
                marginBottom: 'var(--space-1)',
                color: 'var(--color-text-primary)',
                fontWeight: 700,
              }}
            >
              {step === 'email' && 'Reativar Conta'}
              {step === 'code' && 'Verificar Código'}
              {step === 'success' && 'Sucesso!'}
            </h1>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                marginBottom: 0,
              }}
            >
              {step === 'email' && 'Informe seu email para receber um código'}
              {step === 'code' && 'Insira o código enviado para seu email'}
              {step === 'success' && 'Sua conta foi reativada com sucesso'}
            </p>
          </div>

          {/* ======== PASSO 1: EMAIL ======== */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} style={{ display: 'grid', gap: 'var(--space-5)' }}>
              <div
                style={{
                  padding: 'var(--space-4)',
                  background: 'rgba(0, 230, 118, 0.05)',
                  border: '2px solid rgba(0, 230, 118, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  Etapa 1 de 2
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  Digite seu email abaixo e você receberá um código de segurança
                </p>
              </div>

              <Input
                label="Seu Email:"
                placeholder="usuario@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={loading}
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                ✉️ Enviar Código
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => router.push('/login')}
                disabled={loading}
              >
                ← Voltar ao Login
              </Button>
            </form>
          )}

          {/* ======== PASSO 2: CÓDIGO ======== */}
          {step === 'code' && (
            <form onSubmit={handleConfirmCode} style={{ display: 'grid', gap: 'var(--space-5)' }}>
              {/* Progress e Info */}
              <div
                style={{
                  padding: 'var(--space-4)',
                  background: 'rgba(0, 230, 118, 0.05)',
                  border: '2px solid rgba(0, 230, 118, 0.2)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Etapa 2 de 2
                  </p>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--color-brand-primary)',
                      padding: '2px 8px',
                      background: 'rgba(0, 230, 118, 0.2)',
                      borderRadius: '4px',
                    }}
                  >
                    ⏱️ {formatTime(timeLeft)}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    margin: 0,
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Código enviado para:
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-brand-primary)',
                    margin: 0,
                  }}
                >
                  {email}
                </p>
              </div>

              {/* Input Código */}
              <div>
                <VerificationCodeInput
                  label="Digite o Código:"
                  code={code}
                  onChange={(value) => setCode(value)}
                  disabled={loading || timeLeft === 0}
                  error={errors.code}
                  digitCount={6}
                />
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                    margin: 'var(--space-2) 0 0 0',
                  }}
                >
                  Ou cole o código completo em qualquer campo
                </p>
              </div>

              {/* Status */}
              <div
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor:
                    timeLeft === 0
                      ? 'var(--color-feedback-danger-bg)'
                      : timeLeft < 60
                        ? 'rgba(255, 214, 0, 0.08)'
                        : 'rgba(0, 230, 118, 0.08)',
                  border:
                    timeLeft === 0
                      ? '1px solid var(--color-feedback-danger)'
                      : timeLeft < 60
                        ? '1px solid rgba(255, 214, 0, 0.3)'
                        : '1px solid rgba(0, 230, 118, 0.2)',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-xs)',
                    color:
                      timeLeft < 60
                        ? 'var(--color-feedback-danger)'
                        : 'var(--color-text-muted)',
                    margin: 0,
                    fontWeight: 600,
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
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {errors.general}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading || timeLeft === 0}
              >
                ✓ Validar Código
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setErrors({});
                  setTimeLeft(0);
                }}
                disabled={loading}
              >
                ← Voltar
              </Button>
            </form>
          )}

          {/* ======== PASSO 3: SUCESSO ======== */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Redirecionando para login...
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-brand-primary)',
                    animation: 'bounce 1.4s infinite',
                    animationDelay: '0s',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-brand-primary)',
                    animation: 'bounce 1.4s infinite',
                    animationDelay: '0.2s',
                  }}
                />
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-brand-primary)',
                    animation: 'bounce 1.4s infinite',
                    animationDelay: '0.4s',
                  }}
                />
              </div>

              <style>{`
                @keyframes bounce {
                  0%, 100% {
                    transform: translateY(0);
                    opacity: 1;
                  }
                  50% {
                    transform: translateY(-8px);
                    opacity: 0.7;
                  }
                }
              `}</style>
            </div>
          )}
        </Card>
      </FadeIn>
    </main>
  );
}

export default function ReativarContaPage() {
  return (
    <Suspense fallback={<ReativarContaFallback />}>
      <ReativarContaContent />
    </Suspense>
  );
}
