/**
 * @file registration.service.ts
 * @description Serviço para integração com API de registro/cadastro
 *
 * Responsabilidades:
 * - Fazer chamadas POST para os 3 endpoints de registro
 * - Tratamento de erros da API
 * - Formatação de dados para o backend
 *
 * @author Kivo Sports - TCC
 */

import type { RegistrationFormData } from "@/store/slices/registrationSlice";
import type { AuthenticatedUser } from "@/store/slices/authSlice";
import type { UserType } from "@/lib/registration.utils";

// Tipos de resposta do backend
export interface ApiUser {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  ativo: boolean;
  criadoEm: string;
}

export interface RegistrationSuccessResponse {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
  ativo: boolean;
  cargo: string;
  endereco?: {
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    cidade: string;
    estado: string;
  };
}

export interface RegistrationErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

interface ValidationProblemDetails {
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

export interface LoginResponse {
  token: string;
  usuario: ApiUser & {
    name?: string;
    nome?: string;
  };
}

// Construir URL da API
const getApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL não está configurada");
  }

  return baseUrl;
};

// Mapear tipo de usuário para endpoint
const getEndpoint = (userType: UserType): string => {
  switch (userType) {
    case "torcedor":
      return "/api/usuario/torcedor";
    case "organizador-time":
      return "/api/usuario/organizador-time";
    case "organizador-campeonato":
      return "/api/usuario/organizador-campeonato";
    default:
      throw new Error(`Tipo de usuário inválido: ${userType}`);
  }
};

// Tipos para os payloads enviados ao backend
export interface CreateUserPayload {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
  senha: string;
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    cidade: string;
    estado: string;
    pais: string;
  };
  contaBanco?: {
    banco: string;
    agencia: string;
    conta: string;
    tipo: string;
    chavePix: string;
  };
}

// Formatar dados para enviar ao backend
const formatRegistrationData = (
  formData: RegistrationFormData,
  userType: UserType,
): CreateUserPayload => {
  const baseData = {
    nome: formData.nome.trim(),
    email: formData.email.trim(),
    cpf: formData.cpf.replace(/\D/g, ""),
    telefone: formData.telefone.replace(/\D/g, ""),
    dataNascimento: formData.dataNascimento,
    senha: formData.senha,
    endereco: {
      cep: formData.endereco.cep.replace(/\D/g, ""),
      rua: formData.endereco.rua.trim(),
      numero: formData.endereco.numero.trim(),
      complemento: formData.endereco.complemento?.trim() || "",
      cidade: formData.endereco.cidade.trim(),
      estado: formData.endereco.estado.trim().toUpperCase(),
      pais: "Brasil",
    },
  };

  // Adicionar dados bancários se for organizador de campeonato
  if (userType === "organizador-campeonato" && formData.contaBanco) {
    return {
      ...baseData,
      contaBanco: {
        banco: formData.contaBanco.banco.trim(),
        agencia: formData.contaBanco.agencia.trim(),
        conta: formData.contaBanco.conta.trim(),
        tipo: formData.contaBanco.tipo.trim(),
        chavePix: formData.contaBanco.chavePix.trim(),
      },
    };
  }

  return baseData;
};

