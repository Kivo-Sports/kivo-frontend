'use client';

/**
 * @file recuperar-senha/page.tsx
 * @description Página de recuperação de senha com fluxo em 4 passos
 * Segue o MESMO LAYOUT de /reativar-conta com ícone, título e descrição
 *
 * @author Kivo Sports - TCC
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Components
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/molecules/Card';
import { VerificationCodeInput } from '@/components/molecules/VerificationCodeInput';
import { FadeIn } from '@/components/atoms/FadeIn';

// Hooks
import { useToast } from '@/components/atoms/Toast';

// Services
import { enviarCodigoRecuperacaoSenha, confirmarRecuperacaoSenha } from '@/services/auth.service';

// Utils
import { isEmailValid } from '@/lib/auth.utils';

type Step = 'email' | 'code' | 'password' | 'success';

type FormErrors = {
  [key: string]: string;
};

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  // Estado
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [timeLeft, setTimeLeft] = useState(0);

  // Validação de requisitos de senha em tempo real
  const [passwordReqs, setPasswordReqs] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumbers: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  const allRequirementsMet = Object.values(passwordReqs).every((req) => req);

  // Timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Atualizar requisitos de senha
  useEffect(() => {
    setPasswordReqs({
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumbers: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
      hasMinLength: newPassword.length >= 6,
    });
  }, [newPassword]);

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

    if (!isEmailValid(emailTrim)) {
      setErrors({ email: 'Email inválido' });
      return;
    }

    setLoading(true);
    const result = await enviarCodigoRecuperacaoSenha(emailTrim);

    if (result.success) {
      toastSuccess('Código enviado!', undefined, 2000);
      setStep('code');
      setTimeLeft(300);
    } else {
      toastError(result.error || 'Erro ao enviar código', 'Erro', 5000);
      setErrors({ email: result.error || 'Erro ao enviar código' });
    }

    setLoading(false);
  };

  const handleConfirmCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!code.trim() || code.length !== 6) {
      setErrors({ code: 'Código deve ter 6 dígitos' });
      return;
    }

    // Avançar para próximo passo
    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!newPassword.trim()) {
      setErrors({ newPassword: 'Nova senha é obrigatória' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Senhas não conferem' });
      return;
    }

    if (!allRequirementsMet) {
      setErrors({ newPassword: 'Atenda todos os requisitos' });
      return;
    }

    setLoading(true);

    try {
      const result = await confirmarRecuperacaoSenha(
        email.trim(),
        code.trim(),
        newPassword
      );

      if (result.success) {
        toastSuccess('Senha atualizada!', undefined, 2000);
        setStep('success');
        setTimeout(() => router.push('/login'), 3000);
      } else {
        toastError(result.error || 'Erro ao atualizar', 'Erro', 5000);
        setErrors({ general: result.error || 'Erro ao atualizar' });
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
          {/* ======== HEADER (TODOS OS PASSOS) ======== */}
          <div style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-1)' }}>
              {step === 'email' && '🔑'}
              {step === 'code' && '📧'}
              {step === 'password' && '🔐'}
              {step === 'success' && '✅'}
            </div>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                marginBottom: 'var(--space-1)',
                color: 'var(--color-text-primary)',
                fontWeight: 700,
              }}
            >
              {step === 'email' && 'Recuperar Senha'}
              {step === 'code' && 'Verificar Código'}
              {step === 'password' && 'Nova Senha'}
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
              {step === 'password' && 'Defina uma nova senha segura'}
              {step === 'success' && 'Sua senha foi atualizada com sucesso'}
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
                  Etapa 1 de 3
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
                    Etapa 2 de 3
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
                      ❌ Código expirado!<br />
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>
                        Clique em "Voltar" para solicitar um novo
                      </span>
                    </>
                  ) : timeLeft < 60 ? (
                    <>
                      ⚠️ Apenas {formatTime(timeLeft)} para inserir o código!
                    </>
                  ) : (
                    <>
                      ✓ Código válido por {formatTime(timeLeft)}
                    </>
                  )}
                </p>
              </div>

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

          {/* ======== PASSO 3: NOVA SENHA ======== */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {/* Inputs lado a lado */}
              <div>
                <Input
                  label="Nova Senha:"
                  placeholder="••••••••"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={errors.newPassword}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Input
                  label="Confirmar Senha:"
                  placeholder="••••••••"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {/* Card de requisitos */}
              <Card
                padding="sm"
                style={{
                  background: allRequirementsMet
                    ? 'rgba(0, 230, 118, 0.08)'
                    : 'var(--color-bg-elevated)',
                  border: `1px solid ${
                    allRequirementsMet ? 'rgba(0, 230, 118, 0.3)' : 'var(--color-border-default)'
                  }`,
                }}
              >
                <p
                  style={{
                    margin: '0 0 var(--space-2) 0',
                    fontWeight: 700,
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                  }}
                >
                  🛡️ Requisitos: {Object.values(passwordReqs).filter(Boolean).length}/5
                  {allRequirementsMet && (
                    <span style={{ color: 'var(--color-brand-primary)' }}>✓</span>
                  )}
                </p>

                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  {[
                    { met: passwordReqs.hasUpperCase, label: '✓ Maiúscula (A-Z)' },
                    { met: passwordReqs.hasLowerCase, label: '✓ Minúscula (a-z)' },
                    { met: passwordReqs.hasNumbers, label: '✓ Número (0-9)' },
                    { met: passwordReqs.hasSpecialChar, label: '✓ Especial (!@#$%)' },
                    { met: passwordReqs.hasMinLength, label: `✓ Mínimo 6 (${newPassword.length}/6)` },
                  ].map((req, idx) => (
                    <p
                      key={idx}
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-xs)',
                        color: req.met ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                      }}
                    >
                      {req.met ? '✓' : '○'} {req.label}
                    </p>
                  ))}
                </div>
              </Card>

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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading || !allRequirementsMet}
              >
                Atualizar Senha
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => {
                  setStep('code');
                  setNewPassword('');
                  setConfirmPassword('');
                  setErrors({});
                }}
                disabled={loading}
              >
                Voltar
              </Button>
            </form>
          )}

          {/* ======== PASSO 4: SUCESSO ======== */}
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
