/**
 * @file AdminFormModal.tsx
 * @description Modal para criar/editar administrador
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/atoms/Toast';
import { Card } from '@/components/molecules/Card/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { DateInput } from '@/components/atoms/DateInput';
import {
  criarAdmin,
  editarAdmin,
  checkEmailExists,
  checkCPFExists,
  AdminData,
  CreateAdminPayload,
  EditAdminPayload,
} from '@/services/admin.service';

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin?: AdminData;
  token: string;
}

export function AdminFormModal({
  isOpen,
  onClose,
  onSuccess,
  admin,
  token,
}: AdminFormModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditMode = !!admin;

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    dataNascimento: '',
    senha: '',
    confirmarSenha: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setFormData({
        nome: admin.nome,
        email: admin.email,
        cpf: admin.cpf || '',
        telefone: admin.telefone,
        dataNascimento: admin.dataNascimento.split('T')[0],
        senha: '',
        confirmarSenha: '',
      });
    }
  }, [admin, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      newErrors.email = 'Email válido é obrigatório';
    }
    if (!isEditMode) {
      if (!formData.cpf.trim()) {
        newErrors.cpf = 'CPF é obrigatório (apenas para criação)';
      }
      if (!formData.senha.trim()) {
        newErrors.senha = 'Senha é obrigatória';
      }
      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = 'As senhas não correspondem';
      }
      if (formData.senha.length < 6) {
        newErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
      }
    }
    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }
    if (!formData.dataNascimento) {
      newErrors.dataNascimento = 'Data de nascimento é obrigatória';
    }

    // Check se email já existe (para criação)
    if (!isEditMode) {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        newErrors.email = 'Email já está registrado';
      }
    }
    // Check se email já existe (para edição, apenas se mudou)
    if (isEditMode && admin && formData.email !== admin.email) {
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        newErrors.email = 'Email já está registrado';
      }
    }

    // Check se CPF já existe (para criação)
    if (!isEditMode && formData.cpf) {
      const cpfExists = await checkCPFExists(formData.cpf);
      if (cpfExists) {
        newErrors.cpf = 'CPF já está registrado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setIsLoading(true);

    try {
      let result;

      if (isEditMode) {
        const payload: EditAdminPayload = {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          dataNascimento: formData.dataNascimento,
        };
        result = await editarAdmin(admin!.id!, payload, token);
      } else {
        const payload: CreateAdminPayload = {
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf,
          telefone: formData.telefone,
          dataNascimento: formData.dataNascimento,
          senha: formData.senha,
        };
        result = await criarAdmin(payload, token);
      }

      if (result.success) {
        toastSuccess(
          isEditMode ? 'Admin atualizado com sucesso' : 'Admin criado com sucesso'
        );
        onSuccess();
        onClose();
        if (!isEditMode) {
          setFormData({
            nome: '',
            email: '',
            cpf: '',
            telefone: '',
            dataNascimento: '',
            senha: '',
            confirmarSenha: '',
          });
        }
      } else {
        toastError(result.error || 'Erro ao processar admin');
        if (result.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(result.fieldErrors).forEach(([key, messages]) => {
            if (Array.isArray(messages)) {
              fieldErrors[key.toLowerCase()] = messages.join(', ');
            }
          });
          setErrors(fieldErrors);
        }
      }
    } catch (error) {
      toastError('Erro ao processar admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
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
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            padding: 'var(--space-4)',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '550px',
              maxHeight: '95vh',
              overflowY: 'auto',
              zIndex: 10000,
              pointerEvents: 'auto',
            }}
          >
            <Card padding="lg">
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h2
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                >
                  {isEditMode ? 'Editar Admin' : 'Criar Admin'}
                </h2>
              </div>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-3)',
                }}
                className="admin-form-grid"
              >
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input
                    label="Nome Completo"
                    name="nome"
                    type="text"
                    value={formData.nome}
                    onChange={handleChange}
                    error={errors.nome}
                    disabled={isLoading}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    disabled={isLoading || isEditMode}
                  />
                </div>

                {!isEditMode && (
                  <Input
                    label="CPF"
                    name="cpf"
                    type="text"
                    value={formData.cpf}
                    onChange={handleChange}
                    error={errors.cpf}
                    disabled={isLoading}
                  />
                )}

                <Input
                  label="Telefone"
                  name="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={handleChange}
                  error={errors.telefone}
                  disabled={isLoading}
                />

                <DateInput
                  label="Data de Nascimento"
                  name="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  error={errors.dataNascimento}
                  disabled={isLoading}
                />

                {!isEditMode && (
                  <>
                    <Input
                      label="Senha"
                      name="senha"
                      type="password"
                      value={formData.senha}
                      onChange={handleChange}
                      error={errors.senha}
                      disabled={isLoading}
                    />

                    <Input
                      label="Confirmar Senha"
                      name="confirmarSenha"
                      type="password"
                      value={formData.confirmarSenha}
                      onChange={handleChange}
                      error={errors.confirmarSenha}
                      disabled={isLoading}
                    />
                  </>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-3)', gridColumn: '1 / -1', marginTop: 'var(--space-2)' }}>
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isLoading}
                    fullWidth
                  >
                    Cancelar
                  </Button>
                  <Button variant="primary" type="submit" loading={isLoading} fullWidth>
                    {isEditMode ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>

              <style>{`
                @media (max-width: 640px) {
                  .admin-form-grid {
                    grid-template-columns: 1fr !important;
                  }
                }
              `}</style>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
