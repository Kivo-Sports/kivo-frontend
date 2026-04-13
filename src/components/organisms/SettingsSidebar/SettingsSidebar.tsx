/**
 * @file SettingsSidebar.tsx
 * @description Menu lateral de configurações - Sidebar desktop / Dropdown select mobile
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';

interface SettingsItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const settingsItems: SettingsItem[] = [
  {
    id: 'account',
    label: 'Minha Conta',
    href: '/configuracoes',
    icon: '👤',
  },
  {
    id: 'manage-admins',
    label: 'Gerenciar Admins',
    href: '/configuracoes/admin',
    icon: '👨‍💼',
    adminOnly: true,
  },
];

interface SettingsSidebarProps {
  activeItem?: string;
}

export function SettingsSidebar({ activeItem = 'account' }: SettingsSidebarProps) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = settingsItems.filter((item) => !item.adminOnly || user?.cargo === 'Administrador');

  // Encontra item ativo para mostrar no botão
  const currentItem = filteredItems.find((item) => pathname === item.href);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <aside
      style={{
        width: '100%',
        maxWidth: '250px',
        borderRight: '1px solid var(--color-border-default)',
        paddingRight: 'var(--space-4)',
        paddingTop: 'var(--space-2)',
      }}
      data-settings-sidebar-wrapper
    >
      {/* Desktop: Sidebar vertical */}
      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
        data-settings-sidebar-nav
      >
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link key={item.id} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ x: 2 }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'var(--color-bg-elevated)' : 'transparent',
                  borderLeft: `3px solid ${isActive ? 'var(--color-brand-primary)' : 'transparent'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  transition: 'all 0.2s ease-out',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Mobile: Dropdown Select */}
      <div style={{ position: 'relative' }} data-settings-mobile-menu ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            width: '100%',
            padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(0, 230, 118, 0.08)',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            transition: 'all 0.3s ease',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--color-brand-primary)',
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: '1.25rem' }}>{currentItem?.icon || '⚙️'}</span>
            <span>{currentItem?.label || 'Configurações'}</span>
          </span>
          <span
            style={{
              fontSize: '1.25rem',
              transition: 'transform 0.3s ease',
              transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + var(--space-2))',
              left: 0,
              right: 0,
              background: 'rgba(20, 20, 20, 0.99)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              borderRadius: 'var(--radius-md)',
              zIndex: 1001,
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            {filteredItems.map((item, index) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: index < filteredItems.length - 1 ? '1px solid rgba(0, 230, 118, 0.2)' : 'none',
                      cursor: 'pointer',
                      backgroundColor: isActive ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
                      borderLeft: `3px solid ${isActive ? 'var(--color-brand-primary)' : 'transparent'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      transition: 'all 0.2s ease-out',
                      fontSize: 'var(--text-sm)',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 230, 118, 0.05)';
                        e.currentTarget.style.color = 'var(--color-brand-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isActive ? 'rgba(0, 230, 118, 0.1)' : 'transparent';
                      e.currentTarget.style.color = isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)';
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </div>

      <style>{`
        /* Desktop: Mostrar sidebar */
        @media (min-width: 1025px) {
          [data-settings-sidebar-nav] {
            display: flex !important;
            flexDirection: column;
            gap: var(--space-2);
          }

          [data-settings-mobile-menu] {
            display: none !important;
          }
        }

        /* Mobile: Mostrar dropdown */
        @media (max-width: 1024px) {
          [data-settings-sidebar-wrapper] {
            max-width: 100% !important;
            padding-right: 0 !important;
            width: 100%;
            border-right: none !important;
            padding-bottom: var(--space-4);
            margin-bottom: var(--space-4);
            border-bottom: 1px solid var(--color-border-default);
          }

          [data-settings-sidebar-nav] {
            display: none !important;
          }

          [data-settings-mobile-menu] {
            display: block !important;
            width: 100%;
          }

          [data-settings-mobile-menu] button {
            width: 100%;
          }
        }
      `}</style>
    </aside>
  );
}
