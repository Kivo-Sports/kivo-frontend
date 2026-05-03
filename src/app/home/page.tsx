'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/templates/AppLayout';
import { useAppSelector } from '@/store/hooks';
import { Icon } from '@/components/atoms/Icon';
import { ChevronLeft, ChevronRight, Trophy, Users, BarChart2 } from 'lucide-react';
import { SportImages, SPORT_IMAGE_SIZE, type SportKey } from '@/constants/sportImages';

/* ─── Dados ─────────────────────────────────────────────── */

const SLIDE_DURATION = 4800;

const ACCENT  = '#00e676';
const GLOW    = 'rgba(0,230,118,0.18)';
const GRAD    = 'radial-gradient(ellipse 80% 80% at 80% 50%, rgba(0,230,118,0.10) 0%, transparent 70%)';

const SLIDES = [
  {
    label:    'Plataforma',
    title:    'Sua plataforma de campeonatos',
    subtitle: 'Gerencie, acompanhe e participe de campeonatos amadores e semiprofissionais.',
  },
  {
    label:    'Organização',
    title:    'Crie e organize campeonatos',
    subtitle: 'Ferramentas completas para organizadores: tabelas, chaves, resultados e inscrições.',
  },
  {
    label:    'Times',
    title:    'Monte e gerencie seu time',
    subtitle: 'Reúna jogadores, defina escalações e inscreva seu time nos melhores campeonatos.',
  },
  {
    label:    'Resultados',
    title:    'Placares e resultados em tempo real',
    subtitle: 'Classificações e estatísticas atualizadas para acompanhar cada partida ao vivo.',
  },
];

const FEATURES = [
  { icon: Trophy,    title: 'Organizar',  desc: 'Crie campeonatos completos' },
  { icon: Users,     title: 'Competir',   desc: 'Participe com seu time'     },
  { icon: BarChart2, title: 'Acompanhar', desc: 'Resultados em tempo real'   },
];

interface Sport { name: string; key: SportKey }

const SPORTS: Sport[] = [
  { name: 'Futebol',        key: 'futebol'       },
  { name: 'Vôlei',          key: 'volei'         },
  { name: 'Handebol',       key: 'handebol'      },
  { name: 'Fut. Americano', key: 'futamericano'  },
  { name: 'Basquete',       key: 'basquete'      },
  { name: 'Tênis',          key: 'tenis'         },
  { name: 'Boxe',           key: 'boxe'          },
  { name: 'Natação',        key: 'natacao'       },
  { name: 'Atletismo',      key: 'atletismo'     },
  { name: 'Ciclismo',       key: 'ciclismo'      },
];

