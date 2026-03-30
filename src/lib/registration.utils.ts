/**
 * @file registration.utils.ts
 * @description Utilidades para validação e formatação de dados de registro
 * @author Kivo Sports - TCC
 */

export type UserType = 'torcedor' | 'organizador-time' | 'organizador-campeonato';

export interface PasswordRequirements {
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  specialChar: boolean;
  minLength: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordValidationResult extends ValidationResult {
  requirements?: PasswordRequirements;
}

export interface BankValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ============================================================================
// ============================= NOME =======================================
// ============================================================================

export function validateNome(nome: string): ValidationResult {
  const trimmed = nome.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Nome é obrigatório' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Nome deve ter no mínimo 3 caracteres' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Nome deve ter no máximo 100 caracteres' };
  }

  return { isValid: true };
}

// ============================================================================
// ============================= EMAIL ======================================
// ============================================================================

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!trimmed) {
    return { isValid: false, error: 'Email é obrigatório' };
  }

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Email inválido. Use: usuario@dominio.com' };
  }

  return { isValid: true };
}

// ============================================================================
// ============================= CPF ========================================
// ============================================================================

function calculateCPFDigit(cpf: string, multiplier: number): number {
  let sum = 0;
  for (let i = 0; i < multiplier - 1; i++) {
    sum += parseInt(cpf[i]) * (multiplier - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function formatCPF(input: string): string {
  const cleaned = input.replace(/\D/g, '').slice(0, 11);

  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;

  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

export function validateCPF(cpf: string): ValidationResult {
  const cleaned = cpf.replace(/\D/g, '');

  if (!cleaned) {
    return { isValid: false, error: 'CPF é obrigatório' };
  }

  if (cleaned.length !== 11) {
    return { isValid: false, error: 'CPF deve ter 11 dígitos' };
  }

  // Verifica CPFs conhecidos como inválidos
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { isValid: false, error: 'CPF inválido' };
  }

  // Calcula o primeiro dígito verificador
  const firstDigit = calculateCPFDigit(cleaned, 10);
  if (parseInt(cleaned[9]) !== firstDigit) {
    return { isValid: false, error: 'CPF inválido' };
  }

  // Calcula o segundo dígito verificador
  const secondDigit = calculateCPFDigit(cleaned, 11);
  if (parseInt(cleaned[10]) !== secondDigit) {
    return { isValid: false, error: 'CPF inválido' };
  }

  return { isValid: true };
}

// ============================================================================
// ============================= TELEFONE ==================================
// ============================================================================

export function formatTelefone(input: string): string {
  // Remove o código do país se existir (+55)
  let cleaned = input.replace(/^\+55\s?/, '').replace(/\D/g, '');

  // Limita a 11 dígitos (2 DDD + 9 número)
  cleaned = cleaned.slice(0, 11);

  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;

  // Exatamente 11 dígitos - formata como (XX) 9XXXX-XXXX
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

export function validateTelefone(telefone: string): ValidationResult {
  // Remove código do país se existir e remove caracteres especiais
  const cleaned = telefone.replace(/^\+55\s?/, '').replace(/\D/g, '');

  if (!cleaned) {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }

  if (cleaned.length !== 11) {
    return { isValid: false, error: 'Telefone deve ter 11 dígitos (DDD + 9 dígitos)' };
  }

  return { isValid: true };
}

// ============================================================================
// ============================= DATA NASCIMENTO ===========================
// ============================================================================

export function validateDataNascimento(data: string): ValidationResult {
  if (!data) {
    return { isValid: false, error: 'Data de nascimento é obrigatória' };
  }

  const date = new Date(data);

  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Data inválida' };
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }

  if (age < 13) {
    return { isValid: false, error: 'Você deve ter no mínimo 13 anos' };
  }

  if (age > 130) {
    return { isValid: false, error: 'Data de nascimento inválida' };
  }

  return { isValid: true };
}

// ============================================================================
// ============================= SENHA ======================================
// ============================================================================

export function validateSenhaCriteria(senha: string): PasswordRequirements {
  return {
    uppercase: /[A-Z]/.test(senha),
    lowercase: /[a-z]/.test(senha),
    number: /\d/.test(senha),
    specialChar: /[@$!%*?&]/.test(senha),
    minLength: senha.length >= 6,
  };
}

export function isPasswordComplete(requirements: PasswordRequirements): boolean {
  return Object.values(requirements).every(Boolean);
}

export function validateSenha(senha: string): PasswordValidationResult {
  if (!senha) {
    return {
      isValid: false,
      error: 'Senha é obrigatória',
      requirements: {
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false,
        minLength: false,
      },
    };
  }

  const requirements = validateSenhaCriteria(senha);
  const isValid = isPasswordComplete(requirements);

  if (!isValid) {
    return {
      isValid: false,
      error: 'Senha não atende aos requisitos',
      requirements,
    };
  }

  return {
    isValid: true,
    requirements,
  };
}

// ============================================================================
// ============================= CEP  =======================================
// ============================================================================

export function formatCEP(input: string): string {
  const cleaned = input.replace(/\D/g, '').slice(0, 8);

  if (cleaned.length <= 5) return cleaned;

  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}

export function validateCEP(cep: string): ValidationResult {
  const cleaned = cep.replace(/\D/g, '');

  if (!cleaned) {
    return { isValid: false, error: 'CEP é obrigatório' };
  }

  if (cleaned.length !== 8) {
    return { isValid: false, error: 'CEP deve ter 8 dígitos' };
  }

  return { isValid: true };
}

// ============================================================================
// ============================= ENDEREÇO ==================================
// ============================================================================

export function validateRua(rua: string): ValidationResult {
  const trimmed = rua.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Rua é obrigatória' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Rua deve ter no mínimo 3 caracteres' };
  }

  return { isValid: true };
}

export function validateNumero(numero: string): ValidationResult {
  const trimmed = numero.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Número é obrigatório' };
  }

  return { isValid: true };
}

