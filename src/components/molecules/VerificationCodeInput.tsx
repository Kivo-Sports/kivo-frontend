'use client';

import React, { useRef, useEffect } from 'react';

interface VerificationCodeInputProps {
  code: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void; // Callback quando preencher todos os dígitos
  digitCount?: number; // Quantidade de dígitos (padrão: 6)
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
}

/**
 * Componente genérico para entrada de código de verificação
 * Reutilizável para: reativação de conta, redefinição de senha, 2FA, etc
 */
export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  code,
  onChange,
  onComplete,
  digitCount = 6,
  disabled = false,
  error,
  label,
  placeholder = '0',
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Dividir o código em dígitos
  const digits = code.split('').concat(Array(digitCount - code.length).fill(''));

  // Chamar onComplete quando preencher todos os dígitos
  useEffect(() => {
    if (onComplete && code.length === digitCount && /^\d+$/.test(code)) {
      onComplete(code);
    }
  }, [code, digitCount, onComplete]);

  const handleChange = (index: number, value: string) => {
    // Aceitar apenas números
    const numericValue = value.replace(/\D/g, '');

    if (numericValue.length > 1) {
      // Se colar múltiplos dígitos, distribuir entre os inputs
      const newCode = (code + numericValue).replace(/\D/g, '').slice(0, digitCount);
      onChange(newCode);
      // Focus no último preenchido
      setTimeout(() => {
        const targetIndex = Math.min(newCode.length, digitCount - 1);
        inputRefs.current[targetIndex]?.focus();
      }, 0);
    } else {
      // Input único
      const newCode = code.substring(0, index) + numericValue + code.substring(index + 1);
      onChange(newCode.slice(0, digitCount));

      // Auto-focus no próximo se digitou algo
      if (numericValue && index < digitCount - 1) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 0);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (code[index]) {
        // Remover dígito atual
        const newCode = code.substring(0, index) + code.substring(index + 1);
        onChange(newCode);
      } else if (index > 0) {
        // Ir pro anterior se tá vazio
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < digitCount - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digitCount);
    onChange(pastedText);
    // Focus no último dígito colado
    setTimeout(() => {
      const targetIndex = Math.min(pastedText.length, digitCount - 1);
      inputRefs.current[targetIndex]?.focus();
    }, 0);
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      {label && (
        <label
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          {label}
        </label>
      )}

      {/* Containers dos dígitos */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {Array.from({ length: digitCount }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder={placeholder}
            style={{
              width: '50px',
              height: '50px',
              fontSize: 'var(--text-lg)',
              fontWeight: 'bold',
              textAlign: 'center',
              border: `2px solid ${
                error
                  ? 'var(--color-feedback-danger)'
                  : 'var(--color-border-default)'
              }`,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              transition: 'all 0.2s ease',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.5 : 1,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = error
                ? 'var(--color-feedback-danger)'
                : 'var(--color-brand-primary)';
              e.target.style.boxShadow = `0 0 0 3px ${
                error
                  ? 'rgba(255, 107, 107, 0.1)'
                  : 'rgba(0, 230, 118, 0.1)'
              }`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error
                ? 'var(--color-feedback-danger)'
                : 'var(--color-border-default)';
              e.target.style.boxShadow = 'none';
            }}
          />
        ))}
      </div>

      {/* Mensagem de erro */}
      {error && (
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-feedback-danger)',
            marginTop: 'var(--space-1)',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}

      {/* Dica de uso */}
      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          marginTop: 'var(--space-1)',
        }}
      >
        Ou cole o código completo em qualquer campo
      </p>
    </div>
  );
};
