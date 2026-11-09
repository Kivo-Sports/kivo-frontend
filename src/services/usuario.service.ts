export const cargosUsuario = [
  { value: 1, nome: "Administrador", label: "Administrador" },
  { value: 2, nome: "Torcedor", label: "Torcedor" },
  { value: 3, nome: "OrganizadorTime", label: "Organizador de time" },
  { value: 4, nome: "OrganizadorCampeonato", label: "Organizador de campeonato" },
] as const;
export interface UsuarioGestao {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  situacao: "ativo" | "inativo" | "bloqueado" | "excluido";
  possuiEndereco: boolean;
  possuiContaBanco: boolean;
}
export interface UsuariosPagina {
  items: UsuarioGestao[];
  total: number;
  page: number;
  pageSize: number;
}
export class UsuarioGestaoErro extends Error {
  constructor(
    message: string,
    public code?: string,
    public impedimentos?: { times?: string[]; campeonatos?: string[] },
  ) {
    super(message);
  }
}

// Fetch services and RTK Query share the same logout path through the root auth hook.
export function tratarSessaoInvalida(response: Response, token: string) {
  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    localStorage.getItem("auth_token") === token
  ) {
    window.dispatchEvent(new Event("kivo:session-invalid"));
  }
}
export async function usuarioRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuario${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  tratarSessaoInvalida(response, token);
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new UsuarioGestaoErro(
      data?.message ?? "Não foi possível concluir a solicitação.",
      data?.code,
      data?.impedimentos,
    );
  return data as T;
}
export const listarUsuarios = (token: string, filtros: URLSearchParams, signal?: AbortSignal) =>
  usuarioRequest<UsuariosPagina>(`/gestao?${filtros}`, token, { signal });
export const alterarEstadoUsuario = (token: string, id: string, acao: string) =>
  usuarioRequest<void>(`/${id}/gestao`, token, { method: "PATCH", body: JSON.stringify({ acao }) });
export const alterarCargoUsuario = (
  token: string,
  id: string,
  cargo: number,
  dadosPerfil?: unknown,
) =>
  usuarioRequest<void>(`/${id}/cargo`, token, {
    method: "PATCH",
    body: JSON.stringify({ cargo, dadosPerfil }),
  });