export function validateCidade(cidade: string): ValidationResult {
  const trimmed = cidade.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Cidade é obrigatória' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Cidade deve ter no mínimo 2 caracteres' };
  }

  return { isValid: true };
}

export function validateEstado(estado: string): ValidationResult {
  const trimmed = estado.trim().toUpperCase();

  if (!trimmed) {
    return { isValid: false, error: 'Estado é obrigatório' };
  }

  if (trimmed.length !== 2) {
    return { isValid: false, error: 'Estado deve ser uma sigla (ex: SP, RJ)' };
  }

  const estadosValidos = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  if (!estadosValidos.includes(trimmed)) {
    return { isValid: false, error: 'Estado inválido' };
  }

  return { isValid: true };
}

// ============================================================================
// ============================= BANCO ======================================
// ============================================================================

export function validateBanco(banco: string): ValidationResult {
  const trimmed = banco.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Banco é obrigatório' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Banco deve ter no mínimo 2 caracteres' };
  }

  return { isValid: true };
}

export function validateAgencia(agencia: string): ValidationResult {
  const trimmed = agencia.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Agência é obrigatória' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Agência deve ter no mínimo 3 dígitos' };
  }

  return { isValid: true };
}

export function validateConta(conta: string): ValidationResult {
  const trimmed = conta.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Conta é obrigatória' };
  }

  if (trimmed.length < 4) {
    return { isValid: false, error: 'Conta deve ter no mínimo 4 dígitos' };
  }

  return { isValid: true };
}

export function validateChavePix(chavePix: string): ValidationResult {
  const trimmed = chavePix.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Chave PIX é obrigatória' };
  }

  // Aceita: email, telefone (11 dígitos), CPF (11 dígitos), ou UUID
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{11}$/;
  const cpfRegex = /^\d{11}$/;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (
    !emailRegex.test(trimmed) &&
    !phoneRegex.test(trimmed) &&
    !cpfRegex.test(trimmed) &&
    !uuidRegex.test(trimmed)
  ) {
    return {
      isValid: false,
      error: 'Chave PIX inválida. Use email, telefone, CPF ou UUID',
    };
  }

  return { isValid: true };
}

