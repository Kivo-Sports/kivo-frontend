/**
 * @file EsporteFilterSelect.tsx
 * @description Dropdown compacto e estilizado para filtrar por esporte (com ícone). Inclui "Todos".
 * Valor especial "todos" = sem filtro.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as IconifyIcon } from '@iconify/react';
import { ChevronDown, Check, Layers } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';
import { useListarEsportesQuery } from '@/store/api/esporteApi';

interface EsporteFilterSelectProps {
  value: string; // "todos" ou esporteId
  onChange: (value: string) => void;
}

export function EsporteFilterSelect({ value, onChange }: EsporteFilterSelectProps) {
  const { data: esportes = [] } = useListarEsportesQuery();
  const [aberto, setAberto] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const ativos = esportes.filter((e) => e.ativo || e.id === value);
  const selecionado = esportes.find((e) => e.id === value);
  const filtrando = value !== 'todos';

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    if (aberto) document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [aberto]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        title="Filtrar por esporte"
        style={{
          width: '100%',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          padding: '0 var(--space-2)',
          borderRadius: 'var(--radius-md)',
          background: filtrando ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${filtrando ? 'rgba(0,230,118,0.35)' : 'rgba(255,255,255,0.08)'}`,
          color: filtrando ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {selecionado ? (
            <IconifyIcon icon={selecionado.icone} width={15} height={15} style={{ flexShrink: 0 }} />
          ) : (
            <Icon icon={Layers} size={13} style={{ flexShrink: 0 }} />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selecionado ? selecionado.nome : 'Todos os esportes'}
          </span>
        </span>
        <Icon
          icon={ChevronDown}
          size={14}
          style={{ flexShrink: 0, transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      <AnimatePresence>
        {aberto && (
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
              zIndex: 60,
              listStyle: 'none',
              margin: 0,
              padding: 'var(--space-1)',
              maxHeight: '240px',
              overflowY: 'auto',
              background: 'rgba(18,18,18,0.99)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,230,118,0.25)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            {[{ id: 'todos', nome: 'Todos os esportes', icone: '' }, ...ativos].map((opt) => {
              const sel = opt.id === value;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt.id); setAberto(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: sel ? 'rgba(0,230,118,0.1)' : 'transparent',
                      color: sel ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                      {opt.id === 'todos' ? (
                        <Icon icon={Layers} size={14} style={{ flexShrink: 0 }} />
                      ) : (
                        <IconifyIcon icon={opt.icone} width={16} height={16} style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.nome}</span>
                    </span>
                    {sel && <Icon icon={Check} size={13} style={{ flexShrink: 0 }} />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
