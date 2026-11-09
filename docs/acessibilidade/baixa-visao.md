# Acessibilidade para pessoas com baixa visão

Estudo e estratégias de acessibilidade do frontend do Kivo para o público com baixa visão.

## 1. Público escolhido

**Pessoas com baixa visão.** São pessoas com perda visual que não é corrigida por óculos ou lentes, mas que usam a visão residual para ler a tela. Fazem parte desse público:

- pessoas com acuidade reduzida (catarata, degeneração macular, retinopatia diabética);
- pessoas com sensibilidade reduzida a contraste, inclusive o efeito natural do envelhecimento;
- pessoas com campo visual limitado.

### Por que esse público no Kivo

O Kivo é uma plataforma de eventos esportivos com público amplo: torcedores de todas as idades, familiares e organizadores de campeonatos amadores. A baixa visão é muito mais comum que a cegueira e aumenta com a idade. O próprio sistema já registra necessidades de acessibilidade do titular do ingresso, então a atenção a esse público está ligada ao negócio.

### Como esse público usa a web

- Amplia o texto com o zoom do navegador (200% ou mais) ou com a configuração de fonte do celular.
- Prefere tema escuro ou claro conforme a condição; contraste baixo torna o texto ilegível.
- Navega com teclado ou combina mouse e teclado, e precisa enxergar onde está o foco.
- Usa celular com o texto aumentado, o que exige layout que reflua sem rolagem horizontal.

### Barreiras típicas

1. Texto cinza claro sobre fundo cinza, com contraste insuficiente.
2. Fontes muito pequenas (9 a 11 px) em rótulos, selos e metadados.
3. Indicador de foco invisível: o usuário perde a posição na página.
4. Layout que quebra ou corta conteúdo quando o texto é ampliado.

## 2. Referência adotada

WCAG 2.2, nível AA. Critérios mais ligados à baixa visão:

| Critério | Exigência |
|---|---|
| 1.4.3 Contraste (mínimo) | 4,5:1 para texto comum, 3:1 para texto grande (≥ 24 px ou ≥ 18,66 px em negrito) |
| 1.4.4 Redimensionar texto | Texto ampliável até 200% sem perda de conteúdo ou função |
| 1.4.10 Reflow | Conteúdo utilizável em 320 px de largura sem rolagem horizontal |
| 1.4.11 Contraste não textual | 3:1 para indicadores de foco e bordas de controles |
| 2.4.7 Foco visível | Todo controle operável por teclado mostra indicador de foco |

## 3. Diagnóstico

A medição foi feita no frontend local com dados de demonstração e contas de teste por perfil. As páginas avaliadas foram: home, login, painel do torcedor, campeonatos, meus ingressos, painel administrativo e configurações. Cada página foi medida nos temas escuro e claro, em 1440 px. Ferramentas usadas:

- **Script de contraste e tamanho** (`kivo/docs/tools/varredura-contraste.js`, fora do repositório). Para cada texto visível, calcula a razão de contraste entre a cor e o fundo efetivo e conta as fontes menores que 12 px.
- **Script de reflow** (`kivo/docs/tools/varredura-responsiva.js`). Abre cada rota em larguras fixas e detecta conteúdo cortado ou rolagem horizontal.
- **Cálculo direto dos tokens de cor** do tema, para não depender de amostragem.

### Antes (09/11/2026, `develop` com os temas claro e escuro)

| Problema | Medida |
|---|---|
| Texto "muted" do tema escuro (`#3a5244`) | 2,08:1 sobre os cards e 1,69:1 sobre superfícies elevadas, usado em 421 pontos do código. Até 65 textos reprovados por página. |
| Texto "secondary" do tema escuro (`#6b8f7a`) | 4,00:1 sobre superfícies elevadas |
| Texto "muted" do tema claro (`#757575`) | 4,41:1 sobre os cards |
| Cores fixas no tema claro | Nomes de times brancos sobre fundo claro (1,04:1); selo "Administrador" dourado (1,34:1); botão de perigo (3,50:1); "Fazer login" preto sobre verde (3,89:1) |
| Texto pequeno | Token mínimo de 11 px; 36 tamanhos inline de 9 a 11 px; 115 textos abaixo de 12 px só no painel do torcedor |
| Foco | Botões e links sem estilo de foco; 17 controles com `outline: none` inline; campos com `outline: none` global |
| Tamanho de texto | Sem opção no app; tokens de fonte fixos em px |
| Reflow | Já atendido depois da correção de responsividade: 0 vazamentos em 360 px nas 34 rotas |

## 4. Estratégias implementadas

