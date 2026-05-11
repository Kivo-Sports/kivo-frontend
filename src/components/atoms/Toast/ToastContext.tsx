/**
 * @file ToastContext.tsx
 * @description Context para gerenciar notificações globais
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastType, title?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random()}`;

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 5000) => {
      const id = generateId();
      const toast: ToastMessage = { id, type, message, title, duration };

      setToasts((prev) => [...prev, toast]);

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message: string, title?: string, duration?: number) =>
      addToast(message, 'success', title, duration),
    [addToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) =>
      addToast(message, 'error', title, duration),
    [addToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) =>
      addToast(message, 'info', title, duration),
    [addToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) =>
      addToast(message, 'warning', title, duration),
    [addToast]
  );

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }

  return context;
}
