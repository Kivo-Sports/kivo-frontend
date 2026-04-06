/**
 * @file account-type.utils.ts
 * @description Utilitários para tipos de conta com cores e labels
 */

export type AccountType = 'torcedor' | 'organizador-time' | 'organizador-campeonato' | 'admin' | 'Administrador' | 'Torcedor' | 'OrganizadorTime' | 'OrganizadorCampeonato';

export interface AccountTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
}

export const ACCOUNT_TYPE_CONFIG: Record<string, AccountTypeConfig> = {
  torcedor: {
    label: 'Torcedor',
    color: '#00E676',
    bgColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: 'rgba(0, 230, 118, 0.3)',
    emoji: '⚽',
  },
  Torcedor: {
    label: 'Torcedor',
    color: '#00E676',
    bgColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: 'rgba(0, 230, 118, 0.3)',
    emoji: '⚽',
  },
  'organizador-time': {
    label: 'Organizador de Time',
    color: '#00BFA5',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgba(0, 191, 165, 0.3)',
    emoji: '🏟️',
  },
  OrganizadorTime: {
    label: 'Organizador de Time',
    color: '#00BFA5',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgba(0, 191, 165, 0.3)',
    emoji: '🏟️',
  },
  'organizador-campeonato': {
    label: 'Organizador de Campeonato',
    color: '#FFB300',
    bgColor: 'rgba(255, 179, 0, 0.1)',
    borderColor: 'rgba(255, 179, 0, 0.3)',
    emoji: '🏆',
  },
  OrganizadorCampeonato: {
    label: 'Organizador de Campeonato',
    color: '#FFB300',
    bgColor: 'rgba(255, 179, 0, 0.1)',
    borderColor: 'rgba(255, 179, 0, 0.3)',
    emoji: '🏆',
  },
  admin: {
    label: 'Administrador',
    color: '#FFD700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    emoji: '👑',
  },
  Administrador: {
    label: 'Administrador',
    color: '#FFD700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    emoji: '👑',
  },
};

export function getAccountTypeConfig(cargo?: string | null): AccountTypeConfig {
  const type = cargo as AccountType;
  return ACCOUNT_TYPE_CONFIG[type] || ACCOUNT_TYPE_CONFIG.torcedor;
}

export function getAccountTypeLabel(cargo?: string | null): string {
  return getAccountTypeConfig(cargo).label;
}

export function getAccountTypeColor(cargo?: string | null): string {
  return getAccountTypeConfig(cargo).color;
}
