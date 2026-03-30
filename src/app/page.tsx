"use client";

/**
 * @file page.tsx
 * @description Home de demonstracao do design system + motion base.
 *
 * Essa tela nao eh a home final do produto. Eu deixei ela como laboratorio
 * para validar animacoes, cards e lista dinamica antes de levar para as
 * telas reais de campeonato e ingresso.
 *
 * @author Kivo Sports - TCC
 */

// - React
import { useState, useEffect } from "react";

// - Next.js
import Link from "next/link";

// - Framer Motion
import { motion } from "framer-motion";

// - Componentes
import { AnimatedList } from "@/components/atoms/AnimatedList";
import { AnimatedNumber } from "@/components/atoms/AnimatedNumber";
import { AnimatedPage } from "@/components/atoms/AnimatedPage";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { FadeIn } from "@/components/atoms/FadeIn";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { Card } from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { MotionCard } from "@/components/molecules/MotionCard";
import { Stepper } from "@/components/molecules/Stepper/Stepper";
import { FormSection } from "@/components/molecules/FormSection/FormSection";
import { useToast } from "@/components/atoms/Toast";
import { Header } from "@/components/organisms/Header";
import { HeaderMobile } from "@/components/organisms/HeaderMobile";

// - Motion config
import { containerVariants, itemVariants, mediumMotionTransition } from "@/lib/motion";

type JogoDaRodada = {
  id: number;
  title: string;
  status: string;
};

const jogosIniciaisDaRodada: JogoDaRodada[] = [
  { id: 1, title: "Ajax FC vs Estrela Azul", status: "Em 30 min" },
  { id: 2, title: "Uniao Norte vs Bairro 7", status: "Aguardando arbitragem" },
  { id: 3, title: "Racha Prime vs Kivo United", status: "Finalizado" },
];

const mockStepperSteps = [
  { numero: 1, titulo: "Dados Pessoais" },
  { numero: 2, titulo: "Credenciais" },
  { numero: 3, titulo: "Endereço" },
  { numero: 4, titulo: "Confirmação" },
];

