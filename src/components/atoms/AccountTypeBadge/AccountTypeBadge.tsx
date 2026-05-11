/**
 * @file AccountTypeBadge.tsx
 * @description Componente para exibir tipo de conta em card colorido
 */

'use client';

import { motion } from 'framer-motion';
import { getAccountTypeConfig } from '@/lib/account-type.utils';

interface AccountTypeBadgeProps {
  cargo?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeConfig = {
  sm: {
    fontSize: 'var(--text-xs)',
    padding: 'var(--space-2) var(--space-3)',
    emoji: '1rem',
  },
  md: {
    fontSize: 'var(--text-sm)',
    padding: 'var(--space-3) var(--space-4)',
    emoji: '1.25rem',
  },
  lg: {
    fontSize: 'var(--text-sm)',
    padding: 'var(--space-4) var(--space-6)',
    emoji: '1.5rem',
  },
};

export function AccountTypeBadge({
  cargo,
  size = 'md',
  showLabel = true,
}: AccountTypeBadgeProps) {
  const config = getAccountTypeConfig(cargo);
  const sizes = sizeConfig[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: sizes.padding,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: 'var(--radius-md)',
        cursor: 'default',
      }}
    >
      {/* Emoji */}
      <span
        style={{
          fontSize: sizes.emoji,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <config.icon size={24} color={config.color} />
      </span>

      {showLabel && (
        <span
          style={{
            fontSize: sizes.fontSize,
            fontWeight: 600,
            color: config.color,
            whiteSpace: 'nowrap',
          }}
        >
          {config.label}
        </span>
      )}
    </motion.div>
  );
}
