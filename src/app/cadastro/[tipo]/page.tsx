/**
 * @file page.tsx (/cadastro/[tipo])
 * @description Tela de formulário multi-step dinâmico para registro
 *
 * Funcionalidades:
 * - Accordion com múltiplos passos
 * - Validação em tempo real
 * - Auto-formatação de campos (CPF, Telefone, CEP)
 * - Indicador visual de força de senha
 * - Integração com API do backend
 * - Estados de loading e erro
 *
 * @author Kivo Sports - TCC
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateFormField,
  setStepErrors,
  markStepCompleted,
  setIsSubmitting,
  setSubmitError,
  resetRegistration,
} from '@/store/slices/registrationSlice';
import { setCredentials } from '@/store/slices/authSlice';
import { useToast } from '@/components/atoms/Toast';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Spinner } from '@/components/atoms/Spinner';
import { Card } from '@/components/molecules/Card';
import { Stepper } from '@/components/molecules/Stepper/Stepper';
import { FormSection, FormSectionGroup } from '@/components/molecules/FormSection/FormSection';
import { FadeIn } from '@/components/atoms/FadeIn';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep5,
  validateStep1Async,
  validateStep2Async,
  getStepConfig,
  getTotalSteps,
  formatCEP,
  formatTelefone,
  formatCPF,
  validateSenhaCriteria,
  lookupCEP,
  getUserTypeLabel,
  type UserType,
} from '@/lib/registration.utils';
import { registerUser, checkEmailExists, checkCPFExists } from '@/services/registration.service';
import type { PasswordRequirements } from '@/lib/registration.utils';

// Função helper para formatar título do erro
function getErrorTitle(errorType: string): string {
  const titles: Record<string, string> = {
    'email-duplicate': 'Email já cadastrado',
    'cpf-duplicate': 'CPF já cadastrado',
    'email-invalid': 'Email inválido',
    'cpf-invalid': 'CPF inválido',
    'bank-error': 'Dados bancários inválidos',
    'password-error': 'Senha fraca',
    'missing-field': 'Campos vazios',
    'user-exists': 'Usuário existe',
    'generic-error': 'Erro no cadastro',
  };

  return titles[errorType] || 'Falha no Cadastro';
}

export default function CadastroFormPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useAppDispatch();

  // Toast hook - chamado no topo do componente
  const { success: toastSuccess, error: toastError } = useToast();

  const registration = useAppSelector((state) => state.registration);
  const { userType, formData, errors, isSubmitting, submitError } = registration;

  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    minLength: false,
  });

  const [expandedStep, setExpandedStep] = useState<number>(1);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const tipoUrl = (params?.tipo as string)?.replace(/-/g, '-') as UserType | undefined;

  useEffect(() => {
    if (!tipoUrl) {
      router.push('/cadastro');
      return;
    }

    if (userType !== tipoUrl) {
      router.push('/cadastro');
    }
  }, [tipoUrl, userType, router]);

  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/login');
  }, [router]);

  if (!userType || userType !== tipoUrl) {
    return null;
  }

  const stepsConfig = getStepConfig(userType);
  const totalSteps = getTotalSteps(userType);

  const stepperSteps = stepsConfig
    .filter((s) => s.numero !== 4)
    .map((s) => ({
      numero: s.numero,
      titulo: s.titulo,
    }));

  const handleFieldChange = (field: string, value: string) => {
    let finalValue = value;

    if (field === 'telefone') {
      finalValue = formatTelefone(value);
    } else if (field === 'cpf') {
      finalValue = formatCPF(value);
    } else if (field === 'endereco.cep') {
      finalValue = formatCEP(value);

      // Se CEP está completo (8 dígitos), buscar dados
      if (finalValue.replace(/\D/g, '').length === 8) {
        handleCEPLookup(finalValue);
      }
    }

    dispatch(updateFormField({ field, value: finalValue }));

    if (field === 'senha') {
      const requirements = validateSenhaCriteria(finalValue);
      setPasswordRequirements(requirements);
    }
  };

  const handleCEPLookup = async (cep: string) => {
    setIsLoadingCEP(true);
    try {
      const result = await lookupCEP(cep);
      if (result.success && result.data) {
        dispatch(updateFormField({ field: 'endereco.rua', value: result.data.rua }));
        dispatch(updateFormField({ field: 'endereco.cidade', value: result.data.cidade }));
        dispatch(updateFormField({ field: 'endereco.estado', value: result.data.estado }));
      } else {
        dispatch(setStepErrors({ cep: result.error || 'CEP não encontrado' }));
      }
    } finally {
      setIsLoadingCEP(false);
    }
  };

  const validateAndProgress = async (stepToValidate: number, nextStep?: number) => {
    let validationResult;

    switch (stepToValidate) {
      case 1:
        validationResult = await validateStep1Async({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          dataNascimento: formData.dataNascimento,
          checkEmailExists,
        });
        break;

      case 2:
        validationResult = await validateStep2Async({
          cpf: formData.cpf,
          senha: formData.senha,
          confirmSenha: formData.confirmSenha,
          checkCPFExists,
        });
        break;

      case 3:
        validationResult = validateStep3({
          cep: formData.endereco.cep,
          rua: formData.endereco.rua,
          numero: formData.endereco.numero,
          complemento: formData.endereco.complemento,
          cidade: formData.endereco.cidade,
          estado: formData.endereco.estado,
        });
        break;

      case 5:
        if (userType === 'organizador-campeonato' && formData.contaBanco) {
          validationResult = validateStep5({
            banco: formData.contaBanco.banco,
            agencia: formData.contaBanco.agencia,
            conta: formData.contaBanco.conta,
            chavePix: formData.contaBanco.chavePix,
          });
        } else {
          validationResult = { isValid: true, errors: {} };
        }
        break;

      default:
        validationResult = { isValid: true, errors: {} };
    }

    if (validationResult.isValid) {
      dispatch(markStepCompleted(stepToValidate));
      dispatch(setStepErrors({}));

      // Se nextStep foi passado, vai para lá, senão vai para o próximo
      if (nextStep !== undefined) {
        setExpandedStep(nextStep);
      } else if (stepToValidate < totalSteps) {
        setExpandedStep(stepToValidate + 1);
      }

      return true;
    } else {
      dispatch(setStepErrors(validationResult.errors));
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Verificar se todos os passos necessários foram completados
    const stepsNeeded = userType === 'organizador-campeonato' ? [1, 2, 3, 5] : [1, 2, 3];
    const allStepsCompleted = stepsNeeded.every(step => registration.completedSteps.includes(step));

    if (!allStepsCompleted) {
      dispatch(setSubmitError('Complete todos os passos para criar a conta'));
      return;
    }

    dispatch(setIsSubmitting(true));
    dispatch(setSubmitError(null));

    try {
      const result = await registerUser(userType, formData);

      if (result.success && result.token && result.user) {
        setIsTransitioning(true);
        dispatch(setCredentials({ token: result.token, user: result.user }));

        // Mostrar notificação com toast
        const nomeUsuario = result.user.name.split(' ')[0];
        const tipoLabel = getUserTypeLabel(userType);

        toastSuccess(
          `Bem-vindo, ${nomeUsuario}!`,
          `Cadastro realizado como ${tipoLabel}`,
          5000
        );

        dispatch(resetRegistration());
        const rotaPosCadastro = userType === 'organizador-time' ? '/organizador/times/criar' : '/dashboard';
        router.replace(rotaPosCadastro);
        return;
      } else if (result.success) {
        setIsTransitioning(true);
        toastSuccess(
          'Cadastro concluído!',
          'Faça login para continuar',
          5000
        );

        dispatch(resetRegistration());
        router.replace('/login');
        return;
      } else {
        // Notificação de erro com tipo específico
        const errorType = (result as any).errorType || 'generic-error';
        const title = getErrorTitle(errorType);

        toastError(result.error || 'Erro ao criar conta', title, 5000);

        if (result.fieldErrors) {
          dispatch(setStepErrors(result.fieldErrors));
        }
      }
    } finally {
      dispatch(setIsSubmitting(false));
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        paddingTop: 'var(--space-6)',
        paddingBottom: 'var(--space-6)',
        background:
          'radial-gradient(circle at 8% 12%, rgba(0, 230, 118, 0.15), transparent 35%), radial-gradient(circle at 100% 0%, rgba(255, 214, 0, 0.1), transparent 32%), linear-gradient(145deg, var(--color-bg-base), color-mix(in srgb, var(--color-bg-base), #000 10%))',
      }}
      aria-busy={isSubmitting || isTransitioning}
    >
      {isTransitioning ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
            background: 'color-mix(in srgb, var(--color-bg-base), #000 20%)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Card
            padding="lg"
            className="w-full"
            style={{ maxWidth: 420, textAlign: 'center' }}
          >
            <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-3)' }}>
              <Spinner size="lg" ariaLabel="Entrando na conta" />
              <h2
                style={{
                  margin: 0,
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                Entrando na sua conta...
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Estamos finalizando seu cadastro e preparando o dashboard.
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      <FadeIn delay={0} direction="up">
        <Card
          padding="lg"
          className="w-full"
          style={{
            maxWidth: 'clamp(320px, calc(100% - 32px), 600px)',
            width: '100%',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 700,
                marginBottom: 'var(--space-3)',
                color: 'var(--color-text-primary)',
              }}
            >
              Criar Conta
            </h1>

            {/* Tipo de Cadastro como Subtítulo */}
            <h2
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                margin: 0,
              }}
            >
              {getUserTypeLabel(userType)}
            </h2>
          </div>

          {/* Stepper */}
          <Stepper
            steps={stepperSteps}
            currentStep={expandedStep}
            completedSteps={registration.completedSteps}
            disabled={isSubmitting || isTransitioning}
          />

          {/* Error Message */}
          {submitError && (
            <div
              style={{
                padding: 'var(--space-3)',
                background: 'var(--color-feedback-danger-bg)',
                border: '1px solid var(--color-feedback-danger)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-feedback-danger)',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <span>!</span>
              <span>{submitError}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'grid',
              gap: 0,
              pointerEvents: isTransitioning ? 'none' : 'auto',
            }}
          >
            <FormSectionGroup>
              {/* ============ PASSO 1: INFORMAÇÕES PESSOAIS ============ */}
              <FormSection
                stepNumber={1}
                title="Informações Pessoais"
                description="Seus dados básicos"
                isActive={expandedStep === 1}
                isCompleted={registration.completedSteps.includes(1)}
                isDisabled={false}
                onToggle={() => setExpandedStep(expandedStep === 1 ? 0 : 1)}
                hasError={Object.keys(errors).some((k) =>
                  ['nome', 'email', 'telefone', 'dataNascimento'].includes(k)
                )}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--space-3)',
                  }}
                  className="form-grid-inputs"
                >
                  <Input
                    label="Nome"
                    placeholder="João Silva"
                    value={formData.nome}
                    onChange={(e) => handleFieldChange('nome', e.target.value)}
                    error={errors.nome}
                  />

                  <Input
                    label="Email"
                    placeholder="seu.email@kivo.com"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    error={errors.email}
                  />

                  <Input
                    label="Telefone"
                    placeholder="(xx) xxxxx-xxxx"
                    value={formData.telefone}
                    onChange={(e) => handleFieldChange('telefone', e.target.value)}
                    error={errors.telefone}
                    autoComplete="tel"
                  />

                  <Input
                    label="Data de Nascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) =>
                      handleFieldChange('dataNascimento', e.target.value)
                    }
                    error={errors.dataNascimento}
                  />
                </div>

                {/* Botão para avançar */}
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={async () => {
                    const isValid = await validateAndProgress(1);
                    if (isValid) {
                      setExpandedStep(2);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Próximo
                </Button>
              </FormSection>

              {/* ============ PASSO 2: CREDENCIAIS ============ */}
              <FormSection
                stepNumber={2}
                title="Credenciais"
                description="CPF e Senha"
                isActive={expandedStep === 2}
                isCompleted={registration.completedSteps.includes(2)}
                isDisabled={!registration.completedSteps.includes(1)}
                onToggle={() => setExpandedStep(expandedStep === 2 ? 1 : 2)}
                hasError={Object.keys(errors).some((k) => ['cpf', 'senha', 'confirmSenha'].includes(k))}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--space-3)',
                  }}
                  className="form-grid-inputs"
                >
                  <Input
                    label="CPF"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => handleFieldChange('cpf', e.target.value)}
                    error={errors.cpf}
                    autoComplete="off"
                  />

                  <Input
                    label="Senha"
                    placeholder="Digite ao menos 6 caracteres"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => handleFieldChange('senha', e.target.value)}
                    error={errors.senha}
                    autoComplete="new-password"
                  />

                  <Input
                    label="Confirmar Senha"
                    placeholder="Repita sua senha"
                    type="password"
                    value={formData.confirmSenha}
                    onChange={(e) =>
                      dispatch(
                        updateFormField({
                          field: 'confirmSenha',
                          value: e.target.value,
                        })
                      )
                    }
                    error={errors.confirmSenha}
                    autoComplete="new-password"
                  />
                </div>

                {/* Password Requirements */}
                {formData.senha && (
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      background: 'var(--color-bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border-default)',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 var(--space-2) 0',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Requisitos da Senha
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gap: 'var(--space-2)',
                      }}
                    >
                      {[
                        { key: 'uppercase', label: 'Letra maiúscula (A-Z)' },
                        { key: 'lowercase', label: 'Letra minúscula (a-z)' },
                        { key: 'number', label: 'Número (0-9)' },
                        { key: 'specialChar', label: 'Caractere especial (@$!%*?&)' },
                        { key: 'minLength', label: 'Mínimo 6 caracteres' },
                      ].map(({ key, label }) => {
                        const met =
                          passwordRequirements[key as keyof PasswordRequirements];
                        return (
                          <div
                            key={key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-2)',
                              fontSize: 'var(--text-xs)',
                              color: met
                                ? 'var(--color-brand-primary)'
                                : 'var(--color-text-muted)',
                            }}
                          >
                            <span
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                border: `2px solid ${
                                  met
                                    ? 'var(--color-brand-primary)'
                                    : 'var(--color-border-default)'
                                }`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 700,
                              }}
                            >
                              {met ? '✓' : ''}
                            </span>
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botão para avançar */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                  }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => setExpandedStep(1)}
                    disabled={isSubmitting}
                  >
                    Voltar
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={async () => {
                      await validateAndProgress(2, 3);
                    }}
                    disabled={isSubmitting}
                  >
                    Próximo
                  </Button>
                </div>
              </FormSection>

              {/* ============ PASSO 3: ENDEREÇO ============ */}
              <FormSection
                stepNumber={3}
                title="Endereço"
                description="Onde você está localizado"
                isActive={expandedStep === 3}
                isCompleted={registration.completedSteps.includes(3)}
                isDisabled={!registration.completedSteps.includes(2)}
                onToggle={() => setExpandedStep(expandedStep === 3 ? 2 : 3)}
                hasError={Object.keys(errors).some((k) =>
                  ['cep', 'rua', 'numero', 'cidade', 'estado'].includes(k)
                )}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--space-3)',
                  }}
                  className="form-grid-inputs"
                >
                  <Input
                    label="CEP"
                    placeholder="01310-100"
                    value={formData.endereco.cep}
                    onChange={(e) => handleFieldChange('endereco.cep', e.target.value)}
                    error={errors.cep}
                    disabled={isLoadingCEP}
                  />

                  <Input
                    label="Rua"
                    placeholder="Avenida Paulista"
                    value={formData.endereco.rua}
                    onChange={(e) =>
                      dispatch(
                        updateFormField({
                          field: 'endereco.rua',
                          value: e.target.value,
                        })
                      )
                    }
                    error={errors.rua}
                  />

                  <Input
                    label="Número"
                    placeholder="1000"
                    value={formData.endereco.numero}
                    onChange={(e) =>
                      dispatch(
                        updateFormField({
                          field: 'endereco.numero',
                          value: e.target.value,
                        })
                      )
                    }
                    error={errors.numero}
                  />

                  <Input
                    label="Complemento (opcional)"
                    placeholder="Apto 101"
                    value={formData.endereco.complemento}
                    onChange={(e) =>
                      dispatch(
                        updateFormField({
                          field: 'endereco.complemento',
                          value: e.target.value,
                        })
                      )
                    }
                  />

                  <Input
                    label="Cidade"
                    placeholder="São Paulo"
                    value={formData.endereco.cidade}
                    onChange={(e) =>
                      dispatch(
                        updateFormField({
                          field: 'endereco.cidade',
                          value: e.target.value,
                        })
                      )
                    }
                    error={errors.cidade}
                  />

                  <Input
                    label="Estado"
                    placeholder="SP"
                    maxLength={2}
                    value={formData.endereco.estado}
                    onChange={(e) =>
                      dispatch(
                        updateFormField({
                          field: 'endereco.estado',
                          value: e.target.value.toUpperCase(),
                        })
                      )
                    }
                    error={errors.estado}
                  />
                </div>

                {/* Botões de navegação */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                  }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => setExpandedStep(2)}
                    disabled={isSubmitting}
                  >
                    Voltar
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={async () => {
                      const nextStepNumber = userType === 'organizador-campeonato' ? 5 : 4;
                      await validateAndProgress(3, nextStepNumber);
                    }}
                    disabled={isSubmitting}
                  >
                    {userType === 'organizador-campeonato' ? 'Próximo' : 'Finalizar'}
                  </Button>
                </div>
              </FormSection>

              {/* ============ PASSO 4: DADOS BANCÁRIOS (APENAS ORGANIZADOR CAMPEONATO) ============ */}
              {userType === 'organizador-campeonato' && (
                <FormSection
                  stepNumber={4}
                  title="Dados Bancários"
                  description="Para receber valores de ingressos"
                  isActive={expandedStep === 5}
                  isCompleted={registration.completedSteps.includes(5)}
                  isDisabled={!registration.completedSteps.includes(3)}
                  onToggle={() => setExpandedStep(expandedStep === 5 ? 3 : 5)}
                  hasError={Object.keys(errors).some((k) =>
                    ['banco', 'agencia', 'conta', 'tipo', 'chavePix'].includes(k)
                  )}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: 'var(--space-3)',
                    }}
                    className="form-grid-inputs"
                  >
                    <Input
                      label="Banco"
                      placeholder="ex: Nubank, Bradesco"
                      value={formData.contaBanco?.banco || ''}
                      onChange={(e) =>
                        dispatch(
                          updateFormField({
                            field: 'contaBanco.banco',
                            value: e.target.value,
                          })
                        )
                      }
                      error={errors.banco}
                    />

                    <Input
                      label="Agência"
                      placeholder="0001"
                      value={formData.contaBanco?.agencia || ''}
                      onChange={(e) =>
                        dispatch(
                          updateFormField({
                            field: 'contaBanco.agencia',
                            value: e.target.value,
                          })
                        )
                      }
                      error={errors.agencia}
                    />

                    <Input
                      label="Conta"
                      placeholder="123456-7"
                      value={formData.contaBanco?.conta || ''}
                      onChange={(e) =>
                        dispatch(
                          updateFormField({
                            field: 'contaBanco.conta',
                            value: e.target.value,
                          })
                        )
                      }
                      error={errors.conta}
                    />

                    <Input
                      label="Tipo de Conta"
                      placeholder="ex: Corrente, Poupança"
                      value={formData.contaBanco?.tipo || ''}
                      onChange={(e) =>
                        dispatch(
                          updateFormField({
                            field: 'contaBanco.tipo',
                            value: e.target.value,
                          })
                        )
                      }
                      error={errors.tipo}
                    />

                    <Input
                      label="Chave PIX"
                      placeholder="email@example.com"
                      value={formData.contaBanco?.chavePix || ''}
                      onChange={(e) =>
                        dispatch(
                          updateFormField({
                            field: 'contaBanco.chavePix',
                            value: e.target.value,
                          })
                        )
                      }
                      error={errors.chavePix}
                    />
                  </div>

                  {/* Botões de navegação */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="lg"
                      fullWidth
                      onClick={() => setExpandedStep(3)}
                      disabled={isSubmitting}
                    >
                      Voltar
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={async () => {
                        await validateAndProgress(5, 4);
                      }}
                      disabled={isSubmitting}
                    >
                      Próximo
                    </Button>
                  </div>
                </FormSection>
              )}
            </FormSectionGroup>

            {/* Passo 4: Confirmação */}
            {(expandedStep === 4 || registration.completedSteps.includes(3)) && (
              <div
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-default)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <h3
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    marginBottom: 'var(--space-3)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Revisão de Dados
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gap: 'var(--space-3)',
                  }}
                >
                  {/* Pessoal */}
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        fontWeight: 600,
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Informações Pessoais
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-2)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <div>
                        <strong>Nome:</strong> {formData.nome}
                      </div>
                      <div>
                        <strong>Email:</strong> {formData.email}
                      </div>
                      <div>
                        <strong>Telefone:</strong> {formData.telefone}
                      </div>
                      <div>
                        <strong>Data Nasc.:</strong> {formData.dataNascimento}
                      </div>
                    </div>
                  </div>

                  {/* Credenciais */}
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        fontWeight: 600,
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Credenciais
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-2)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      <div>
                        <strong>CPF:</strong> {formData.cpf}
                      </div>
                      <div>
                        <strong>Senha:</strong> ••••••
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        fontWeight: 600,
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                      }}
                    >
                      Endereço
                    </p>
                    <div
                      style={{
                        display: 'grid',
                        gap: 'var(--space-2)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.6,
                      }}
                    >
                      <div>
                        <strong>{formData.endereco.rua}</strong>, {formData.endereco.numero}
                        {formData.endereco.complemento && ` - ${formData.endereco.complemento}`}
                      </div>
                      <div>
                        {formData.endereco.cidade} - {formData.endereco.estado} {formData.endereco.cep}
                      </div>
                    </div>
                  </div>

                  {/* Dados Bancários (só mostra se for organizador de campeonato) */}
                  {userType === 'organizador-campeonato' && formData.contaBanco && (
                    <div>
                      <p
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          fontWeight: 600,
                          marginBottom: 'var(--space-2)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Dados Bancários
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 'var(--space-2)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        <div>
                          <strong>Banco:</strong> {formData.contaBanco.banco}
                        </div>
                        <div>
                          <strong>Agência:</strong> {formData.contaBanco.agencia}
                        </div>
                        <div>
                          <strong>Conta:</strong> {formData.contaBanco.conta}
                        </div>
                        <div>
                          <strong>Tipo:</strong> {formData.contaBanco.tipo}
                        </div>
                        <div>
                          <strong>Chave PIX:</strong> {formData.contaBanco.chavePix}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
              }}
            >
              <Button
                type="button"
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => router.push('/cadastro')}
                disabled={isSubmitting || isTransitioning}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting || isTransitioning}
                disabled={isSubmitting || isTransitioning || expandedStep !== 4}
              >
                Criar Conta
              </Button>
            </div>
          </form>

          {/* Footer */}
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              marginTop: 'var(--space-5)',
              lineHeight: 1.6,
            }}
          >
            Ao fazer cadastro, você concorda com nossos Termos de Serviço e
            Política de Privacidade.
          </p>
        </Card>
      </FadeIn>
    </main>
  );
}
