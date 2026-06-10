/**
 * @file EsporteSelect.tsx
 * @description Select personalizado de esporte (com ícone) populado pelos esportes ativos.
 * Componente controlado: recebe `value` (esporteId) e `onChange`.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as IconifyIcon } from '@iconify/react';
import { ChevronDown, Check } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';
import { useListarEsportesQuery } from '@/store/api/esporteApi';

interface EsporteSelectProps {
  label?: string;
  value?: string;
  onChange: (esporteId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function EsporteSelect({ label = 'Esporte', value, onChange, error, disabled }: EsporteSelectProps) {
  const { data: esportes = [], isLoading } = useListarEsportesQuery();
  const [aberto, setAberto] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const disponiveis = esportes.filter((e) => e.ativo);
  const selecionado = esportes.find((e) => e.id === value);

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    if (aberto) document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [aberto]);

  const placeholder = isLoading
    ? 'Carregando esportes...'
    : disponiveis.length === 0
      ? 'Nenhum esporte disponível'
      : 'Selecione o esporte';

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <label className="mb-2 inline-block text-sm font-semibold text-(--color-text-primary)">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled || isLoading || disponiveis.length === 0}
        onClick={() => setAberto((v) => !v)}
        aria-invalid={Boolean(error)}
        style={{
          height: '3rem',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--color-feedback-danger)' : 'var(--color-border-default)'}`,
          background: 'var(--color-bg-input)',
          padding: '0 var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          cursor: disabled || isLoading || disponiveis.length === 0 ? 'not-allowed' : 'pointer',
          color: selecionado ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
          {selecionado && (
            <span style={{ color: 'var(--color-brand-primary)', display: 'inline-flex' }}>
              <IconifyIcon icon={selecionado.icone} width={20} height={20} />
            </span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selecionado ? selecionado.nome : placeholder}
          </span>
        </span>
        <Icon icon={ChevronDown} size={16} style={{ flexShrink: 0, color: 'var(--color-text-muted)', transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      <AnimatePresence>
        {aberto && disponiveis.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 50,
              listStyle: 'none',
              margin: 0,
              padding: 'var(--space-1)',
              maxHeight: '260px',
              overflowY: 'auto',
              background: 'rgba(20,20,20,0.99)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,230,118,0.25)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            {disponiveis.map((esporte) => {
              const ativoSel = esporte.id === value;
              return (
                <li key={esporte.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(esporte.id); setAberto(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: ativoSel ? 'rgba(0,230,118,0.1)' : 'transparent',
                      color: ativoSel ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { if (!ativoSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { if (!ativoSel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                      <span style={{ display: 'inline-flex', color: 'var(--color-brand-primary)' }}>
                        <IconifyIcon icon={esporte.icone} width={20} height={20} />
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{esporte.nome}</span>
                    </span>
                    {ativoSel && <Icon icon={Check} size={14} style={{ flexShrink: 0 }} />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" style={{ marginTop: 'var(--space-2)', marginBottom: 0, fontSize: 'var(--text-sm)', color: 'var(--color-feedback-danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
