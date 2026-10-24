<div align="center">

<img src="https://img.shields.io/badge/version-0.1.0-00C896?style=for-the-badge" />
<img src="https://img.shields.io/badge/status-em%20desenvolvimento-FFB800?style=for-the-badge" />
<img src="https://img.shields.io/badge/licença-MIT-blue?style=for-the-badge" />

# ⚽ KIVO SPORTS — Frontend

### Plataforma web de gestão de campeonatos esportivos e venda de ingressos digitais para eventos amadores e semiprofissionais.

[Sobre](#-sobre-o-projeto) · [Stack](#-stack) · [Estrutura](#-estrutura-do-projeto) · [Como rodar](#-como-rodar) · [Variáveis de ambiente](#-variáveis-de-ambiente) · [Padrões](#-padrões-de-desenvolvimento)

</div>

---

## 📌 Sobre o Projeto

O **Kivo Sports** é uma plataforma web que digitaliza e moderniza a gestão de eventos esportivos de pequeno e médio porte. Organizadores criam campeonatos, gerenciam times e jogos, registram resultados e publicam notícias — enquanto torcedores acompanham tabelas, resultados e compram ingressos digitais via PIX.

Este repositório contém o **frontend** da plataforma, desenvolvido em **Next.js 14** com App Router.

---

## 🧩 Stack

| Camada        | Tecnologia                                                   |
| ------------- | ------------------------------------------------------------ |
| Framework     | [Next.js 14](https://nextjs.org/) (App Router)               |
| Linguagem     | [TypeScript](https://www.typescriptlang.org/)                |
| Estilização   | [Tailwind CSS](https://tailwindcss.com/)                     |
| Estado global | [Redux Toolkit](https://redux-toolkit.js.org/)               |
| Chamadas HTTP | [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) |
| Formulários   | [React Hook Form](https://react-hook-form.com/)              |
| Validação     | [Zod](https://zod.dev/)                                      |
| Linting       | ESLint + Prettier                                            |

---

## 🗂 Estrutura do Projeto

A arquitetura de componentes segue o padrão **Atomic Design**:

```
src/
├── app/                        # Páginas e rotas (Next.js App Router)
│   ├── (auth)/                 # Grupo de rotas públicas (login, cadastro)
│   ├── (dashboard)/            # Grupo de rotas protegidas
│   └── layout.tsx              # Layout raiz com Redux Provider
│
├── components/
│   ├── atoms/                  # Elementos base: Button, Input, Label, Badge...
│   ├── molecules/              # Combinações: FormField, SearchBar, Card...
│   ├── organisms/              # Seções: Header, Sidebar, Tabela de jogos...
│   └── templates/              # Layouts: AuthLayout, DashboardLayout...
│
├── store/
│   ├── index.ts                # Store principal
│   ├── hooks.ts                # useAppDispatch e useAppSelector tipados
│   ├── slices/                 # Redux slices por domínio (auth, campeonato...)
│   └── api/                   # RTK Query endpoints por domínio
│
├── types/                      # Interfaces e tipos TypeScript globais
├── hooks/                      # Custom hooks reutilizáveis
└── utils/                      # Funções utilitárias
```

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/kivo-sports/kivo-frontend.git
cd kivo-frontend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Rode o servidor de desenvolvimento

```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# URL base da API (.NET)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

> ⚠️ Nunca commite o arquivo `.env.local`. Ele já está no `.gitignore`.

---

## 🎨 Padrões de Desenvolvimento

### Atomic Design

Cada componente deve ser criado no nível correto da hierarquia:

| Nível        | O que é                         | Exemplos                        |
| ------------ | ------------------------------- | ------------------------------- |
| **Atom**     | Menor unidade, sem dependências | Button, Input, Label, Badge     |
| **Molecule** | Combinação de atoms             | FormField, SearchBar, GameCard  |
| **Organism** | Seção funcional completa        | Header, Tabela de Classificação |
| **Template** | Estrutura de página             | AuthLayout, DashboardLayout     |

### Commits

Seguimos o padrão **Conventional Commits**:

```
feat: adiciona tela de login
fix: corrige validação do formulário de cadastro
chore: atualiza dependências
refactor: reorganiza estrutura do authSlice
```

### Branches

```
main          → produção
develop       → desenvolvimento
feat/nome     → novas funcionalidades
fix/nome      → correções
```

---

## 🔗 Repositórios Relacionados

| Repositório                                                 | Descrição        |
| ----------------------------------------------------------- | ---------------- |
| [kivo-backend](https://github.com/kivo-sports/kivo-backend) | API REST em .NET |

---

## 👥 Time

Desenvolvido pelo time **Kivo Sports**.

---

<div align="center">
  <sub>Kivo Sports © 2025 — Digitalizando o esporte amador brasileiro</sub>
</div>
