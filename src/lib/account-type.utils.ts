/**
 * @file account-type.utils.ts
 * @description Utilitários para tipos de conta com cores e labels
 */

import { Medal, Users, Trophy, Crown , ClipboardList , Megaphone } from "lucide-react";
import React from "react";

export type AccountType = 'torcedor' | 'organizador-time' | 'organizador-campeonato' | 'admin' | 'Administrador' | 'Torcedor' | 'OrganizadorTime' | 'OrganizadorCampeonato';

export interface AccountTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export const ACCOUNT_TYPE_CONFIG: Record<string, AccountTypeConfig> = {
  torcedor: {
    label: 'Torcedor',
    color: '#00E676',
    bgColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: 'rgba(0, 230, 118, 0.3)',
    icon: Megaphone,
  },
  Torcedor: {
    label: 'Torcedor',
    color: '#00E676',
    bgColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: 'rgba(0, 230, 118, 0.3)',
    icon: Megaphone,
  },
  'organizador-time': {
    label: 'Organizador de Time',
    color: '#00BFA5',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgba(0, 191, 165, 0.3)',
    icon: Medal,
  },
  OrganizadorTime: {
    label: 'Organizador de Time',
    color: '#00BFA5',
    bgColor: 'rgba(0, 191, 165, 0.1)',
    borderColor: 'rgba(0, 191, 165, 0.3)',
    icon: Medal,
  },
  'organizador-campeonato': {
    label: 'Organizador de Campeonato',
    color: '#9900ff',
    bgColor: 'rgba(153, 0, 255, 0.1)',
    borderColor: 'rgba(153, 0, 255, 0.3)',
    icon: ClipboardList,
  },
  OrganizadorCampeonato: {
    label: 'Organizador de Campeonato',
    color: '#9900ff',
    bgColor: 'rgba(153, 0, 255, 0.1)',
    borderColor: 'rgba(153, 0, 255, 0.3)',
    icon: ClipboardList,
  },
  admin: {
    label: 'Administrador',
    color: '#FFD700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    icon: Crown,
  },
  Administrador: {
    label: 'Administrador',
    color: '#FFD700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    icon: Crown,
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

export function getAccountTypeIcon(cargo?: string | null): React.ComponentType<{ size?: number; color?: string }> {
  return getAccountTypeConfig(cargo).icon;
}
