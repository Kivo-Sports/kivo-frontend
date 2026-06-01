/**
 * @file EsporteFormModal.tsx
 * @description Modal para criar/editar esporte. Grade de ícones (Iconify) embutida + toggle de status.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon as IconifyIcon } from '@iconify/react';
import { Search, X } from 'lucide-react';
import { useToast } from '@/components/atoms/Toast';
import { Card } from '@/components/molecules/Card/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';
import { SPORT_ICONS } from '@/lib/sportIcons';
import {
  useCriarEsporteMutation,
  useEditarEsporteMutation,
} from '@/store/api/esporteApi';
import type { EsporteResponse } from '@/types/esporte';

interface EsporteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  esporte?: EsporteResponse;
}

export function EsporteFormModal({ isOpen, onClose, esporte }: EsporteFormModalProps) {
  const { success: toastSuccess, error: toastError } = useToast();
  const isEditMode = !!esporte;

  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [busca, setBusca] = useState('');
  const [erroNome, setErroNome] = useState<string | undefined>();
  const [erroIcone, setErroIcone] = useState<string | undefined>();

  const [criarEsporte, { isLoading: isCreating }] = useCriarEsporteMutation();
  const [editarEsporte, { isLoading: isEditing }] = useEditarEsporteMutation();
  const isLoading = isCreating || isEditing;

  useEffect(() => {
    if (isOpen) {
      setNome(esporte?.nome ?? '');
      setIcone(esporte?.icone ?? '');
      setAtivo(esporte?.ativo ?? true);
      setBusca('');
      setErroNome(undefined);
      setErroIcone(undefined);
    }
  }, [isOpen, esporte]);

  const iconesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return SPORT_ICONS;
    return SPORT_ICONS.filter(
      (i) =>
        i.label.toLowerCase().includes(termo) ||
        i.keywords.toLowerCase().includes(termo) ||
        i.name.toLowerCase().includes(termo)
    );
  }, [busca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let valido = true;
    if (!nome.trim()) { setErroNome('Nome é obrigatório'); valido = false; }
    if (!icone) { setErroIcone('Selecione um ícone'); valido = false; }
    if (!valido) return;

    try {
      if (isEditMode) {
        await editarEsporte({ id: esporte!.id, nome: nome.trim(), icone, ativo }).unwrap();
        toastSuccess('Esporte atualizado com sucesso');
      } else {
        await criarEsporte({ nome: nome.trim(), icone }).unwrap();
        toastSuccess('Esporte criado com sucesso');
      }
      onClose();
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'data' in error
          ? ((error as { data?: { message?: string } }).data?.message ?? 'Erro ao salvar esporte')
          : 'Erro ao salvar esporte';
      toastError(msg);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            padding: 'var(--space-4)',
          }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '520px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
          >
            <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}>
              {/* Cabeçalho */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div
                    style={{
                      width: '44px', height: '44px', flexShrink: 0,
                      borderRadius: 'var(--radius-lg)',
                      border: `1px solid ${erroIcone ? 'var(--color-feedback-danger)' : 'rgba(0,230,118,0.25)'}`,
                      background: 'rgba(0,230,118,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-brand-primary)',
                    }}
                  >
                    {icone ? <IconifyIcon icon={icone} width={26} height={26} /> : <span style={{ color: 'var(--color-text-muted)' }}>?</span>}
                  </div>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                    {isEditMode ? 'Editar Esporte' : 'Novo Esporte'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}
                >
                  <Icon icon={X} size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflow: 'hidden', flex: 1 }}>
                <Input
                  label="Nome do esporte"
                  name="nome"
                  type="text"
                  placeholder="ex: Basquete"
                  value={nome}
                  onChange={(e) => { setNome(e.target.value); setErroNome(undefined); }}
                  error={erroNome}
                  disabled={isLoading}
                />

                {/* Toggle de status (somente edição) */}
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setAtivo((v) => !v)}
                    disabled={isLoading}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: `1px solid ${ativo ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      background: ativo ? 'rgba(0,230,118,0.06)' : 'rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{ textAlign: 'left' }}>
                      <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: ativo ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)' }}>
                        {ativo ? 'Esporte ativo' : 'Esporte inativo'}
                      </span>
                      <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {ativo ? 'Disponível para seleção em times e campeonatos.' : 'Não aparece nas listas de seleção.'}
                      </span>
                    </span>
                    {/* Switch */}
                    <span
                      aria-hidden
                      style={{
                        position: 'relative', flexShrink: 0,
                        width: '46px', height: '26px',
                        borderRadius: 'var(--radius-full)',
                        background: ativo ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.15)',
                        transition: 'background 0.2s',
                      }}
                    >
                      <motion.span
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                        style={{
                          position: 'absolute', top: '3px', left: ativo ? '23px' : '3px',
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: ativo ? '#0a0a0a' : 'white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }}
                      />
                    </span>
                  </button>
                )}

                {/* Seletor de ícone embutido */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <label className="inline-block text-sm font-semibold text-(--color-text-primary)">Ícone</label>
                    {erroIcone && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-feedback-danger)' }}>{erroIcone}</span>
                    )}
                  </div>

                  {/* Busca */}
                  <div style={{ position: 'relative', marginBottom: 'var(--space-2)' }}>
                    <Icon icon={Search} size={14} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Buscar (ex: basquete, tênis, corrida)..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      disabled={isLoading}
                      style={{ width: '100%', padding: 'var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 22px)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', color: 'white', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Grade rolável */}
                  <div
                    style={{
                      flex: 1,
                      minHeight: '160px',
                      maxHeight: '240px',
                      overflowY: 'auto',
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${erroIcone ? 'var(--color-feedback-danger)' : 'rgba(255,255,255,0.08)'}`,
                      background: 'rgba(0,0,0,0.2)',
                    }}
                  >
                    {iconesFiltrados.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-5)', fontSize: 'var(--text-sm)', margin: 0 }}>
                        Nenhum ícone encontrado.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 'var(--space-2)' }}>
                        {iconesFiltrados.map((item) => {
                          const selecionado = item.name === icone;
                          return (
                            <button
                              key={item.name}
                              type="button"
                              title={item.label}
                              onClick={() => { setIcone(item.name); setErroIcone(undefined); }}
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                padding: 'var(--space-2)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                background: selecionado ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${selecionado ? 'rgba(0,230,118,0.5)' : 'rgba(255,255,255,0.06)'}`,
                                color: selecionado ? 'var(--color-brand-primary)' : 'white',
                                transition: 'all 0.12s',
                              }}
                              onMouseEnter={(e) => { if (!selecionado) e.currentTarget.style.background = 'rgba(0,230,118,0.06)'; }}
                              onMouseLeave={(e) => { if (!selecionado) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                            >
                              <IconifyIcon icon={item.name} width={26} height={26} />
                              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexShrink: 0 }}>
                  <Button variant="secondary" onClick={onClose} disabled={isLoading} fullWidth type="button">
                    Cancelar
                  </Button>
                  <Button variant="primary" type="submit" loading={isLoading} fullWidth>
                    {isEditMode ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
