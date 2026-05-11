'use client';

import { useState, useEffect } from 'react';
import { Header } from './Header';
import { HeaderMobile } from './HeaderMobile';

export function HeaderResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Verificar tamanho inicial
    handleResize();

    // Adicionar listener para resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) return null;

  return isMobile ? <HeaderMobile /> : <Header />;
}
