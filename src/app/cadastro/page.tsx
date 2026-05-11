/**
 * @file page.tsx (/cadastro)
 * @description Tela inicial de cadastro com seleção de tipo de usuário
 *
 * Funcionalidades:
 * - 3 opções de tipo de usuário (Torcedor, Organizador Time, Organizador Campeonato)
 * - Cards com descrição para cada tipo
 * - Link para voltar ao login
 * - Navegação para formulário dinâmico
 *
 * @author Kivo Sports - TCC
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setUserType } from '@/store/slices/registrationSlice';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/molecules/Card';
import { FadeIn } from '@/components/atoms/FadeIn';
import type { UserType } from '@/lib/registration.utils';

interface UserTypeOption {
  type: UserType;
  title: string;
  description: string;
  benefits: string[];
  avatar: string;
}

const userTypeOptions: UserTypeOption[] = [
  {
    type: 'torcedor',
    title: 'Torcedor',
    description: 'Fã de esportes amadores',
    benefits: [
      'Compre ingressos para eventos',
      'Acompanhe campeonatos',
      'Suporte times locais',
    ],
    avatar: '/avatars/torcedor.png',
  },
  {
    type: 'organizador-time',
    title: 'Organizador de Time',
    description: 'Gerencie seu time',
    benefits: [
      'Cadastre seu time',
      'Participe de campeonatos',
      'Gerencie jogadores',
    ],
    avatar: '/avatars/organizador-time.png',
  },
  {
    type: 'organizador-campeonato',
    title: 'Organizador de Campeonato',
    description: 'Organize eventos esportivos',
    benefits: ['Crie campeonatos', 'Venda ingressos', 'Receba pagamentos'],
    avatar: '/avatars/organizador-campeonato.png',
  },
];

export default function CadastroPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectType = async (type: UserType) => {
    setIsLoading(true);
    setSelectedType(type);

    // Pequeno delay para efeito visual
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Dispatch do tipo selecionado para Redux
    dispatch(setUserType(type));

    // Redirecionar para formulário
    router.push(`/cadastro/${type}`);
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        background:
          'radial-gradient(circle at 8% 12%, rgba(0, 230, 118, 0.15), transparent 35%), radial-gradient(circle at 100% 0%, rgba(255, 214, 0, 0.1), transparent 32%), linear-gradient(145deg, var(--color-bg-base), color-mix(in srgb, var(--color-bg-base), #000 10%))',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
        }}
      >
        {/* Header */}
        <FadeIn delay={0} direction="up">
          <div
            style={{
              textAlign: 'center',
              marginBottom: 'var(--space-8)',
            }}
          >
            <h1
              style={{
                fontSize: 'clamp(var(--text-2xl), 5vw, var(--text-4xl))',
                fontWeight: 700,
                marginBottom: 'var(--space-2)',
                color: 'var(--color-text-primary)',
              }}
            >
              Bem-vindo ao Kivo Sports
            </h1>
            <h2
              style={{
                fontSize: 'var(--text-lg)',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-1)',
                fontWeight: 500,
              }}
            >
              Escolha seu perfil para começar
            </h2>
          </div>
        </FadeIn>

        {/* Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-5)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {userTypeOptions.map((option, index) => (
            <FadeIn key={option.type} delay={0.1 * (index + 1)} direction="up">
              <Card
                padding="lg"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'all 0.2s ease',
                }}
                className="hover:shadow-lg"
              >
                {/* Avatar */}
                <div
                  style={{
                    marginBottom: 0,
                    marginTop: 'calc(-1 * var(--space-2))',
                    marginLeft: 'calc(-1 * var(--space-2))',
                    marginRight: 'calc(-1 * var(--space-2))',
                    textAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={option.avatar}
                    alt={option.title}
                    style={{
                      width: '100%',
                      maxWidth: '225px',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                </div>
                <div style={{ marginBottom: 'var(--space-3)' }} />

                {/* Title */}
                <h2
                  style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 700,
                    marginBottom: 'var(--space-1)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {option.title}
                </h2>

                {/* Description */}
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {option.description}
                </p>

                {/* Benefits */}
                <ul
                  style={{
                    flex: 1,
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    marginBottom: 'var(--space-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  {option.benefits.map((benefit, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <span style={{ color: 'var(--color-brand-primary)' }}>✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <Button
                  variant={selectedType === option.type ? 'primary' : 'secondary'}
                  size="lg"
                  fullWidth
                  onClick={() => handleSelectType(option.type)}
                  loading={selectedType === option.type && isLoading}
                  disabled={isLoading && selectedType !== option.type}
                >
                  Escolher
                </Button>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* Footer Links */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            marginTop: 'var(--space-8)',
          }}
        >
          <Link
            href="/login"
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-brand-secondary)',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              padding: 'var(--space-2) var(--space-3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-brand-primary)';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-brand-secondary)';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            ← Voltar para Login
          </Link>
        </div>
      </div>
    </main>
  );
}
