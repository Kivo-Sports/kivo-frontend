'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCredentials } from '@/store/slices/authSlice';
import { Icon } from '@/components/atoms/Icon';
import { LogOut, Settings } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const homeRoute = isAuthenticated ? '/dashboard' : '/login';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = () => {
    dispatch(clearCredentials());
    setIsDropdownOpen(false);
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
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px',
        }}
      >
        {/* Logo - Esquerda */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            cursor: 'pointer',
            minWidth: '120px',
          }}
          onClick={() => router.push(homeRoute)}
        >
          <div
            style={{
              fontSize: 'clamp(16px, 3vw, 18px)',
              fontWeight: 800,
              color: 'var(--color-brand-primary)',
              letterSpacing: '1px',
            }}
          >
            KIVO
          </div>
          <div
            style={{
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: 600,
              color: 'white',
            }}
          >
            Sports
          </div>
        </div>

        {/* Menu - Centro (Desktop) */}
        {isAuthenticated && (
          <nav
            style={{
              display: 'flex',
              gap: 'var(--space-6)',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <a
              href="#"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'clamp(12px, 2vw, 14px)',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-brand-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              Dashboard
            </a>
            <a
              href="#"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'clamp(12px, 2vw, 14px)',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-brand-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              Times
            </a>
            <a
              href="#"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'clamp(12px, 2vw, 14px)',
                fontWeight: 500,
                transition: 'color 0.3s ease',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-brand-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              Campeonatos
            </a>
          </nav>
        )}

        {/* User Menu - Direita */}
        {isAuthenticated && user ? (
          <div style={{ position: 'relative', minWidth: '120px', textAlign: 'right' }} ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                background: 'rgba(0, 230, 118, 0.08)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: 500,
                color: 'var(--color-brand-primary)',
                fontSize: 'clamp(11px, 2vw, 13px)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 230, 118, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.3)';
              }}
            >
              {user.email}
            </button>

            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 'var(--space-3)',
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
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid rgba(0, 230, 118, 0.2)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      marginBottom: 'var(--space-2)',
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
                    padding: 'var(--space-4)',
                    borderBottom: '1px solid rgba(0, 230, 118, 0.2)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      marginBottom: 'var(--space-2)',
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
                      setIsDropdownOpen(false);
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon icon={Settings} size={16} />
                      Configurações
                    </span>
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
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon icon={LogOut} size={16} />
                      Desconectar
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

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
