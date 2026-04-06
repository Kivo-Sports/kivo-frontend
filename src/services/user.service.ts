/**
 * @file user.service.ts
 * @description Serviço para gerenciar dados do usuário (buscar, atualizar)
 */

export interface UsuarioData {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  dataNascimento?: string;
  telefone?: string;
  endereco?: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  dadosBancarios?: {
    banco: string;
    agencia: string;
    conta: string;
    tipoConta: string;
    nomeTitular: string;
    cpfTitular: string;
  };
  cargo?: string;
}

const getApiUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL não está configurada');
  }
  return baseUrl;
};

/**
 * Busca dados completos do usuário
 */
export async function buscarDadosUsuario(
  usuarioId: string,
  token: string
): Promise<{
  success: boolean;
  data?: UsuarioData;
  error?: string;
}> {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/Usuario/${usuarioId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        success: true,
        data,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Erro ao buscar dados do usuário',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
}

/**
 * Atualiza dados do usuário baseado no tipo de cargo
 * Detecta automaticamente a rota correta
 */
export async function atualizarDadosUsuario(
  usuarioId: string,
  cargo: string | undefined,
  dados: Partial<UsuarioData>,
  token: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const apiUrl = getApiUrl();

    // Determinar rota baseada no cargo
    let rota = '/api/Usuario/torcedor'; // default
    if (cargo === 'organizador-time') {
      rota = '/api/Usuario/organizador-time';
    } else if (cargo === 'organizador-campeonato') {
      rota = '/api/Usuario/organizador-campeonato';
    } else if (cargo === 'admin') {
      rota = '/api/Usuario/admin';
    }

    const response = await fetch(`${apiUrl}${rota}/${usuarioId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(dados),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        success: true,
        message: data.message || 'Dados atualizados com sucesso',
      };
    } else {
      return {
        success: false,
        error: data.message || 'Erro ao atualizar dados',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
}
