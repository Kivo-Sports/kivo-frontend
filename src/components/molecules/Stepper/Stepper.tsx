/**
 * @file Stepper.tsx
 * @description Componente de indicador de progresso para formulário multi-step
 *
 * Funcionalidades:
 * - Mostra progresso visual do passo atual
 * - Indica passos completados
 * - Navegação interativa entre passos
 * - Responsivo mobile/desktop
 *
 * @author Kivo Sports - TCC
 */

'use client';

import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface StepperStep {
  numero: number;
  titulo: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
  disabled?: boolean;
}

export function Stepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  disabled = false,
}: StepperProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        width: '100%',
      }}
    >
      {/* Progress Bar Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          width: '100%',
          paddingBottom: 'var(--space-1)',
        }}
      >
        {steps.map((step, index) => (
          <div key={step.numero} style={{ display: 'flex', alignItems: 'center', flex: index < steps.length - 1 ? 1 : 'none' }}>
            {/* Step Circle */}
            <StepCircle
              step={step}
              isCurrent={currentStep === step.numero}
              isCompleted={completedSteps.includes(step.numero)}
              isClickable={!disabled && onStepClick !== undefined}
              onClick={() => {
                if (!disabled && onStepClick && completedSteps.includes(step.numero)) {
                  onStepClick(step.numero);
                }
              }}
            />

            {/* Connector Line (não mostrar após o último step) */}
            {index < steps.length - 1 && (
              <StepConnector
                isCompleted={completedSteps.includes(step.numero)}
                isCurrent={currentStep === step.numero}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ============================= STEP CIRCLE ================================
// ============================================================================

interface StepCircleProps {
  step: StepperStep;
  isCurrent: boolean;
  isCompleted: boolean;
  isClickable: boolean;
  onClick?: () => void;
}

function StepCircle({
  step,
  isCurrent,
  isCompleted,
  isClickable,
  onClick,
}: StepCircleProps) {
  const baseStyle: CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    flexShrink: 0,
    position: 'relative',
    cursor: isClickable ? 'pointer' : 'default',
  };

  let backgroundColor: string;
  let borderColor: string;
  let textColor: string;

  if (isCompleted) {
    backgroundColor = 'var(--color-brand-primary)';
    borderColor = 'var(--color-brand-primary)';
    textColor = 'white';
  } else if (isCurrent) {
    backgroundColor = 'var(--color-brand-secondary)';
    borderColor = 'var(--color-brand-secondary)';
    textColor = 'white';
  } else {
    backgroundColor = 'transparent';
    borderColor = 'var(--color-border-default)';
    textColor = 'var(--color-text-muted)';
  }

  const hoverStyle: CSSProperties =
    isClickable && isCompleted
      ? {
          backgroundColor: 'var(--color-brand-primary)',
          borderColor: 'var(--color-brand-primary)',
          transform: 'scale(1.1)',
        }
      : {};

  return (
    <motion.div
      whileHover={isClickable && isCompleted ? { scale: 1.1 } : undefined}
      whileTap={isClickable && isCompleted ? { scale: 0.95 } : undefined}
      onClick={onClick}
      style={{
        ...baseStyle,
        backgroundColor,
        border: `2px solid ${borderColor}`,
        color: textColor,
      }}
      title={`${step.titulo} (Passo ${step.numero})`}
    >
      {isCompleted ? (
        <span style={{ fontSize: 'var(--text-lg)' }}>✓</span>
      ) : (
        step.numero
      )}
    </motion.div>
  );
}

// ============================================================================
// ============================= STEP CONNECTOR =============================
// ============================================================================

interface StepConnectorProps {
  isCompleted: boolean;
  isCurrent: boolean;
}

function StepConnector({ isCompleted, isCurrent }: StepConnectorProps) {
  const backgroundColor = isCompleted
    ? 'var(--color-brand-primary)'
    : 'var(--color-border-default)';

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      style={{
        flex: 1,
        height: 2,
        backgroundColor,
        transformOrigin: 'left',
      }}
    />
  );
}
