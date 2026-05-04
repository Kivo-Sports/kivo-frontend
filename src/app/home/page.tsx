'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/templates/AppLayout';
import { Icon } from '@/components/atoms/Icon';
import { ChevronLeft, ChevronRight, Trophy, Users, BarChart2 } from 'lucide-react';

/* ─── Constantes ─────────────────────────────────────────── */

const SLIDE_DURATION = 7000;
const ACCENT = '#00e676';
const GLOW   = 'rgba(0,230,118,0.18)';
const GRAD   = 'radial-gradient(ellipse 80% 80% at 80% 50%, rgba(0,230,118,0.10) 0%, transparent 70%)';

const SLIDES = [
  { label: 'Plataforma',  image: '/carrosselHome/EstádioFaKIVO.png',           title: 'Sua plataforma de campeonatos',      subtitle: 'Gerencie, acompanhe e participe de campeonatos amadores e semiprofissionais.' },
  { label: 'Organização', image: '/carrosselHome/ArenaDeBasqueteKivo.png',      title: 'Crie e organize campeonatos',         subtitle: 'Ferramentas completas para organizadores: tabelas, chaves, resultados e inscrições.' },
  { label: 'Times',       image: '/carrosselHome/CampoDeTennisKIVO.png',        title: 'Monte e gerencie seu time',           subtitle: 'Reúna jogadores, defina escalações e inscreva seu time nos melhores campeonatos.' },
  { label: 'Resultados',  image: '/carrosselHome/QuadraDeBeachTennisKivo.png',  title: 'Placares e resultados', subtitle: 'Classificações e estatísticas atualizadas para acompanhar cada partida.' },
];

const FEATURES = [
  { icon: Trophy,    title: 'Organizar',  desc: 'Crie campeonatos completos'  },
  { icon: Users,     title: 'Competir',   desc: 'Participe com seu time'      },
  { icon: BarChart2, title: 'Acompanhar', desc: 'Resultados'    },
];

/* ─── Componente ─────────────────────────────────────────── */

