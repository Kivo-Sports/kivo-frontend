'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCredentials } from '@/store/slices/authSlice';

export function HeaderMobile() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
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
          }}
          onClick={() => {
            router.push('/dashboard');
            setIsMenuOpen(false);
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--color-brand-primary)',
              letterSpacing: '1px',
            }}
          >
            KIVO
          </div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'white',
            }}
          >
            Sports
          </div>
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                background: 'rgba(0, 230, 118, 0.08)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.08)';
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '2px',
                  background: 'var(--color-brand-primary)',
                  transition: 'all 0.3s ease',
                  transform: isMenuOpen ? 'rotate(45deg) translateY(10px)' : 'none',
                }}
              />
              <div
                style={{
                  width: '20px',
                  height: '2px',
                  background: 'var(--color-brand-primary)',
                  transition: 'all 0.3s ease',
                  opacity: isMenuOpen ? 0 : 1,
                }}
              />
              <div
                style={{
                  width: '20px',
                  height: '2px',
                  background: 'var(--color-brand-primary)',
                  transition: 'all 0.3s ease',
                  transform: isMenuOpen ? 'rotate(-45deg) translateY(-10px)' : 'none',
                }}
              />
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
                {user.name.charAt(0).toUpperCase()}
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
                    minWidth: '240px',
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
                      {user.name}
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
                        router.push('/settings');
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
          ref={menuRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(15, 15, 15, 0.95)',
            borderTop: '1px solid rgba(0, 230, 118, 0.2)',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <a
            href="#"
            onClick={() => setIsMenuOpen(false)}
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              padding: 'var(--space-3) var(--space-2)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              textDecoration: 'none',
              borderRadius: '8px',
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
            Dashboard
          </a>
          <a
            href="#"
            onClick={() => setIsMenuOpen(false)}
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              padding: 'var(--space-3) var(--space-2)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              textDecoration: 'none',
              borderRadius: '8px',
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
            Times
          </a>
          <a
            href="#"
            onClick={() => setIsMenuOpen(false)}
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              padding: 'var(--space-3) var(--space-2)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              textDecoration: 'none',
              borderRadius: '8px',
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
