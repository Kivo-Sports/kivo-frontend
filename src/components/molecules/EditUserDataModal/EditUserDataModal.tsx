/**
 * @file EditUserDataModal.tsx
 * @description Modal para editar dados do usuário
 */

'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/molecules/Card';
import { useToast } from '@/components/atoms/Toast';
import type { UsuarioData } from '@/services/user.service';

interface EditUserDataModalProps {
  isOpen: boolean;
  userData: UsuarioData | null;
  onClose: () => void;
  onSubmit: (dados: Partial<UsuarioData>) => Promise<void>;
}

interface FormErrors {
  [key: string]: string;
}

export function EditUserDataModal({
  isOpen,
  userData,
  onClose,
  onSubmit,
}: EditUserDataModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UsuarioData> | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  if (!formData) {
    return null;
  }

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    setErrors({ ...errors, [field]: '' });
  };

  const handleEnderecoChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      endereco: {
        ...formData.endereco,
        [field]: value,
      } as any,
    });
  };

  const handleBancarioChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      dadosBancarios: {
        ...formData.dadosBancarios,
        [field]: value,
      } as any,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData);
      toastSuccess('Dados atualizados com sucesso!');
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar dados';
      toastError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(userData);
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 'var(--space-4)',
            overflowY: 'auto',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <Card
              padding="lg"
              style={{
                width: '100%',
                maxWidth: 600,
              }}
            >
              <h2
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  marginBottom: 'var(--space-4)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Editar Dados Pessoais
              </h2>

              {/* Dados Pessoais */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h3
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-3)',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Dados Pessoais
                </h3>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <Input
                    label="Nome Completo"
                    value={formData.nome || ''}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    error={errors.nome}
                  />
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    error={errors.email}
                  />
                </div>

                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <Input
                    label="CPF"
                    value={formData.cpf || ''}
                    onChange={(e) => handleChange('cpf', e.target.value)}
                    error={errors.cpf}
                    disabled
                  />
                </div>

                {formData.telefone !== undefined && (
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Input
                      label="Telefone"
                      value={formData.telefone || ''}
                      onChange={(e) => handleChange('telefone', e.target.value)}
                      error={errors.telefone}
                    />
                  </div>
                )}
              </div>

              {/* Endereço */}
              {formData.endereco && (
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-3)',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Endereço
                  </h3>

                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Input
                      label="CEP"
                      value={formData.endereco.cep || ''}
                      onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Input
                      label="Rua"
                      value={formData.endereco.rua || ''}
                      onChange={(e) => handleEnderecoChange('rua', e.target.value)}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <Input
                      label="Número"
                      value={formData.endereco.numero || ''}
                      onChange={(e) => handleEnderecoChange('numero', e.target.value)}
                    />
                    <Input
                      label="Complemento"
                      value={formData.endereco.complemento || ''}
                      onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Input
                      label="Bairro"
                      value={formData.endereco.bairro || ''}
                      onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr',
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <Input
                      label="Cidade"
                      value={formData.endereco.cidade || ''}
                      onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                    />
                    <Input
                      label="Estado (UF)"
                      value={formData.endereco.estado || ''}
                      onChange={(e) => handleEnderecoChange('estado', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Dados Bancários */}
              {formData.dadosBancarios && (
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      marginBottom: 'var(--space-3)',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Dados Bancários
                  </h3>

                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Input
                      label="Banco"
                      value={formData.dadosBancarios.banco || ''}
                      onChange={(e) => handleBancarioChange('banco', e.target.value)}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <Input
                      label="Agência"
                      value={formData.dadosBancarios.agencia || ''}
                      onChange={(e) => handleBancarioChange('agencia', e.target.value)}
                    />
                    <Input
                      label="Conta"
                      value={formData.dadosBancarios.conta || ''}
                      onChange={(e) => handleBancarioChange('conta', e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Input
                      label="Tipo de Conta"
                      value={formData.dadosBancarios.tipoConta || ''}
                      onChange={(e) => handleBancarioChange('tipoConta', e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Input
                      label="Nome do Titular"
                      value={formData.dadosBancarios.nomeTitular || ''}
                      onChange={(e) => handleBancarioChange('nomeTitular', e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Input
                      label="CPF do Titular"
                      value={formData.dadosBancarios.cpfTitular || ''}
                      onChange={(e) => handleBancarioChange('cpfTitular', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Botões */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  justifyContent: 'flex-end',
                  marginTop: 'var(--space-6)',
                  borderTop: '1px solid var(--color-border-default)',
                  paddingTop: 'var(--space-4)',
                }}
              >
                <Button variant="ghost" size="md" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  loading={loading}
                >
                  Salvar Alterações
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
