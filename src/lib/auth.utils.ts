/**
 * @file auth.utils.ts
 * @description Utilitarios para autenticacao - validacoes e formacoes
 *
 * Funcoes auxiliares para:
 * - Deteccao de tipo de identificador (email vs CPF)
 * - Formatacao de CPF
 * - Validacoes de email, CPF e senha
 *
 * @author Kivo Sports - TCC
 */

export type IdentifierType = "email" | "cpf" | "invalid";

export function normalizeCargo(cargo?: string): string {
  if (!cargo) {
    return "";
  }

  return cargo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Trata PascalCase do backend (ex: "OrganizadorTime" → "Organizador-Time")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

export function isOrganizadorTime(cargo?: string): boolean {
  const cargoNormalizado = normalizeCargo(cargo);

  return cargoNormalizado === "organizador-time" || cargoNormalizado === "organizador-de-time";
}

export function isOrganizadorCampeonato(cargo?: string): boolean {
  const cargoNormalizado = normalizeCargo(cargo);

  return (
    cargoNormalizado === "organizador-campeonato" ||
    cargoNormalizado === "organizador-de-campeonato"
  );
}

/**
 * Detecta automaticamente o tipo de identificador
 * @param value - Valor do input
 * @returns "email" | "cpf" | "invalid"
 *
 * Logica:
 * - Se tem @: valida como email
 * - Se tem exatamente 11 digitos: detecta como CPF
 * - Caso contrario (menos de 11 digitos, sem @): invalido (permite digitacao livre)
 */
export function detectIdentifierType(value: string): IdentifierType {
  const cleaned = value.replace(/\D/g, "");
  const hasAtSymbol = value.includes("@");

  // Se tem @, tenta validar como email
  if (hasAtSymbol) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? "email" : "invalid";
  }

  // So detecta CPF quando tiver EXATAMENTE 11 digitos
  if (cleaned.length === 11 && /^\d+$/.test(cleaned)) {
    return "cpf";
  }

  // Qualquer outra coisa eh invalido (nao formata CPF, deixa digitar livremente)
  return "invalid";
}

/**
 * Formata CPF enquanto o usuario digita: 000.000.000-00
 * @param value - Valor nao-formatado
 * @returns CPF formatado
 */
export function formatCPFInput(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);

  return cleaned
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Valida se eh um CPF valido (11 digitos)
 * @param cpf - CPF para validar (formatado ou nao)
 * @returns true se valido
 */
export function isCPFValid(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  return cleaned.length === 11;
}

/**
 * Valida se eh um email valido
 * @param email - Email para validar
 * @returns true se valido
 */
export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se a senha tem minimo de caracteres
 * @param password - Senha para validar
 * @param minLength - Minimo de caracteres (padrao: 6)
 * @returns true se valido
 */
export function isPasswordValid(password: string, minLength: number = 6): boolean {
  return password.length >= minLength;
}

/**
 * Extrai o nome do usuario a partir do email ou CPF
 * @param identifier - Email ou CPF
 * @param type - Tipo do identificador
 * @returns Nome extraido
 */
export function extractUserName(identifier: string, type: IdentifierType): string {
  if (type === "email") {
    return identifier.split("@")[0];
  }

  if (type === "cpf") {
    const cleaned = identifier.replace(/\D/g, "");
    return `Usuario-${cleaned.slice(0, 3)}`;
  }

  return "Usuario";
}

/**
 * Gera um email mockado a partir de CPF
 * @param cpf - CPF do usuario
 * @returns Email mockado
 */
export function generateEmailFromCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  return `usuario${cleaned}@kivo.sports`;
}

/**
 * Determina a rota de dashboard baseado no cargo do usuario
 * @param cargo - Cargo/tipo de conta do usuario
 * @returns Rota de dashboard
 */
export function getRedirectPathAfterLogin(cargo?: string | null): string {
  if (!cargo) {
    return "/dashboard";
  }

  const cargoNormalizado = normalizeCargo(cargo);

  const routeMap: Record<string, string> = {
    "torcedor": "/dashboard",
    "organizador-time": "/organizador/times",
    "organizador-de-time": "/organizador/times",
    "organizador-campeonato": "/organizador/campeonatos",
    "organizador-de-campeonato": "/organizador/campeonatos",
    "administrador": "/dashboard",
  };

  return routeMap[cargoNormalizado] || "/dashboard";
}

/**
 * Determina a rota de home baseado no cargo do usuario
 * @param cargo - Cargo/tipo de conta do usuario
 * @returns Rota de home
 */
export function getHomeRoute(cargo?: string | null): string {
  if (!cargo) {
    return "/dashboard";
  }

  const cargoNormalizado = normalizeCargo(cargo);

  const homeRouteMap: Record<string, string> = {
    "torcedor": "/home/torcedor",
    "organizador-time": "/home/organizador-time",
    "organizador-de-time": "/home/organizador-time",
    "organizador-campeonato": "/home/organizador-campeonato",
    "administrador": "/home/admin",
  };

  return homeRouteMap[cargoNormalizado] || "/dashboard";
}
