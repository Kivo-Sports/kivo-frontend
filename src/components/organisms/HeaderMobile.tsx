'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCredentials } from '@/store/slices/authSlice';

export function HeaderMobile() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  const getNavLinkStyle = (path: string) => ({
    color: isActive(path) ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: isActive(path) ? 600 : 500,
    padding: 'var(--space-3) var(--space-2)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    textDecoration: 'none',
    borderRadius: '8px',
    background: isActive(path) ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
  });

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    dispatch(clearCredentials());
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
    router.push('/login');
  };

  // Função para redirecionar para home específica do usuário
  const getHomeRoute = () => {
    if (!user?.cargo) return '#';

    const cargo = user.cargo.toLowerCase();
    switch (cargo) {
      case 'torcedor':
        return '/home/torcedor';
      case 'organizadortime':
        return '/home/organizador-time';
      case 'organizadorcampeonato':
        return '/home/organizador-campeonato';
      case 'administrador':
        return '/home/admin';
      default:
        return '#';
    }
  };

  return (
    <header
      ref={menuRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        background: 'rgba(20, 20, 20, 0.98)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0, 230, 118, 0.2)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          width: '100%',
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            cursor: 'pointer',
            flex: 1,
            transition: 'opacity 0.2s ease',
          }}
          onClick={() => {
            const homeRoute = getHomeRoute();
            if (homeRoute !== '#') {
              router.push(homeRoute);
            }
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.opacity = '1';
          }}
        >
          <Image
            src="/LogoKivoSportsSimplificada.png"
            alt="Kivo Sports"
            width={45}
            height={18}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        {/* Menu Button + User Menu */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          {/* Hamburger Menu */}
          {isAuthenticated && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 230, 118, 0.08)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
                fontSize: '24px',
                color: 'var(--color-brand-primary)',
                fontWeight: 'bold',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.08)';
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.15)';
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.08)';
              }}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          )}

          {/* User Menu */}
          {isAuthenticated && user && (
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(0, 230, 118, 0.15)',
                  border: '2px solid rgba(0, 230, 118, 0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-brand-primary)',
                  fontWeight: 700,
                  fontSize: '18px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 230, 118, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 230, 118, 0.15)';
                }}
              >
                {user?.name && user.name.length > 0 ? user.name.charAt(0).toUpperCase() : 'U'}
              </button>

              {isUserDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 'var(--space-2)',
                    background: 'rgba(20, 20, 20, 0.99)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 230, 118, 0.3)',
                    borderRadius: '12px',
                    minWidth: '200px',
                    maxWidth: 'calc(100vw - var(--space-6))',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                    zIndex: 1001,
                    overflow: 'hidden',
                    animation: 'slideDown 0.3s ease-out',
                  }}
                >
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      borderBottom: '1px solid rgba(0, 230, 118, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        marginBottom: 'var(--space-1)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 600,
                      }}
                    >
                      Usuário
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: 'white',
                        wordBreak: 'break-all',
                      }}
                    >
                      {user?.name || 'Usuário'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 'var(--space-3)',
                      borderBottom: '1px solid rgba(0, 230, 118, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        marginBottom: 'var(--space-1)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 600,
                      }}
                    >
                      Email
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-brand-primary)',
                        wordBreak: 'break-all',
                        fontWeight: 500,
                      }}
                    >
                      {user.email}
                    </div>
                  </div>

                  <div style={{ padding: 'var(--space-2)' }}>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        router.push('/configuracoes');
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--text-sm)',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        marginBottom: 'var(--space-1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 230, 118, 0.1)';
                        e.currentTarget.style.color = 'var(--color-brand-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }}
                    >
                      ⚙️ Configurações
                    </button>

                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3) var(--space-4)',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-feedback-danger)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 23, 68, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      🚪 Desconectar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && isAuthenticated && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(15, 15, 15, 0.95)',
            borderTop: '1px solid rgba(0, 230, 118, 0.2)',
            animation: 'slideDown 0.3s ease-out',
            zIndex: 999,
            position: 'relative',
            maxHeight: 'calc(100vh - 70px)',
            overflowY: 'auto',
          }}
        >
          <a
            href={getHomeRoute()}
            onClick={() => setIsMenuOpen(false)}
            style={getNavLinkStyle(getHomeRoute())}
            onMouseEnter={(e) => {
              if (!isActive(getHomeRoute())) {
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.1)';
                e.currentTarget.style.color = 'var(--color-brand-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(getHomeRoute())) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            Home
          </a>
          <a
            href="/times"
            onClick={() => setIsMenuOpen(false)}
            style={getNavLinkStyle('/times')}
            onMouseEnter={(e) => {
              if (!isActive('/times')) {
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.1)';
                e.currentTarget.style.color = 'var(--color-brand-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/times')) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            Times
          </a>
          <a
            href="/campeonatos"
            onClick={() => setIsMenuOpen(false)}
            style={getNavLinkStyle('/campeonatos')}
            onMouseEnter={(e) => {
              if (!isActive('/campeonatos')) {
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.1)';
                e.currentTarget.style.color = 'var(--color-brand-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/campeonatos')) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            Campeonatos
          </a>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}
