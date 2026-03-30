/**
 * @file Toast.tsx
 * @description Componente de notificação/toast reutilizável
 */

'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import type { CSSProperties } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, title, duration = 5000, onClose }: ToastProps) {
  const getStyles = () => {
    const baseStyle: CSSProperties = {
      padding: 'var(--space-4) var(--space-5)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
      fontSize: 'var(--text-sm)',
      display: 'flex',
      gap: 'var(--space-4)',
      alignItems: 'flex-start',
      minWidth: '320px',
      maxWidth: '420px',
      backdropFilter: 'blur(4px)',
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          background: 'rgba(0, 230, 118, 0.95)',
          color: '#000',
          border: '1px solid rgba(0, 230, 118, 0.6)',
        };
      case 'error':
        return {
          ...baseStyle,
          background: 'rgba(255, 23, 68, 0.95)',
          color: '#fff',
          border: '1px solid rgba(255, 23, 68, 0.6)',
        };
      case 'warning':
        return {
          ...baseStyle,
          background: 'rgba(255, 193, 7, 0.95)',
          color: '#000',
          border: '1px solid rgba(255, 193, 7, 0.6)',
        };
      case 'info':
      default:
        return {
          ...baseStyle,
          background: 'rgba(33, 150, 243, 0.95)',
          color: '#fff',
          border: '1px solid rgba(33, 150, 243, 0.6)',
        };
    }
  };

  // Auto-close após duration
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, y: -20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 400, y: -20 }}
      style={getStyles()}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {title && (
          <span
            style={{
              fontWeight: 700,
              fontSize: 'clamp(14px, 2vw, 16px)',
              lineHeight: '1.3',
              letterSpacing: '0.3px',
            }}
          >
            {title}
          </span>
        )}
        <span
          style={{
            fontSize: 'clamp(13px, 1.8vw, 15px)',
            lineHeight: '1.5',
            opacity: 0.95,
            fontWeight: 500,
          }}
        >
          {message}
        </span>
      </div>

      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: 'var(--text-xl)',
          padding: 0,
          flexShrink: 0,
          opacity: 0.6,
          transition: 'opacity 0.2s ease',
          lineHeight: 1,
          marginTop: '2px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
        }}
      >
        ×
      </button>
    </motion.div>
  );
}