| # | Estratégia | Onde está | Critério |
|---|---|---|---|
| 1 | **Contraste AA nos tokens de texto.** Escuro: secondary `#a0bcab` (7,04:1 no pior fundo) e muted `#789a86` (4,63:1). Claro: muted `#6c6c6c` (4,61:1). A paleta e a identidade visual não mudam. | `src/styles/themes/theme-dark.css`, `theme-light.css` | 1.4.3 |
| 2 | **Tokens para cores semânticas que estavam fixas.** `--color-text-on-danger` (escuro `#0a0f0d` 5,02:1, claro `#ffffff` 4,98:1) e `--color-role-admin` (claro `#7a6100` 5,69:1). Textos brancos fixos do painel do torcedor passam a usar o token de texto do tema. | temas, `Button.tsx`, `account-type.utils.ts`, `torcedor/page.tsx`, `Header.tsx`, `HeaderMobile.tsx` | 1.4.3 |
| 3 | **Tamanho mínimo de 12 px.** `--text-xs` passa a 12 px; tamanhos inline e de CSS Modules menores passam a usar o token. | `src/styles/tokens.css`, 15 páginas e componentes, `feed.module.css`, `NotificationBell.tsx` | 1.4.4 |
| 4 | **Foco visível em todos os controles.** Contorno de 3 px na cor de foco do tema, com afastamento de 2 px, aplicado só na navegação por teclado (`:focus-visible`). O contorno tem 8,62:1 no escuro e 4,74:1 no claro. Os `outline: none` que anulavam o foco foram removidos. | `src/app/globals.css`, 16 arquivos `.tsx`, `AuthorPicker.module.css` | 2.4.7, 1.4.11 |
| 5 | **Preferência "Tamanho do texto"** em Configurações → Aparência: Padrão (100%), Grande (115%) e Maior (130%). Fica salva no navegador, separada por conta e para visitante (`kivo:text-scale:v1:*`). Os tokens de fonte multiplicam pela escala escolhida. Seletor acessível: grupo de opções com setas do teclado e alvos de 44 px. | `src/components/providers/TextScaleProvider.tsx`, `TextScaleSelector.tsx`, `tokens.css`, `configuracoes/page.tsx` | 1.4.4 |
| 6 | **Reflow com texto ampliado.** Os grids de Configurações encolhem abaixo da largura mínima (`minmax(min(200px, 100%), 1fr)`), e o endereço ocupa a linha inteira em telas estreitas. | `configuracoes/page.tsx` | 1.4.10 |

## 5. Resultado (depois)

| Verificação | Resultado |
|---|---|
| Contraste: 7 páginas × 2 temas | **0 textos reprovados** em 14 combinações. Textos sobre imagem ou gradiente (até 36 por página) ficam como indeterminados. |
| Texto abaixo de 12 px | 0 nas 7 páginas |
| Foco | Regra global presente e nenhum `outline: none` inline restante (validação pelo código) |
| Preferência de tamanho | Texto base 15 → 17,25 → 19,5 px; o seletor reflete a escolha salva; 7 testes unitários (persistência, isolamento por conta, valor inválido, falha do armazenamento, hidratação) |
| Reflow com texto em 130% | 34 rotas × 360 e 1440 px: 68 medições e 0 vazamentos, depois da correção em Configurações |

## 6. Limitações

- **Teste com o público (item c) não foi realizado.** Não houve teste com pessoas com baixa visão nem coleta de dados. As evidências deste estudo são técnicas (medição automatizada e testes de unidade).
- **Leitor de tela e alto contraste** não fazem parte do escopo.
- **Textos sobre imagem ou gradiente** não são medidos automaticamente.
- **Tamanhos que não escalam:** os eixos dos gráficos (Recharts) usam tamanho numérico de 12 px e não acompanham a preferência de tamanho. Tamanhos inline numéricos acima de 12 px também não acompanham.
- **Medição de foco:** com a janela sem foco do sistema, o navegador não aplica `:focus-visible`. A conferência do foco foi feita pelo código. Para ver o contorno, navegue com Tab numa janela visível.

## 7. Como reproduzir

1. Subir a API e o frontend locais e criar contas de teste por perfil.
2. Abrir `http://localhost:<porta>/favicon.ico`, gravar sessão e tema no `localStorage` e colar no console `varredura-contraste.js` ou `varredura-responsiva.js`.
3. Rodar `await kivoContraste({ rotas: [...] })` ou `await kivoVarredura({ rotas: [...] })`.
4. Testes de unidade: `npx vitest run src/components/providers`.