export default function Home() {
  const [jogosDaRodada, setJogosDaRodada] = useState<JogoDaRodada[]>(jogosIniciaisDaRodada);
  const [placarDoKivoFc, setPlacarDoKivoFc] = useState(1);
  const [emailDemo, setEmailDemo] = useState<string>("");
  const [senhaDemo, setSenhaDemo] = useState<string>("");
  const [usuarioDemo, setUsuarioDemo] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const [stepperStep, setStepperStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeFormSection, setActiveFormSection] = useState<number>(1);

  const { success, error, warning, info } = useToast();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function handleAdicionarJogoTeste(): void {
    const idDoNovoJogo = Date.now();

    const novoJogoDaRodada: JogoDaRodada = {
      id: idDoNovoJogo,
      title: `Novo jogo #${jogosDaRodada.length + 1}`,
      status: "Agendado agora",
    };

    setJogosDaRodada((listaAtualDeJogos) => [novoJogoDaRodada, ...listaAtualDeJogos]);
  }

  function handleRemoverJogo(idDoJogo: number): void {
    setJogosDaRodada((listaAtualDeJogos) =>
      listaAtualDeJogos.filter((jogoDaLista) => jogoDaLista.id !== idDoJogo),
    );
  }

  function handleSomarGolNoPlacarDemo(): void {
    setPlacarDoKivoFc((placarAtual) => placarAtual + 1);
  }

  return (
    <AnimatedPage>
      {/* Header Responsivo */}
      {isMobile ? <HeaderMobile /> : <Header />}

      <main
        style={{
          minHeight: "100vh",
          padding: "var(--space-8)",
          paddingTop: "calc(70px + var(--space-8))",
          background:
            "radial-gradient(circle at 15% 20%, rgba(0, 230, 118, 0.16), transparent 35%), radial-gradient(circle at 85% 0%, rgba(255, 214, 0, 0.1), transparent 30%), var(--color-bg-base)",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "grid",
            gap: "var(--space-5)",
          }}
        >
          <FadeIn delay={0} direction="up">
            <header className="card-elevated" style={{ padding: "var(--space-6)" }}>
              <p
                className="text-muted"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  marginBottom: "var(--space-2)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Kivo Motion Foundation
              </p>
              <h1 style={{ marginBottom: "var(--space-2)" }}>Tela inicial com animacoes base</h1>
              <p className="text-secondary" style={{ maxWidth: 720 }}>
                Estrutura para validar transicoes, listas, cards e placar com movimento fluido,
                sutil e orientado a contexto.
              </p>
            </header>
          </FadeIn>

          <FadeIn delay={0.1} direction="up">
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Button Showcase</h2>
                  <p className="card-subtitle">Variantes, tamanhos e estados do componente.</p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger">Danger</Button>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                    <Button loading>Loading</Button>
                    <Button disabled variant="ghost">
                      Disabled
                    </Button>
                  </div>

                  <Button fullWidth>Full Width</Button>
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Input Showcase</h2>
                  <p className="card-subtitle">Default, com icone, erro e estado desabilitado.</p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-4)" }}>
                  <Input
                    label="Email"
                    placeholder="voce@kivo.com"
                    value={emailDemo}
                    onChange={(event) => setEmailDemo(event.target.value)}
                    icon={<span style={{ fontWeight: 700 }}>@</span>}
                    type="email"
                  />

                  <Input
                    label="Senha"
                    placeholder="Digite ao menos 6 caracteres"
                    value={senhaDemo}
                    onChange={(event) => setSenhaDemo(event.target.value)}
                    type="password"
                    error={
                      senhaDemo.length > 0 && senhaDemo.length < 6
                        ? "A senha precisa ter no minimo 6 caracteres."
                        : undefined
                    }
                  />

                  <Input label="Campo desabilitado" placeholder="Indisponivel" disabled />
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">FormField Showcase</h2>
                  <p className="card-subtitle">
                    Molecule padrao para formularios com label e erro.
                  </p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-4)" }}>
                  <FormField
                    label="Usuario"
                    placeholder="Seu nome de usuario"
                    value={usuarioDemo}
                    onChange={(event) => setUsuarioDemo(event.target.value)}
                  />

                  <FormField
                    label="Email de login"
                    placeholder="contato@kivo.com"
                    type="email"
                    error={
                      emailDemo.length > 0 && !emailDemo.includes("@")
                        ? "Informe um email valido."
                        : undefined
                    }
                    value={emailDemo}
                    onChange={(event) => setEmailDemo(event.target.value)}
                  />
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Badge Showcase</h2>
                  <p className="card-subtitle">
                    Variantes de status com opacidade de fundo em 15%.
                  </p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                    <Badge variant="success" size="md">
                      Sucesso
                    </Badge>
                    <Badge variant="warning" size="md">
                      Alerta
                    </Badge>
                    <Badge variant="danger" size="md">
                      Erro
                    </Badge>
                    <Badge variant="info" size="md">
                      Info
                    </Badge>
                    <Badge variant="default" size="md">
                      Padrao
                    </Badge>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                    <Badge variant="success" size="sm">
                      sm
                    </Badge>
                    <Badge variant="warning" size="sm">
                      sm
                    </Badge>
                    <Badge variant="danger" size="sm">
                      sm
                    </Badge>
                    <Badge variant="info" size="sm">
                      sm
                    </Badge>
                    <Badge variant="default" size="sm">
                      sm
                    </Badge>
                  </div>
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Auth Screen Preview</h2>
                  <p className="card-subtitle">
                    Acesso rapido para validar a nova tela de login do Kivo Sports.
                  </p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  <p className="text-secondary">
                    A tela de autenticacao foi criada com template responsivo, foco em leitura e
                    hierarquia visual alinhada ao tema noturno da plataforma.
                  </p>

                  <Link
                    href="/login"
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Abrir Tela de Login
                  </Link>
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Toast Showcase</h2>
                  <p className="card-subtitle">Teste as notificações em todos os tipos.</p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  <Button
                    variant="primary"
                    onClick={() => success("Operação realizada com sucesso!", "Sucesso")}
                  >
                    Success
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => error("Ocorreu um erro na operação!", "Erro")}
                  >
                    Error
                  </Button>
                  <Button
                    onClick={() => warning("Atenção: Esta ação requer confirmação", "Aviso")}
                  >
                    Warning
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => info("Esta é uma mensagem informativa", "Informação")}
                  >
                    Info
                  </Button>
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Spinner Showcase</h2>
                  <p className="card-subtitle">Loading animado com tamanhos e cores diferentes.</p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-4)" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "var(--space-4)",
                    }}
                  >
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "var(--space-4)",
                    }}
                  >
                    <Spinner size="md" color="var(--color-brand-primary)" />
                    <Spinner size="md" color="var(--color-brand-secondary)" />
                    <Spinner size="md" color="var(--color-feedback-warning)" />
                    <Spinner size="md" color="var(--color-feedback-danger)" />
                  </div>
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Avatar Showcase</h2>
                  <p className="card-subtitle">
                    Foto de perfil com fallback automatico para iniciais.
                  </p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-4)" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "var(--space-4)",
                    }}
                  >
                    <Avatar size="sm" name="Bruno Silva" src="https://i.pravatar.cc/64?img=14" />
                    <Avatar size="md" name="Camila Rocha" src="https://i.pravatar.cc/96?img=32" />
                    <Avatar size="lg" name="Diego Souza" src="https://i.pravatar.cc/128?img=54" />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "var(--space-4)",
                    }}
                  >
                    <Avatar size="sm" name="Maria Oliveira" />
                    <Avatar size="md" name="Joao Pedro" />
                    <Avatar size="lg" name="Kivo United" />
                  </div>
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Card Showcase</h2>
                  <p className="card-subtitle">
                    Container base com padding configuravel e hover opcional.
                  </p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  <Card padding="sm">
                    <strong style={{ display: "block", marginBottom: "var(--space-1)" }}>
                      Padding sm
                    </strong>
                    <p className="text-muted">Card compacto para conteudo curto.</p>
                  </Card>

                  <Card padding="md">
                    <strong style={{ display: "block", marginBottom: "var(--space-1)" }}>
                      Padding md
                    </strong>
                    <p className="text-muted">Card padrao para a maioria das telas.</p>
                  </Card>

                  <Card padding="lg" hoverable>
                    <strong style={{ display: "block", marginBottom: "var(--space-1)" }}>
                      Padding lg + hoverable
                    </strong>
                    <p className="text-muted">Passe o mouse para ver elevacao de superficie.</p>
                  </Card>
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Card Interativo</h2>
                  <p className="card-subtitle">Hover e tap configurados via MotionCard.</p>
                </div>
                <p className="text-secondary" style={{ marginBottom: "var(--space-4)" }}>
                  Passe o mouse ou toque para perceber elevacao e sombra suaves em padrao
                  Apple-like.
                </p>
                <Button variant="primary" type="button">
                  Acao Principal
                </Button>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Placar Animado</h2>
                  <p className="card-subtitle">Contagem progressiva com destaque visual.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <p className="text-secondary">Kivo FC:</p>
                  <AnimatedNumber
                    value={placarDoKivoFc}
                    duration={0.6}
                    className="text-primary"
                    style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--font-bold)" }}
                  />
                </div>
                <div style={{ marginTop: "var(--space-4)" }}>
                  <Button variant="secondary" type="button" onClick={handleSomarGolNoPlacarDemo}>
                    Somar Gol
                  </Button>
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Stepper Component</h2>
                  <p className="card-subtitle">Indicador de progresso multi-step.</p>
                </div>

                <div style={{ marginBottom: "var(--space-4)" }}>
                  <Stepper
                    steps={mockStepperSteps}
                    currentStep={stepperStep}
                    completedSteps={completedSteps}
                    onStepClick={(step) => {
                      setStepperStep(step);
                      if (!completedSteps.includes(step)) {
                        setCompletedSteps([...completedSteps, step]);
                      }
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={stepperStep === 1}
                    onClick={() => setStepperStep(stepperStep - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={stepperStep === 4}
                    onClick={() => {
                      setStepperStep(stepperStep + 1);
                      setCompletedSteps([...completedSteps, stepperStep]);
                    }}
                  >
                    Próximo
                  </Button>
                </div>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">FormSection Component</h2>
                  <p className="card-subtitle">Seção expandível com validação.</p>
                </div>

                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                  <FormSection
                    stepNumber={1}
                    title="Dados Pessoais"
                    description="Informações básicas"
                    isActive={activeFormSection === 1}
                    isCompleted={completedSteps.includes(1)}
                    isDisabled={false}
                    onToggle={() => setActiveFormSection(activeFormSection === 1 ? 0 : 1)}
                  >
                    <FormField label="Nome completo" placeholder="Seu nome" />
                    <FormField label="Email" placeholder="seu@email.com" type="email" />
                  </FormSection>

                  <FormSection
                    stepNumber={2}
                    title="Credenciais"
                    description="Crie sua senha"
                    isActive={activeFormSection === 2}
                    isCompleted={completedSteps.includes(2)}
                    isDisabled={!completedSteps.includes(1)}
                    onToggle={() => setActiveFormSection(activeFormSection === 2 ? 0 : 2)}
                  >
                    <FormField label="Senha" placeholder="Min 6 caracteres" type="password" />
                  </FormSection>
                </div>
              </MotionCard>
            </section>
          </FadeIn>

          <FadeIn delay={0.2} direction="up">
            <section className="card" style={{ padding: "var(--space-5)" }}>
              <div className="card-header">
                <h2 className="card-title">Lista com AutoAnimate</h2>
                <p className="card-subtitle">
                  Entrada e remocao de jogos com transicao automatica.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-4)",
                }}
              >
                <Button variant="primary" type="button" onClick={handleAdicionarJogoTeste}>
                  Adicionar Jogo
                </Button>
              </div>

              <AnimatedList>
                <motion.ul
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "grid",
                    gap: "var(--space-3)",
                  }}
                >
                  {jogosDaRodada.map((jogoDaRodada) => (
                    <motion.li
                      key={jogoDaRodada.id}
                      variants={itemVariants}
                      transition={mediumMotionTransition}
                      className="card"
                      style={{
                        padding: "var(--space-4)",
                        backfaceVisibility: "hidden",
                        WebkitFontSmoothing: "antialiased",
                      }}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div>
                          <strong style={{ display: "block", marginBottom: "var(--space-1)" }}>
                            {jogoDaRodada.title}
                          </strong>
                          <p className="text-muted">{jogoDaRodada.status}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverJogo(jogoDaRodada.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatedList>
            </section>
          </FadeIn>
        </div>
      </main>
    </AnimatedPage>
  );
}