// Mapear erros da API para campos
const mapApiErrorsToFields = (errors?: Record<string, string[]>): Record<string, string> => {
  if (!errors) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  Object.entries(errors).forEach(([field, messages]) => {
    // ContaBanco.Banco -> banco | Endereco.Cep -> cep
    let normalizedField = field;
    if (normalizedField.includes('.')) {
      const parts = normalizedField.split('.');
      normalizedField = parts[parts.length - 1] || normalizedField;
    }

    // ContaBanco[0] -> contaBanco
    normalizedField = normalizedField.replace(/\[\d+\]/g, '');

    // Tentar mapear snake_case para camelCase (backend pode retornar data_nascimento)
    const mappedField = field
      .split("_")
      .map((word, index) => {
        if (index === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join("");

    fieldErrors[mappedField] = messages[0] || "Erro de validação";
  });

  return fieldErrors;
};

const getValidationMessage = (details: ValidationProblemDetails): string => {
  const firstMessage = details.errors
    ? Object.values(details.errors).flat()[0]
    : undefined;

  return firstMessage || details.title || 'Erro de validação ao criar conta';
};

// Detectar tipo de erro para exibir notificação apropriada
const detectErrorType = (text: string): string => {
  const lower = text.toLowerCase();

  if (lower.includes("email") && (lower.includes("já") || lower.includes("existe"))) {
    return "email-duplicate";
  } else if (lower.includes("cpf") && (lower.includes("já") || lower.includes("existe"))) {
    return "cpf-duplicate";
  } else if (lower.includes("email") && lower.includes("inválid")) {
    return "email-invalid";
  } else if (lower.includes("cpf") && lower.includes("inválid")) {
    return "cpf-invalid";
  } else if (
    lower.includes("banco") ||
    lower.includes("agência") ||
    lower.includes("conta") ||
    lower.includes("pix")
  ) {
    return "bank-error";
  } else if (lower.includes("senha") || lower.includes("password")) {
    return "password-error";
  } else if (lower.includes("campo") || lower.includes("obrigatório")) {
    return "missing-field";
  } else if (lower.includes("já existe")) {
    return "user-exists";
  }

  return "generic-error";
};

// Obter mensagem de erro formatada com base no tipo
const getErrorMessage = (errorType: string, fallback: string): string => {
  const messages: Record<string, string> = {
    "email-duplicate": "Este email já está registrado. Tente outro ou faça login.",
    "cpf-duplicate": "Este CPF já está registrado. Tente outro ou faça login.",
    "email-invalid": "Email inválido. Verifique o formato: usuario@dominio.com",
    "cpf-invalid": "CPF inválido. Deve ter 11 dígitos.",
    "bank-error": "Dados bancários inválidos. Verifique banco, agência, conta e chave PIX.",
    "password-error": "Senha não atende aos requisitos. Verificar força da senha.",
    "missing-field": "Alguns campos obrigatórios estão vazios.",
    "user-exists": "Este usuário já está registrado.",
    "generic-error": "Erro ao criar conta. Verifique os dados e tente novamente.",
  };

  return messages[errorType] || fallback || messages["generic-error"];
};

// Função principal de registro
export async function registerUser(
  userType: UserType,
  formData: RegistrationFormData,
): Promise<{
  success: boolean;
  data?: RegistrationSuccessResponse;
  token?: string;
  user?: AuthenticatedUser;
  error?: string;
  errorType?: string;
  fieldErrors?: Record<string, string>;
}> {
  try {
    const apiUrl = getApiUrl();
    const endpoint = getEndpoint(userType);
    const payload = formatRegistrationData(formData, userType);

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (process.env.NODE_ENV === "development") {
      console.debug("[REGISTRATION] Response status:", response.status);
    }

    // Sucesso (201 Created)
    if (response.status === 201) {
      try {
        const data: RegistrationSuccessResponse = JSON.parse(responseText);

        // Fazer login automático após cadastro bem-sucedido
        const loginResponse = await loginAfterRegistration(formData.email, formData.senha);

        if (loginResponse.success && loginResponse.token) {
          return {
            success: true,
            data,
            token: loginResponse.token,
            user: loginResponse.user,
          };
        }

        // Se login falhar, mas registro foi ok, retornar sucesso mesmo assim
        return {
          success: true,
          data,
        };
      } catch (e) {
        console.error("Erro ao parsear resposta 201:", e);
        return {
          success: false,
          error: "Cadastro realizado, mas erro ao processar resposta",
        };
      }
    }

    // Erro (400, 409, etc)
    if (response.status >= 400 && response.status < 500) {
      // Tentar parsear como JSON primeiro
      let errorData: RegistrationErrorResponse | ValidationProblemDetails | string | null = null;

      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        // Se falhar, tratar como texto puro
        errorData = null;
      }

      if (typeof errorData === 'string') {
        const errorType = detectErrorType(errorData);
        const errorMessage = getErrorMessage(errorType, errorData);

        return {
          success: false,
          error: errorMessage,
          errorType,
        };
      }

      if (errorData && 'message' in errorData && errorData.message) {
        // Se conseguiu fazer parse e tem mensagem estruturada
        return {
          success: false,
          error: errorData.message || "Erro ao criar conta",
          fieldErrors: mapApiErrorsToFields(errorData.errors),
          errorType: detectErrorType(errorData.message || responseText),
        };
      } else if (errorData && 'errors' in errorData && errorData.errors) {
        const validationMessage = getValidationMessage(errorData);

        return {
          success: false,
          error: validationMessage,
          fieldErrors: mapApiErrorsToFields(errorData.errors),
          errorType: detectErrorType(validationMessage),
        };
      } else {
        // Se for texto puro ou resposta inesperada
        const errorType = detectErrorType(responseText);
        const errorMessage = getErrorMessage(errorType, responseText);

        return {
          success: false,
          error: errorMessage,
          errorType,
        };
      }
    }

    // Erro de servidor
    return {
      success: false,
      error: `Erro de servidor (${response.status})`,
    };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro de conexão. Verifique sua internet.",
    };
  }
}

// Fazer login após registro bem-sucedido
async function loginAfterRegistration(
  email: string,
  senha: string,
): Promise<{
  success: boolean;
  token?: string;
  user?: AuthenticatedUser;
}> {
  try {
    const apiUrl = getApiUrl();

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identificador: email,
        senha,
      }),
    });

    if (response.status === 200) {
      const text = await response.text();
      try {
        const data: LoginResponse = JSON.parse(text);
        const resolvedName = data.usuario.name || data.usuario.nome || email.split("@")[0];

        return {
          success: true,
          token: data.token,
          user: {
            id: data.usuario.id,
            name: resolvedName,
            email: data.usuario.email || email,
            cargo: data.usuario.cargo,
          },
        };
      } catch (e) {
        console.error("Erro ao parsear login response:", e);
        return { success: false };
      }
    }

    return {
      success: false,
    };
  } catch (error) {
    console.error("Erro ao fazer login após registro:", error);

    return {
      success: false,
    };
  }
}

// Validar CPF/Email unicidade (opcional - o backend valida no POST)
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/usuario/check-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });

    if (response.ok) {
      const text = await response.text();
      try {
        const data: { exists: boolean } = JSON.parse(text);
        return data.exists;
      } catch (e) {
        console.error("Erro ao parsear verificação de email:", e);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error("Erro ao verificar email:", error);
    return false;
  }
}

export async function checkCPFExists(cpf: string): Promise<boolean> {
  try {
    const apiUrl = getApiUrl();
    const cleaned = cpf.replace(/\D/g, "");

    const response = await fetch(`${apiUrl}/api/usuario/check-cpf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cpf: cleaned }),
    });

    if (response.ok) {
      const text = await response.text();
      try {
        const data: { exists: boolean } = JSON.parse(text);
        return data.exists;
      } catch (e) {
        console.error("Erro ao parsear verificação de CPF:", e);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error("Erro ao verificar CPF:", error);
    return false;
  }
}
