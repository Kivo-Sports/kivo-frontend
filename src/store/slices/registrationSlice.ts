/**
 * @file registrationSlice.ts
 * @description Centraliza o estado do formulário de registro/cadastro
 *
 * Responsabilidades:
 * - Armazenar tipo de usuário selecionado (torcedor, organizador-time, organizador-campeonato)
 * - Manter dados do formulário durante navegação
 * - Armazenar passo atual
 * - Gerenciar erros de validação
 *
 * @author Kivo Sports - TCC
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserType } from '@/lib/registration.utils';

export interface Endereco {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  cidade: string;
  estado: string;
}

export interface ContaBanco {
  banco: string;
  agencia: string;
  conta: string;
  tipo: string;
  chavePix: string;
}

export interface RegistrationFormData {
  // Campos comuns (todos os usuários)
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  cpf: string;
  senha: string;
  confirmSenha: string;
  endereco: Endereco;

  // Apenas para organizador-campeonato
  contaBanco?: ContaBanco;
}

export interface RegistrationState {
  userType: UserType | null;
  currentStep: number;
  formData: RegistrationFormData;
  errors: Record<string, string>;
  completedSteps: number[];
  isSubmitting: boolean;
  submitError: string | null;
}

const emptyFormData: RegistrationFormData = {
  nome: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  cpf: '',
  senha: '',
  confirmSenha: '',
  endereco: {
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
  },
  contaBanco: {
    banco: '',
    agencia: '',
    conta: '',
    tipo: '',
    chavePix: '',
  },
};

const initialState: RegistrationState = {
  userType: null,
  currentStep: 1,
  formData: emptyFormData,
  errors: {},
  completedSteps: [],
  isSubmitting: false,
  submitError: null,
};

const registrationSlice = createSlice({
  name: 'registration',
  initialState,
  reducers: {
    /**
     * Define o tipo de usuário selecionado
     */
    setUserType: (state, action: PayloadAction<UserType>) => {
      state.userType = action.payload;
      state.currentStep = 1;
      state.formData = emptyFormData;
      state.errors = {};
      state.completedSteps = [];
      state.submitError = null;
    },

    /**
     * Atualiza um campo do formulário
     */
    updateFormField: (
      state,
      action: PayloadAction<{
        field: string;
        value: string;
      }>
    ) => {
      const { field, value } = action.payload;
      const keys = field.split('.');

      if (keys.length === 1) {
        (state.formData as any)[field] = value;
      } else if (keys.length === 2) {
        (state.formData as any)[keys[0]][keys[1]] = value;
      }

      // Limpar erro do campo quando usuário digita
      if (state.errors[field]) {
        delete state.errors[field];
      }
    },

    /**
     * Atualiza múltiplos campos de uma vez
     */
    updateFormData: (
      state,
      action: PayloadAction<Partial<RegistrationFormData>>
    ) => {
      state.formData = {
        ...state.formData,
        ...action.payload,
      };
    },

    /**
     * Define erros de validação para um passo
     */
    setStepErrors: (
      state,
      action: PayloadAction<Record<string, string>>
    ) => {
      state.errors = action.payload;
    },

    /**
     * Limpa um erro específico
     */
    clearFieldError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },

    /**
     * Marca um passo como completado
     */
    markStepCompleted: (state, action: PayloadAction<number>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },

    /**
     * Move para o próximo passo
     */
    goToNextStep: (state) => {
      state.currentStep += 1;
      state.submitError = null;
    },

    /**
     * Move para o passo anterior
     */
    goToPreviousStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
      }
      state.submitError = null;
    },

    /**
     * Move para um passo específico
     */
    goToStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
      state.submitError = null;
    },

    /**
     * Define estado de submissão
     */
    setIsSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },

    /**
     * Define erro de submissão
     */
    setSubmitError: (state, action: PayloadAction<string | null>) => {
      state.submitError = action.payload;
    },

    /**
     * Reseta o estado de registro completamente
     */
    resetRegistration: (state) => {
      state.userType = null;
      state.currentStep = 1;
      state.formData = emptyFormData;
      state.errors = {};
      state.completedSteps = [];
      state.isSubmitting = false;
      state.submitError = null;
    },
  },
});

export const {
  setUserType,
  updateFormField,
  updateFormData,
  setStepErrors,
  clearFieldError,
  markStepCompleted,
  goToNextStep,
  goToPreviousStep,
  goToStep,
  setIsSubmitting,
  setSubmitError,
  resetRegistration,
} = registrationSlice.actions;

export default registrationSlice.reducer;