/* ─── Componente ─────────────────────────────────────────── */

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAppSelector((s) => s.auth);

  const [slide,     setSlide]     = useState(0);
  const [paused,    setPaused]    = useState(false);
  const [sportPage, setSportPage] = useState(0);
  const [isMobile,  setIsMobile]  = useState(false);

  const perPage    = isMobile ? 3 : 5;
  const totalPages = Math.ceil(SPORTS.length / perPage);
  const sports     = SPORTS.slice(sportPage * perPage, (sportPage + 1) * perPage);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isHydrated, router]);

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

  if (!isHydrated || !isAuthenticated) return null;

  const s      = SLIDES[slide];
  const padNum = (n: number) => String(n + 1).padStart(2, '0');

  return (
    <AppLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

        {/* ── HERO CAROUSEL ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 'var(--space-8)', position: 'relative' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              background: '#0d0d0d',
              position: 'relative',
              boxShadow: `0 0 80px ${GLOW}, 0 24px 48px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Slide content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'relative',
                  height: 'clamp(340px, 46vw, 500px)',
                  overflow: 'hidden',
                }}
              >
                {/* Logo — full-bleed background */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src="/LogoKivoSportsSFundoBranca.png"
                    alt=""
                    aria-hidden
                    width={900}
                    height={316}
                    style={{
                      objectFit: 'contain',
                      width: 'clamp(480px, 85%, 900px)',
                      height: 'auto',
                      opacity: 0.10,
                      filter: `blur(1px) drop-shadow(0 0 60px ${GLOW})`,
                      transform: 'scale(1.05)',
                    }}
                    priority
                  />
                </div>

                {/* Green radial glow top-right */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: GRAD,
                    pointerEvents: 'none',
                  }}
                />

                {/* Bottom gradient scrim for text readability */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.60) 45%, rgba(10,10,10,0.10) 100%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Slide counter — top right */}
                <div
                  style={{
                    position: 'absolute',
                    top: '24px',
                    right: '28px',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '4px',
                    zIndex: 2,
                  }}
                >
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'white', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {padNum(slide)}
                  </span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                    / {padNum(SLIDES.length - 1)}
                  </span>
                </div>

                {/* Text — bottom left */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: 'clamp(24px, 5vw, 56px)',
                    right: 'clamp(60px, 10vw, 120px)',
                    zIndex: 2,
                  }}
                >
                  {/* Eyebrow */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 14px',
                      borderRadius: '100px',
                      background: `${ACCENT}18`,
                      border: `1px solid ${ACCENT}40`,
                      color: ACCENT,
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '1.4px',
                      textTransform: 'uppercase',
                      marginBottom: '14px',
                    }}
                  >
                    <Icon icon={Trophy} size={11} />
                    {s.label}
                  </div>

                  {/* Title */}
                  <h1
                    style={{
                      fontSize: 'clamp(1.5rem, 4vw, 2.4rem)',
                      fontWeight: 900,
                      color: '#ffffff',
                      margin: '0 0 10px 0',
                      lineHeight: 1.1,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {s.title}
                  </h1>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontSize: 'clamp(12px, 1.6vw, 14px)',
                      color: 'rgba(255,255,255,0.50)',
                      margin: 0,
                      lineHeight: 1.65,
                      maxWidth: '480px',
                    }}
                  >
                    {s.subtitle}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress bar */}
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
              <div
                key={`${slide}-${paused}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  background: ACCENT,
                  animation: paused ? 'none' : `kivo-progress ${SLIDE_DURATION}ms linear`,
                  width: paused ? '0%' : undefined,
                }}
              />
            </div>

            {/* Arrows */}
            {(['left', 'right'] as const).map((side) => (
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width:  i === slide ? '32px' : '8px',
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
          style={{ marginBottom: 'var(--space-10)' }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
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
                  padding: 'clamp(20px, 3vw, 28px) clamp(16px, 3vw, 28px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  borderRight: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  transition: 'background 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,230,118,0.04)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(0,230,118,0.10)',
                    border: '1px solid rgba(0,230,118,0.20)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-brand-primary)',
                    flexShrink: 0,
                  }}
                >
                  <Icon icon={feat.icon} size={20} />
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

        {/* ── SPORTS CAROUSEL ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.22 }}
        >
          {/* Section header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.90)',
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.01em',
                }}
              >
                Modalidades Esportivas
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', margin: 0 }}>
                Selecione uma modalidade — disponível em breve
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { icon: ChevronLeft,  disabled: sportPage === 0,             label: 'Anterior', action: () => setSportPage((p) => Math.max(0, p - 1))              },
                { icon: ChevronRight, disabled: sportPage === totalPages - 1, label: 'Próximo',  action: () => setSportPage((p) => Math.min(totalPages - 1, p + 1)) },
              ].map(({ icon, disabled, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={disabled}
                  aria-label={label}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: disabled ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.65)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    opacity: disabled ? 0.4 : 1,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,230,118,0.10)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,230,118,0.25)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-brand-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)';
                    }
                  }}
                >
                  <Icon icon={icon} size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Sport circles */}
          <AnimatePresence mode="wait">
            <motion.div
              key={sportPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                gap: 'clamp(12px, 3vw, 28px)',
                justifyContent: 'space-around',
              }}
            >
              {sports.map((sport, i) => (
                <motion.div
                  key={sport.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.05 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    flex: '1 1 0',
                    minWidth: 0,
                  }}
                >
                  {/* Circle */}
                  <div
                    title="Em breve"
                    style={{
                      width: 'clamp(90px, 12vw, 110px)',
                      height: 'clamp(90px, 12vw, 110px)',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1.5px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'not-allowed',
                      transition: 'all 0.28s ease',
                      color: 'rgba(255,255,255,0.25)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background  = 'radial-gradient(circle at 35% 35%, rgba(0,230,118,0.14) 0%, rgba(0,230,118,0.05) 100%)';
                      el.style.borderColor = 'rgba(0,230,118,0.35)';
                      el.style.color       = 'var(--color-brand-primary)';
                      el.style.boxShadow   = 'inset 0 1px 0 rgba(255,255,255,0.05), 0 0 20px rgba(0,230,118,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.background  = 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)';
                      el.style.borderColor = 'rgba(255,255,255,0.08)';
                      el.style.color       = 'rgba(255,255,255,0.25)';
                      el.style.boxShadow   = 'inset 0 1px 0 rgba(255,255,255,0.05)';
                    }}
                  >
                    <Image
                      src={SportImages[sport.key]}
                      alt={sport.name}
                      width={SPORT_IMAGE_SIZE.width}
                      height={SPORT_IMAGE_SIZE.height}
                      priority
                      style={{
                        width: isMobile ? 50 : 95,
                        height: isMobile ? 50 : 95,
                        objectFit: 'contain',
                      }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 'clamp(10px, 1.8vw, 12px)',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.35)',
                      textAlign: 'center',
                      lineHeight: 1.3,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {sport.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSportPage(i)}
                  aria-label={`Página ${i + 1}`}
                  style={{
                    width: i === sportPage ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: i === sportPage
                      ? 'var(--color-brand-primary)'
                      : 'rgba(255,255,255,0.14)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}
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
