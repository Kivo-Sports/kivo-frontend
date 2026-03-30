/**
 * @file auth.service.ts
 * @description Serviço para integração com API de autenticação (login)
 *
 * Responsabilidades:
 * - Fazer chamadas POST para endpoint de login
 * - Tratamento de erros da API
 * - Retornar token e usuário autenticado
 *
 * @author Kivo Sports - TCC
 */

import type { AuthenticatedUser } from '@/store/slices/authSlice';

export interface LoginResponse {
  token: string;
  usuario: AuthenticatedUser & {
    cpf?: string;
    cargo?: string;
    ativo?: boolean;
  };
}

export interface LoginErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// Construir URL da API
const getApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL não está configurada');
  }

  return baseUrl;
};

// Detectar tipo de erro para exibir notificação apropriada
const detectErrorType = (text: string): string => {
  const lower = text.toLowerCase();

  if (lower.includes('senha') && (lower.includes('incorreta') || lower.includes('inválid'))) {
    return 'password-incorrect';
  } else if (lower.includes('não encontrado') || lower.includes('não existe')) {
    return 'user-not-found';
  } else if (lower.includes('inválid') || lower.includes('incorreto')) {
    return 'invalid-credentials';
  } else if (lower.includes('desativ')) {
    return 'user-inactive';
  } else if (lower.includes('bloqueado') || lower.includes('suspenso')) {
    return 'user-blocked';
  }

  return 'generic-error';
};

// Obter mensagens estruturadas (título e descrição)
const getErrorMessages = (errorType: string, fallback: string): { title: string; message: string } => {
  const messages: Record<string, { title: string; message: string }> = {
    'password-incorrect': {
      title: 'Senha inválida',
      message: 'A senha fornecida está incorreta. Verifique e tente novamente'
    },
    'user-not-found': {
      title: 'Credenciais não encontradas',
      message: 'Email ou CPF não registrado em nossa base de dados. Verifique os dados ou crie uma conta'
    },
    'invalid-credentials': {
      title: 'Dados inválidos',
      message: 'Email/CPF ou senha incorretos. Por favor, verifique os dados informados'
    },
    'user-inactive': {
      title: 'Conta desativada',
      message: 'Sua conta foi desativada. Contate nosso suporte para mais informações'
    },
    'user-blocked': {
      title: 'Conta bloqueada',
      message: 'Sua conta está temporariamente bloqueada. Contate o suporte para resolver'
    },
    'generic-error': {
      title: 'Erro ao fazer login',
      message: 'Ocorreu um erro inesperado. Verifique sua conexão e tente novamente'
    },
  };

  return messages[errorType] || { title: fallback, message: 'Por favor, tente novamente' };
};

// Função principal de login
export async function loginUser(
  identifier: string,
  password: string
): Promise<{
  success: boolean;
  token?: string;
  user?: AuthenticatedUser;
  error?: string;
  errorTitle?: string;
  errorType?: string;
}> {
  try {
    const apiUrl = getApiUrl();

    // Limpar identifier: remover formatação de CPF, mas manter email intacto
    let cleanIdentifier = identifier.trim();

    // Se for CPF (contém só números e formatação de CPF), remove . e -
    const isCPF = /^[\d.\-]+$/.test(cleanIdentifier);
    if (isCPF) {
      cleanIdentifier = cleanIdentifier.replace(/[.\-]/g, '');
    }

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identificador: cleanIdentifier,
        senha: password,
      }),
    });

    const responseText = await response.text();

    if (process.env.NODE_ENV === 'development') {
      console.debug('[AUTH] Login response status:', response.status);
    }

    // Sucesso (200 OK)
    if (response.status === 200) {
      try {
        const data: LoginResponse = JSON.parse(responseText);

        // Extrair email do JWT se não vier no objeto usuario
        let email = data.usuario.email || '';
        if (!email && data.token) {
          try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            email = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '';
          } catch (e) {
            // Silenciosamente falha na extração do JWT
          }
        }

        return {
          success: true,
          token: data.token,
          user: {
            id: data.usuario.id,
            name: data.usuario.name,
            email,
            cargo: data.usuario.cargo,
          },
        };
      } catch (e) {
        console.error('Erro ao parsear login response:', e);
        return {
          success: false,
          error: 'Erro ao processar resposta do servidor',
        };
      }
    }

    // Erro (400, 401, 404, etc)
    if (response.status >= 400 && response.status < 500) {
      let errorData: LoginErrorResponse | null = null;

      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        errorData = null;
      }

      if (errorData && errorData.message) {
        const errorType = detectErrorType(errorData.message);
        const { title, message } = getErrorMessages(errorType, errorData.message);

        return {
          success: false,
          error: message,
          errorTitle: title,
          errorType,
        };
      } else {
        const errorType = detectErrorType(responseText);
        const { title, message } = getErrorMessages(errorType, responseText);

        return {
          success: false,
          error: message,
          errorTitle: title,
          errorType,
        };
      }
    }

    // Erro de servidor (5xx)
    return {
      success: false,
      error: `Erro de servidor (${response.status}). Tente novamente mais tarde.`,
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro de conexão. Verifique sua internet.',
    };
  }
}