export function validateBank(
  banco: string,
  agencia: string,
  conta: string,
  chavePix: string
): BankValidationResult {
  const errors: Record<string, string> = {};

  const bancoResult = validateBanco(banco);
  if (!bancoResult.isValid) errors.banco = bancoResult.error!;

  const agenciaResult = validateAgencia(agencia);
  if (!agenciaResult.isValid) errors.agencia = agenciaResult.error!;

  const contaResult = validateConta(conta);
  if (!contaResult.isValid) errors.conta = contaResult.error!;

  const chaveResult = validateChavePix(chavePix);
  if (!chaveResult.isValid) errors.chavePix = chaveResult.error!;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================================================
// ============================= STEP VALIDATION ===========================
// ============================================================================

export interface StepValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateStep1(data: {
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
}): StepValidationResult {
  const errors: Record<string, string> = {};

  const nomeResult = validateNome(data.nome);
  if (!nomeResult.isValid) errors.nome = nomeResult.error!;

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) errors.email = emailResult.error!;

  const telefoneResult = validateTelefone(data.telefone);
  if (!telefoneResult.isValid) errors.telefone = telefoneResult.error!;

  const dataNascimentoResult = validateDataNascimento(data.dataNascimento);
  if (!dataNascimentoResult.isValid) errors.dataNascimento = dataNascimentoResult.error!;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Validação assíncrona para verificar se email já existe
export async function validateStep1Async(data: {
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  checkEmailExists: (email: string) => Promise<boolean>;
}): Promise<StepValidationResult> {
  const result = validateStep1({
    nome: data.nome,
    email: data.email,
    telefone: data.telefone,
    dataNascimento: data.dataNascimento,
  });

  if (!result.isValid) {
    return result;
  }

  // Verificar se email já existe
  try {
    const emailExists = await data.checkEmailExists(data.email);
    if (emailExists) {
      result.errors.email = 'Este email já está registrado';
      result.isValid = false;
    }
  } catch (error) {
    console.error('Erro ao verificar email:', error);
  }

  return result;
}

export function validateStep2(data: {
  cpf: string;
  senha: string;
  confirmSenha?: string;
}): StepValidationResult {
  const errors: Record<string, string> = {};

  const cpfResult = validateCPF(data.cpf);
  if (!cpfResult.isValid) errors.cpf = cpfResult.error!;

  const senhaResult = validateSenha(data.senha);
  if (!senhaResult.isValid) errors.senha = senhaResult.error!;

  // Validar confirmação de senha
  if (data.confirmSenha === undefined || data.confirmSenha === '') {
    errors.confirmSenha = 'Confirmação de senha é obrigatória';
  } else if (data.senha !== data.confirmSenha) {
    errors.confirmSenha = 'As senhas não coincidem';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Validação assíncrona para CPF
export async function validateStep2Async(data: {
  cpf: string;
  senha: string;
  confirmSenha?: string;
  checkCPFExists: (cpf: string) => Promise<boolean>;
}): Promise<StepValidationResult> {
  const result = validateStep2({
    cpf: data.cpf,
    senha: data.senha,
    confirmSenha: data.confirmSenha,
  });

  if (!result.isValid) {
    return result;
  }

  // Verificar se CPF já existe
  try {
    const cpfExists = await data.checkCPFExists(data.cpf);
    if (cpfExists) {
      result.errors.cpf = 'Este CPF já está registrado';
      result.isValid = false;
    }
  } catch (error) {
    console.error('Erro ao verificar CPF:', error);
  }

  return result;
}

export function validateStep3(data: {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  cidade: string;
  estado: string;
}): StepValidationResult {
  const errors: Record<string, string> = {};

  const cepResult = validateCEP(data.cep);
  if (!cepResult.isValid) errors.cep = cepResult.error!;

  const ruaResult = validateRua(data.rua);
  if (!ruaResult.isValid) errors.rua = ruaResult.error!;

  const numeroResult = validateNumero(data.numero);
  if (!numeroResult.isValid) errors.numero = numeroResult.error!;

  const cidadeResult = validateCidade(data.cidade);
  if (!cidadeResult.isValid) errors.cidade = cidadeResult.error!;

  const estadoResult = validateEstado(data.estado);
  if (!estadoResult.isValid) errors.estado = estadoResult.error!;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStep5(data: {
  banco: string;
  agencia: string;
  conta: string;
  chavePix: string;
}): StepValidationResult {
  const bankResult = validateBank(data.banco, data.agencia, data.conta, data.chavePix);

  return {
    isValid: bankResult.isValid,
    errors: bankResult.errors,
  };
}

// ============================================================================
// ============================= STEP CONFIG ================================
// ============================================================================

export interface StepConfig {
  numero: number;
  titulo: string;
  descricao: string;
  campos: string[];
}

export function getStepConfig(userType: UserType): StepConfig[] {
  const baseSteps: StepConfig[] = [
    {
      numero: 1,
      titulo: 'Informações Pessoais',
      descricao: 'Seus dados básicos',
      campos: ['nome', 'email', 'telefone', 'dataNascimento'],
    },
    {
      numero: 2,
      titulo: 'Credenciais',
      descricao: 'CPF e Senha',
      campos: ['cpf', 'senha'],
    },
    {
      numero: 3,
      titulo: 'Endereço',
      descricao: 'Onde você está localizado',
      campos: ['cep', 'rua', 'numero', 'complemento', 'cidade', 'estado'],
    },
    {
      numero: 4,
      titulo: 'Confirmação',
      descricao: 'Revise seus dados',
      campos: [],
    },
  ];

  if (userType === 'organizador-campeonato') {
    baseSteps.push({
      numero: 5,
      titulo: 'Dados Bancários',
      descricao: 'Para receber valores de ingressos',
      campos: ['banco', 'agencia', 'conta', 'chavePix'],
    });
  }

  return baseSteps;
}

export function getTotalSteps(userType: UserType): number {
  return userType === 'organizador-campeonato' ? 5 : 4;
}

// ============================================================================
// ============================= CEP LOOKUP ==================================
// ============================================================================

export interface CEPLookupResult {
  success: boolean;
  data?: {
    rua: string;
    cidade: string;
    estado: string;
    bairro: string;
  };
  error?: string;
}

export async function lookupCEP(cep: string): Promise<CEPLookupResult> {
  const cleaned = cep.replace(/\D/g, '');

  if (cleaned.length !== 8) {
    return { success: false, error: 'CEP deve ter 8 dígitos' };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    const data = await response.json();

    if (data.erro) {
      return { success: false, error: 'CEP não encontrado' };
    }

    return {
      success: true,
      data: {
        rua: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || '',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao buscar CEP. Verifique sua conexão.',
    };
  }
}

// ============================================================================
// ============================= USER TYPE LABEL ============================
// ============================================================================

export function getUserTypeLabel(userType: UserType): string {
  switch (userType) {
    case 'torcedor':
      return 'Torcedor';
    case 'organizador-time':
      return 'Organizador de Time';
    case 'organizador-campeonato':
      return 'Organizador de Campeonato';
    default:
      return 'Usuário';
  }
}