export default function HomePage() {
  const [slide,    setSlide]    = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const next = useCallback(() => setSlide((p) => (p + 1) % SLIDES.length), []);
  const prev = useCallback(() => setSlide((p) => (p - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [paused, next]);

  const s      = SLIDES[slide];
  const padNum = (n: number) => String(n + 1).padStart(2, '0');

  const slideHeight = isMobile ? 260 : undefined;

  return (
    <AppLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

        {/* ── CARROSSEL HERO ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: isMobile ? 'var(--space-5)' : 'var(--space-8)', position: 'relative' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            style={{
              borderRadius: isMobile ? '16px' : '24px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              background: '#0d0d0d',
              position: 'relative',
              boxShadow: `0 0 60px ${GLOW}, 0 16px 40px rgba(0,0,0,0.5)`,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'relative',
                  height: slideHeight ?? 'clamp(300px, 44vw, 480px)',
                  overflow: 'hidden',
                }}
              >
                {/* Imagem de fundo do slide */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                  <Image
                    src={s.image}
                    alt=""
                    aria-hidden
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    priority
                  />
                </div>

                {/* Radial glow */}
                <div style={{ position: 'absolute', inset: 0, background: GRAD, pointerEvents: 'none' }} />

                {/* Gradiente escuro inferior */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: isMobile
                      ? 'linear-gradient(to top, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.30) 50%, rgba(10,10,10,0.00) 100%)'
                      : 'linear-gradient(to top, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.25) 45%, rgba(10,10,10,0.00) 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Contador de slides — topo direito */}
                <div
                  style={{
                    position: 'absolute',
                    top: isMobile ? '14px' : '24px',
                    right: isMobile ? '16px' : '28px',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '4px',
                    zIndex: 2,
                  }}
                >
                  <span style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 800, color: 'white', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {padNum(slide)}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                    / {padNum(SLIDES.length - 1)}
                  </span>
                </div>

                {/* Texto — canto inferior esquerdo */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: isMobile ? '24px' : '40px',
                    left:  isMobile ? '20px' : 'clamp(24px, 5vw, 56px)',
                    right: isMobile ? '20px' : 'clamp(60px, 10vw, 120px)',
                    zIndex: 2,
                  }}
                >
                  {/* Eyebrow */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: isMobile ? '4px 12px' : '5px 16px',
                      borderRadius: '100px',
                      background: `${ACCENT}40`,
                      border: `1px solid ${ACCENT}`,
                      color: ACCENT,
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      marginBottom: isMobile ? '10px' : '14px',
                      boxShadow: `0 0 12px ${ACCENT}30`,
                    }}
                  >
                    <Icon icon={Trophy} size={10} />
                    {s.label}
                  </div>

                  {/* Título */}
                  <h1
                    style={{
                      fontSize: isMobile ? '1.6rem' : 'clamp(2rem, 5vw, 3rem)',
                      fontWeight: 900,
                      color: '#ffffff',
                      margin: '0 0 12px 0',
                      lineHeight: 1.2,
                      letterSpacing: '-0.01em',
                      textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)',
                    }}
                  >
                    {s.title}
                  </h1>

                  {/* Subtítulo */}
                  {!isMobile && (
                    <p style={{ fontSize: 'clamp(13px, 1.6vw, 15px)', color: 'rgba(255,255,255,0.95)', margin: 0, lineHeight: 1.65, maxWidth: '480px', textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
                      {s.subtitle}
                    </p>
                  )}
                  {isMobile && (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.95)', margin: 0, lineHeight: 1.55, textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
                      {s.subtitle}
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Barra de progresso */}
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
              <div
                key={`${slide}-${paused}`}
                style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  background: ACCENT,
                  animation: paused ? 'none' : `kivo-progress ${SLIDE_DURATION}ms linear`,
                  width: paused ? '0%' : undefined,
                }}
              />
            </div>

            {/* Setas — apenas desktop */}
            {!isMobile && (['left', 'right'] as const).map((side) => (
              <button
                key={side}
                onClick={side === 'left' ? prev : next}
                aria-label={side === 'left' ? 'Slide anterior' : 'Próximo slide'}
                style={{
                  position: 'absolute',
                  [side]: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.50)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(8px)',
                  color: 'rgba(255,255,255,0.80)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  padding: 0,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.80)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${ACCENT}60`;
                  (e.currentTarget as HTMLButtonElement).style.color = ACCENT;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.50)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.10)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.80)';
                }}
              >
                <Icon icon={side === 'left' ? ChevronLeft : ChevronRight} size={18} />
              </button>
            ))}
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: isMobile ? '10px' : '14px' }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width:  i === slide ? (isMobile ? '24px' : '32px') : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background: i === slide ? ACCENT : 'rgba(255,255,255,0.14)',
                  transition: 'all 0.35s ease',
                  boxShadow: i === slide ? `0 0 8px ${ACCENT}88` : 'none',
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* ── FEATURE STRIP ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          style={{ marginBottom: isMobile ? 'var(--space-6)' : 'var(--space-10)' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
            }}
          >
            {FEATURES.map((feat, i) => (
              <div
                key={feat.title}
                style={{
                  padding: isMobile ? '16px 20px' : 'clamp(20px, 3vw, 28px) clamp(16px, 3vw, 28px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  borderRight: !isMobile && i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  borderBottom: isMobile && i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  transition: 'background 0.25s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,230,118,0.04)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(0,230,118,0.10)',
                    border: '1px solid rgba(0,230,118,0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-brand-primary)',
                    flexShrink: 0,
                  }}
                >
                  <Icon icon={feat.icon} size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>
                    {feat.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.3 }}>
                    {feat.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      <style>{`
        @keyframes kivo-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </AppLayout>
  );
}
