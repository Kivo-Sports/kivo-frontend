/**
 * @file configuracoes/page.tsx
 * @description Página de configurações do usuário com aba de conta
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';

// Components
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/molecules/Card';
import { SettingsSidebar } from '@/components/organisms/SettingsSidebar';
import { ChangePasswordModal } from '@/components/molecules/ChangePasswordModal';
import { DeactivateAccountModal } from '@/components/molecules/DeactivateAccountModal';
import { EditUserDataModal } from '@/components/molecules/EditUserDataModal';
import { AccountTypeBadge } from '@/components/atoms/AccountTypeBadge';
import { AppLayout } from '@/components/templates/AppLayout';

// Store
import type { RootState } from '@/store';
import { clearCredentials } from '@/store/slices/authSlice';

// Services
import { redefinirSenha, desativarConta } from '@/services/auth.service';
import { buscarDadosUsuario, atualizarDadosUsuario, type UsuarioData } from '@/services/user.service';

// Hooks
import { useToast } from '@/components/atoms/Toast';

// Motion
import { motion } from 'framer-motion';

export default function ConfiguracoesPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { success: toastSuccess, error: toastError } = useToast();

  // Estado
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeactivateAccountOpen, setIsDeactivateAccountOpen] = useState(false);
  const [isEditUserDataOpen, setIsEditUserDataOpen] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [userData, setUserData] = useState<UsuarioData | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  // Carregar dados do usuário ao montar
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id || !token) return;

      setIsLoadingUserData(true);
      const result = await buscarDadosUsuario(user.id, token);
      if (result.success && result.data) {
        setUserData(result.data);
      } else {
        toastError(result.error || 'Erro ao carregar dados do usuário');
      }
      setIsLoadingUserData(false);
    };

    loadUserData();
  }, [user?.id, token]);

  // Handlers
  const handleChangePasswordSubmit = async (currentPassword: string, newPassword: string) => {
    if (!token) {
      toastError('Sessão expirada. Faça login novamente.');
      return;
    }

    const result = await redefinirSenha(currentPassword, newPassword, token);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao redefinir senha');
    }
  };

  const handleDeactivateAccountSubmit = async () => {
    if (!user?.id || !token) {
      toastError('Sessão expirada. Faça login novamente.');
      return;
    }

    const result = await desativarConta(user.id, token);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao desativar conta');
    }

    // Fazer logout após desativar conta com sucesso
    dispatch(clearCredentials());
    router.push('/login');
  };

  const handleUpdateUserData = async (dados: Partial<UsuarioData>) => {
    if (!user?.id || !token) {
      toastError('Sessão expirada. Faça login novamente.');
      return;
    }

    const result = await atualizarDadosUsuario(user.id, user.cargo, dados, token);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao atualizar dados');
    }

    // Atualizar dados locais
    setUserData({ ...userData, ...dados } as UsuarioData);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toastError('Email não pode estar vazio');
      return;
    }

    // TODO: Implementar endpoint de atualizar email
    // Por enquanto, apenas demonstramos a estrutura
    setIsUpdatingEmail(true);
    try {
      // const result = await updateUserEmail(newEmail, token);
      // if (!result.success) {
      //   throw new Error(result.error || 'Erro ao atualizar email');
      // }
      toastSuccess('Email atualizado com sucesso!');
      setIsEditingEmail(false);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Erro ao atualizar email');
      setNewEmail(user?.email || '');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div
        style={{
          display: 'grid',
          gap: 'var(--space-6)',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          gridTemplateColumns: 'clamp(150px, 25%, 250px) 1fr',
        }}
        data-settings-grid
      >
        {/* Sidebar */}
        <div data-settings-sidebar>
          <SettingsSidebar activeItem="account" />
        </div>

        {/* Conteúdo Principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <h1
                    style={{
                      fontSize: 'var(--text-2xl)',
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Configurações da Conta
                  </h1>
                </div>
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Gerencie suas informações pessoais e configurações de segurança
              </p>
            </div>

            {/* Seção: Informações Pessoais */}
            <Card padding="lg" style={{ marginBottom: 'var(--space-6)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Informações Pessoais
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditUserDataOpen(true)}
                  disabled={isLoadingUserData || !userData}
                >
                  ✏️ Editar
                </Button>
              </div>

              {isLoadingUserData ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 'var(--space-6)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Carregando dados...
                </div>
              ) : userData ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--space-4)',
                  }}
                  className="settings-data-grid"
                >
                  {/* Nome */}
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        marginBottom: 'var(--space-1)',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Nome Completo
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {userData.nome || '-'}
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        marginBottom: 'var(--space-1)',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      Email
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {userData.email || '-'}
                    </p>
                  </div>

                  {/* CPF */}
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        marginBottom: 'var(--space-1)',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      CPF
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {userData.cpf || '-'}
                    </p>
                  </div>

                  {/* Telefone */}
                  {userData.telefone && (
                    <div>
                      <p
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-1)',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        Telefone
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        {userData.telefone}
                      </p>
                    </div>
                  )}

                  {/* Data de Nascimento */}
                  {userData.dataNascimento && (
                    <div>
                      <p
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-1)',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        Data de Nascimento
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        {userData.dataNascimento}
                      </p>
                    </div>
                  )}

                  {/* Tipo de Usuário */}
                  {userData.cargo && (
                    <div>
                      <p
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-2)',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                        }}
                      >
                        Tipo de Usuário
                      </p>
                      <AccountTypeBadge cargo={userData.cargo} size="md" showLabel={true} />
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)' }}>
                  Erro ao carregar dados do usuário
                </p>
              )}

              {/* Endereço */}
              {userData?.endereco && (
                <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border-default)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Endereço
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>CEP</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.endereco.cep}
                      </p>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Rua</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.endereco.rua}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Número</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.endereco.numero}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Complemento</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.endereco.complemento || '-'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Bairro</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.endereco.bairro}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Cidade</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.endereco.cidade}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Estado</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.endereco.estado}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dados Bancários */}
              {userData?.dadosBancarios && (
                <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border-default)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Dados Bancários
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Banco</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.dadosBancarios.banco}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Agência</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.dadosBancarios.agencia}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Conta</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.dadosBancarios.conta}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Tipo</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.dadosBancarios.tipoConta}
                      </p>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>Nome do Titular</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.dadosBancarios.nomeTitular}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>CPF Titular</p>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {userData.dadosBancarios.cpfTitular}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Seção: Segurança */}
            <Card padding="lg" style={{ marginBottom: 'var(--space-6)' }}>
              <h2
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Segurança
              </h2>

              {/* Redefinir Senha */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 'var(--space-4)',
                  borderBottom: '1px solid var(--color-border-default)',
                  marginBottom: 'var(--space-4)',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}
                className="security-item"
              >
                <div>
                  <h3
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Redefinir Senha
                  </h3>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Altere sua senha para manter sua conta segura
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsChangePasswordOpen(true)}
                >
                  Redefinir
                </Button>
              </div>

              {/* Desativar Conta */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                }}
                className="security-item"
              >
                <div>
                  <h3
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-feedback-danger)',
                      marginBottom: 'var(--space-1)',
                    }}
                  >
                    Desativar Conta
                  </h3>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Desative sua conta e perca acesso a todos os serviços
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeactivateAccountOpen(true)}
                >
                  Desativar
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          [data-settings-grid] {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
            padding: 0 !important;
            width: calc(100% + var(--space-8));
            margin-left: calc(-0.5 * var(--space-8));
          }
          [data-settings-sidebar] {
            border-right: none;
            border-bottom: 1px solid var(--color-border-default);
            padding-right: var(--space-4);
            padding-left: var(--space-4);
            padding-bottom: var(--space-4);
            margin-bottom: var(--space-4);
            width: 100%;
            max-width: 100%;
          }
          [data-settings-sidebar] nav {
            flex-direction: column !important;
            overflow-x: auto;
            gap: var(--space-2);
          }
          [data-settings-sidebar] nav > a {
            min-width: auto;
          }
        }

        @media (max-width: 640px) {
          .settings-data-grid {
            grid-template-columns: 1fr !important;
          }

          .security-item {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .security-item button {
            width: 100% !important;
          }

          .security-item > div {
            width: 100%;
          }
        }
      `}</style>

      {/* Modais */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSubmit={handleChangePasswordSubmit}
      />

      <DeactivateAccountModal
        isOpen={isDeactivateAccountOpen}
        userEmail={user?.email || ''}
        onClose={() => setIsDeactivateAccountOpen(false)}
        onConfirm={handleDeactivateAccountSubmit}
      />

      <EditUserDataModal
        isOpen={isEditUserDataOpen}
        userData={userData}
        onClose={() => setIsEditUserDataOpen(false)}
        onSubmit={handleUpdateUserData}
      />
    </AppLayout>
  );
}
