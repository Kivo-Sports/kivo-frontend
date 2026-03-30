/**
 * @file FormSection.tsx
 * @description Componente de seção de formulário com accordion
 *
 * Funcionalidades:
 * - Expande/minimiza com animação suave
 * - Mostra checkmark quando completado
 * - Desabilita próximas seções se anterior não validada
 * - Animação de conteúdo
 *
 * @author Kivo Sports - TCC
 */

'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface FormSectionProps {
  stepNumber: number;
  title: string;
  description?: string;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onToggle: () => void;
  children: ReactNode;
  hasError?: boolean;
}

export function FormSection({
  stepNumber,
  title,
  description,
  isActive,
  isCompleted,
  isDisabled,
  onToggle,
  children,
  hasError = false,
}: FormSectionProps) {
  const handleToggle = () => {
    if (!isDisabled) {
      onToggle();
    }
  };

  const borderColor = hasError
    ? 'var(--color-feedback-danger)'
    : isActive
      ? 'var(--color-brand-primary)'
      : 'var(--color-border-default)';

  const isExpanded = isActive;

  const backgroundColor = isActive
    ? 'color-mix(in srgb, var(--color-brand-primary) 5%, transparent)'
    : 'transparent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={{
        border: `2px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        marginBottom: 'var(--space-3)',
        backgroundColor,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <motion.button
        type="button"
        onClick={handleToggle}
        disabled={isDisabled}
        style={{
          width: '100%',
          padding: 'var(--space-4)',
          background: 'transparent',
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          transition: 'background 0.2s ease',
        }}
        onHoverStart={(_, isHovering) => {
          if (!isDisabled && isHovering) {
            // Hover effect handled by styling
          }
        }}
        className="hover:bg-(--color-bg-elevated) transition-colors"
      >
        {/* Left: Step Circle + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
          {/* Step Circle */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              backgroundColor: isCompleted
                ? 'var(--color-brand-primary)'
                : isActive
                  ? 'var(--color-brand-secondary)'
                  : 'var(--color-border-default)',
              color: isCompleted || isActive ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {isCompleted ? '✓' : stepNumber}
          </div>

          {/* Title + Description */}
          <div style={{ textAlign: 'left' }}>
            <h3
              style={{
                margin: 0,
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: description ? 'var(--space-1)' : 0,
              }}
            >
              {title}
            </h3>

            {description && (
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 400,
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* Error Indicator */}
          {hasError && !isExpanded && (
            <span
              style={{
                fontSize: 'var(--text-lg)',
                color: 'var(--color-feedback-danger)',
              }}
            >
              !
            </span>
          )}

          {/* Expand/Collapse Icon */}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'inline-block',
              fontSize: 'var(--text-lg)',
              color: isDisabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            }}
          >
            ▼
          </motion.span>
        </div>
      </motion.button>

      {/* Content - Animated Collapse */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: 'var(--space-4)',
                paddingTop: 0,
                borderTop: '1px solid var(--color-border-default)',
                display: 'grid',
                gap: 'var(--space-4)',
              }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disabled Overlay Message */}
      {isDisabled && !isExpanded && (
        <div
          style={{
            padding: 'var(--space-3)',
            paddingTop: 0,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          Preencha as seções anteriores para continuar
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// ===== FORM SECTION GROUP - Contenedor para multiplas seções ===============
// ============================================================================

export interface FormSectionGroupProps {
  children: ReactNode;
}

export function FormSectionGroup({ children }: FormSectionGroupProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {children}
    </div>
  );
}
