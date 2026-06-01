/**
 * @file EsporteCarrossel.tsx
 * @description Grade responsiva de esportes em "bolas" grandes — filtro nas telas de explorar.
 * Ocupa toda a largura, distribui as bolas e quebra em linhas conforme a quantidade de esportes
 * e o tamanho da tela. Valor "todos" = sem filtro.
 */

'use client';

import { motion } from 'framer-motion';
import { Icon as IconifyIcon } from '@iconify/react';
import { LayoutGrid } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';
import { useListarEsportesQuery } from '@/store/api/esporteApi';

interface EsporteCarrosselProps {
  value: string; // "todos" ou esporteId
  onChange: (value: string) => void;
}

export function EsporteCarrossel({ value, onChange }: EsporteCarrosselProps) {
  const { data: esportes = [], isLoading } = useListarEsportesQuery();
  const ativos = esportes.filter((e) => e.ativo);

  // Sem esportes cadastrados: não renderiza o carrossel.
  if (!isLoading && ativos.length === 0) return null;

  const itens = [{ id: 'todos', nome: 'Todos', icone: '' }, ...ativos];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        gap: 'var(--space-5) var(--space-4)',
        width: '100%',
        marginBottom: 'var(--space-6)',
      }}
    >
      {itens.map((item, index) => {
        const selecionado = item.id === value;
        const isTodos = item.id === 'todos';
        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3) }}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            title={item.nome}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              width: '84px',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selecionado
                  ? 'radial-gradient(circle at 30% 25%, rgba(0,230,118,0.4), rgba(0,230,118,0.08))'
                  : 'linear-gradient(150deg, rgba(30,30,30,0.95), rgba(14,14,14,0.95))',
                border: `2px solid ${selecionado ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.1)'}`,
                color: selecionado ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                boxShadow: selecionado
                  ? '0 10px 30px rgba(0,230,118,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 6px 18px rgba(0,0,0,0.35)',
                transition: 'border-color 0.2s, color 0.2s, box-shadow 0.2s, background 0.2s',
              }}
            >
              {isTodos ? (
                <Icon icon={LayoutGrid} size={30} />
              ) : (
                <IconifyIcon icon={item.icone} width={34} height={34} />
              )}
            </span>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: selecionado ? 700 : 500,
                color: selecionado ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
            >
              {item.nome}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
