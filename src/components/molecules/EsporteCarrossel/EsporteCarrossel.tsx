/**
 * @file EsporteCarrossel.tsx
 * @description Carrossel horizontal de esportes em "bolas" — filtro nas telas de explorar.
 * Linha única que rola para o lado (com setas) quando não cabe na tela. Valor "todos" = sem filtro.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon as IconifyIcon } from '@iconify/react';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';
import { useListarEsportesQuery } from '@/store/api/esporteApi';

interface EsporteCarrosselProps {
  value: string; // "todos" ou esporteId
  onChange: (value: string) => void;
}

export function EsporteCarrossel({ value, onChange }: EsporteCarrosselProps) {
  const { data: esportes = [], isLoading } = useListarEsportesQuery();
  const ativos = esportes.filter((e) => e.ativo);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [podeEsquerda, setPodeEsquerda] = useState(false);
  const [podeDireita, setPodeDireita] = useState(false);
  const [temOverflow, setTemOverflow] = useState(false);

  const atualizarSetas = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 4;
    setTemOverflow(overflow);
    setPodeEsquerda(el.scrollLeft > 4);
    setPodeDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    atualizarSetas();
    // Recheca após o layout assentar (ícones/fontes) para detectar overflow corretamente.
    const raf = requestAnimationFrame(atualizarSetas);
    const timer = setTimeout(atualizarSetas, 250);
    const el = scrollRef.current;
    if (!el) return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
    el.addEventListener('scroll', atualizarSetas, { passive: true });
    window.addEventListener('resize', atualizarSetas);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      el.removeEventListener('scroll', atualizarSetas);
      window.removeEventListener('resize', atualizarSetas);
    };
  }, [atualizarSetas, ativos.length, isLoading]);

  const rolar = (direcao: number) => {
    scrollRef.current?.scrollBy({ left: direcao * 280, behavior: 'smooth' });
  };

  // Sem esportes cadastrados: não renderiza o carrossel.
  if (!isLoading && ativos.length === 0) return null;

  const itens = [{ id: 'todos', nome: 'Todos', icone: '' }, ...ativos];

  const setaBtn = (ativa: boolean): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: ativa ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${ativa ? 'rgba(0,230,118,0.35)' : 'rgba(255,255,255,0.08)'}`,
    color: ativa ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
    cursor: ativa ? 'pointer' : 'default',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: 'var(--space-6)' }}>
      {/* Controles ‹ › no topo à direita (apenas quando há rolagem) */}
      {temOverflow && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <button type="button" aria-label="Rolar para a esquerda" onClick={() => rolar(-1)} disabled={!podeEsquerda} style={setaBtn(podeEsquerda)}>
            <Icon icon={ChevronLeft} size={18} />
          </button>
          <button type="button" aria-label="Rolar para a direita" onClick={() => rolar(1)} disabled={!podeDireita} style={setaBtn(podeDireita)}>
            <Icon icon={ChevronRight} size={18} />
          </button>
        </div>
      )}

      {/* Trilha rolável */}
      <div
        ref={scrollRef}
        data-esporte-track
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          justifyContent: temOverflow ? 'flex-start' : 'center',
          gap: 'var(--space-4)',
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          padding: 'var(--space-1) var(--space-2) var(--space-2)',
          scrollbarWidth: 'none',
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
                flexShrink: 0,
                scrollSnapAlign: 'start',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                width: '84px',
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

      <style>{`[data-esporte-track]::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
