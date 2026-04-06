/**
 * @file admin.service.ts
 * @description Serviço para gerenciar admins (CRUD)
 */

export interface AdminData {
  id?: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone: string;
  dataNascimento: string;
  ativo?: boolean;
  criadoEm?: string;
  cargo?: string;
}

export interface CreateAdminPayload {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
  senha: string;
}

export interface EditAdminPayload {
  nome: string;
  email: string;
  telefone: string;
  dataNascimento: string;
}

export async function listarAdmins(token: string): Promise<{
  success: boolean;
  data?: AdminData[];
  error?: string;
}> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL não está configurada');
    }

    const response = await fetch(`${apiUrl}/api/usuario/administradores`, {
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
        data: Array.isArray(data) ? data : [],
      };
    } else {
      return {
        success: false,
        error: data.message || 'Erro ao listar admins',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
}

export async function criarAdmin(
  payload: CreateAdminPayload,
  token: string
): Promise<{
  success: boolean;
  data?: AdminData;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL não está configurada');
    }

    const response = await fetch(`${apiUrl}/api/usuario/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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
        error: data.message || 'Erro ao criar admin',
        fieldErrors: data.errors,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
}

export async function editarAdmin(
  id: string,
  payload: EditAdminPayload,
  token: string
): Promise<{
  success: boolean;
  data?: AdminData;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL não está configurada');
    }

    const response = await fetch(`${apiUrl}/api/usuario/admin/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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
        error: data.message || 'Erro ao editar admin',
        fieldErrors: data.errors,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
}

export async function ativarAdmin(
  id: string,
  token: string
): Promise<{
  success: boolean;
  data?: AdminData;
  error?: string;
}> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL não está configurada');
    }

    const response = await fetch(`${apiUrl}/api/usuario/${id}/reativar`, {
      method: 'PATCH',
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
        error: data.message || 'Erro ao ativar admin',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
}

export async function desativarAdmin(
  id: string,
  token: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL não está configurada');
    }

    const response = await fetch(`${apiUrl}/api/usuario/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        error: data.message || 'Erro ao desativar admin',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
}

//  Helper: Verificar se email existe
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL não está configurada');
    }

    const response = await fetch(`${apiUrl}/api/usuario/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

//  Helper: Verificar se CPF existe
export async function checkCPFExists(cpf: string): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL não está configurada');
    }

    const response = await fetch(`${apiUrl}/api/usuario/check-cpf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cpf }),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
