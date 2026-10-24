/**
 * @file EsporteFilterSelect.tsx
 * @description Dropdown compacto e estilizado para filtrar por esporte (com ícone). Inclui "Todos".
 * Valor especial "todos" = sem filtro.
 *
 * Acessibilidade (padrão botão + listbox): o botão expõe aria-haspopup/expanded/controls;
 * a lista recebe o foco e indica a opção ativa por aria-activedescendant.
 * Teclado: ↓/↑/Enter/Espaço abrem; ↓/↑/Home/End navegam; Enter/Espaço selecionam;
 * Escape fecha e devolve o foco ao botão; Tab fecha e segue a ordem normal.
 */

'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as IconifyIcon } from '@iconify/react';
import { ChevronDown, Check, Layers } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';
import { useListarEsportesQuery } from '@/store/api/esporteApi';

interface EsporteFilterSelectProps {
  value: string; // "todos" ou esporteId
  onChange: (value: string) => void;
}

const OPCAO_TODOS = { id: 'todos', nome: 'Todos os esportes', icone: '' };

export function EsporteFilterSelect({ value, onChange }: EsporteFilterSelectProps) {
  const { data: esportes = [], isLoading } = useListarEsportesQuery();
  const [aberto, setAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gatilhoRef = useRef<HTMLButtonElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const idBase = useId();
  const listaId = `${idBase}-lista`;
  const idOpcao = (id: string) => `${idBase}-opcao-${id}`;

  const ativos = esportes.filter((e) => e.ativo || e.id === value);
  const opcoes = [OPCAO_TODOS, ...ativos];
  const selecionado = esportes.find((e) => e.id === value);
  const filtrando = value !== 'todos';
  const rotuloAtual = selecionado ? selecionado.nome : OPCAO_TODOS.nome;

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };
    if (aberto) document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [aberto]);

  // Ao abrir, o foco vai para a lista (a opção ativa é anunciada via aria-activedescendant).
  useEffect(() => {
    if (aberto) listaRef.current?.focus();
  }, [aberto]);

  // Mantém a opção ativa visível em listas longas.
  useEffect(() => {
    if (!aberto) return;
    const elemento = document.getElementById(idOpcao(opcoes[indiceAtivo]?.id ?? ''));
    elemento?.scrollIntoView?.({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, indiceAtivo]);

  const abrir = () => {
    const indiceSelecionado = opcoes.findIndex((o) => o.id === value);
    setIndiceAtivo(indiceSelecionado >= 0 ? indiceSelecionado : 0);
    setAberto(true);
  };

  const fechar = (devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) gatilhoRef.current?.focus();
  };

  const selecionar = (id: string) => {
    onChange(id);
    fechar(true);
  };

  const onKeyDownGatilho = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      abrir();
    }
  };

  const onKeyDownLista = (event: KeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setIndiceAtivo((i) => Math.min(i + 1, opcoes.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setIndiceAtivo((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setIndiceAtivo(0);
        break;
      case 'End':
        event.preventDefault();
        setIndiceAtivo(opcoes.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (opcoes[indiceAtivo]) selecionar(opcoes[indiceAtivo].id);
        break;
      case 'Escape':
        event.preventDefault();
        fechar(true);
        break;
      case 'Tab':
        fechar(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <button
        ref={gatilhoRef}
        type="button"
        onClick={() => (aberto ? fechar(false) : abrir())}
        onKeyDown={onKeyDownGatilho}
        title="Filtrar por esporte"
        aria-label={`Filtrar por esporte: ${rotuloAtual}`}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? listaId : undefined}
        aria-busy={isLoading}
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
            {rotuloAtual}
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
            ref={listaRef}
            id={listaId}
            role="listbox"
            tabIndex={-1}
            aria-label="Esportes"
            aria-activedescendant={opcoes[indiceAtivo] ? idOpcao(opcoes[indiceAtivo].id) : undefined}
            onKeyDown={onKeyDownLista}
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
              outline: 'none',
            }}
          >
            {opcoes.map((opt, indice) => {
              const sel = opt.id === value;
              const ativo = indice === indiceAtivo;
              return (
                <li
                  key={opt.id}
                  id={idOpcao(opt.id)}
                  role="option"
                  aria-selected={sel}
                  onClick={() => selecionar(opt.id)}
                  onMouseEnter={() => setIndiceAtivo(indice)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    // Opção ativa (teclado/mouse) com contorno visível; selecionada em verde.
                    background: sel ? 'rgba(0,230,118,0.1)' : ativo ? 'rgba(255,255,255,0.07)' : 'transparent',
                    boxShadow: ativo ? 'inset 0 0 0 1px rgba(0,230,118,0.55)' : 'none',
                    color: sel ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                  }}
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
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
