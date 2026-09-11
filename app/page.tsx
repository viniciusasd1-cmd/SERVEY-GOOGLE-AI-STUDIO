'use client';

import React from 'react';
import styles from './page.module.css';
import { 
  ClipboardCheck, 
  Camera, 
  History, 
  Building2, 
  Smartphone, 
  ArrowRight, 
  Wrench, 
  Car, 
  ShieldCheck, 
  Check, 
  X,
  Layers,
  Clock,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Sparkles,
  Lock,
  Users,
  Flame,
  PhoneCall,
  MessageSquare,
  Send,
  Menu
} from 'lucide-react';
import { AuthenticatedUser } from '../components/auth/auth-screens';
import { ThemeToggle } from '../components/ui/theme-toggle';

interface LandingPageProps {
  onStartInspection?: () => void;
  onViewDemo?: () => void;
  onGoToLogin?: () => void;
  onGoToRegister?: () => void;
  onGoToTeam?: () => void;
  onGoToDashboard?: () => void;
  user?: AuthenticatedUser | null;
  onLogout?: () => void;
}

export default function LandingPage({
  onStartInspection,
  onViewDemo,
  onGoToLogin,
  onGoToRegister,
  onGoToTeam,
  onGoToDashboard,
  user,
  onLogout,
}: LandingPageProps) {
  const [consultModalOpen, setConsultModalOpen] = React.useState(false);
  const [consultPlanName, setConsultPlanName] = React.useState('Enterprise');
  const [consultEmail, setConsultEmail] = React.useState('');
  const [consultPhone, setConsultPhone] = React.useState('');
  const [consultSubmitted, setConsultSubmitted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const handleStart = () => {
    if (onStartInspection) {
      onStartInspection();
    } else {
      window.location.href = '/app/inspections/insp_78942/template';
    }
  };

  const handleDemo = () => {
    if (onViewDemo) {
      onViewDemo();
    } else {
      window.location.href = '/app/inspections/insp_78942/checklist';
    }
  };

  return (
    <div className={styles.landingWrapper} id="landing-page">
      {/* Barra de Navegação Superior */}
      <nav className={styles.navbar} id="main-nav">
        <div className={styles.navContainer}>
          <div className={styles.brandLogo}>
            <span className={styles.logoBadge}>SURVEY</span>
            <div className={styles.brandTextGroup}>
              <span className={styles.brandText}>Vistoria Veicular Digital</span>
              <span className={styles.brandTagline}>Processos & Rastreabilidade B2B</span>
            </div>
          </div>

          <div className={styles.navLinks}>
            <a href="#como-funciona" className={styles.navLinkItem}>Como funciona</a>
            <a href="#segmentos" className={styles.navLinkItem}>Para quem é</a>
            <a href="#precos" className={styles.navLinkItem}>Planos</a>
            <a href="#faq" className={styles.navLinkItem}>Dúvidas</a>
          </div>

          <div className={styles.navActions}>
            <ThemeToggle variant="compact" id="landing-theme-toggle" />
            {user ? (
              <>
                <div className={styles.userBadge} id="nav-user-badge">
                  <div className={styles.userAvatarMini}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                </div>
                {user.roleType !== 'OPERATOR' && onGoToDashboard && (
                  <button
                    type="button"
                    className={styles.navBtnSecondary}
                    onClick={onGoToDashboard}
                    id="nav-dashboard-btn"
                    title="Acessar o Painel Executivo do Proprietário"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: '#334155' }}
                  >
                    📊 Painel do Proprietário
                  </button>
                )}
                {onGoToTeam && (
                  <button
                    type="button"
                    className={styles.navBtnSecondary}
                    onClick={onGoToTeam}
                    id="nav-team-btn"
                    title="Gerenciar operadores e licenças da empresa"
                  >
                    <Users size={14} />
                    Equipe & Licenças
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    className={styles.navBtnSecondary}
                    onClick={onLogout}
                    id="nav-logout-btn"
                  >
                    Sair
                  </button>
                )}
                <button 
                  type="button" 
                  className={styles.navBtnPrimary}
                  onClick={handleStart}
                  id="nav-start-btn"
                >
                  Nova vistoria
                  <ArrowRight size={14} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.navBtnSecondary}
                  onClick={onGoToLogin || handleStart}
                  id="nav-login-btn"
                >
                  Entrar
                </button>
                <button 
                  type="button" 
                  className={styles.navBtnPrimary}
                  onClick={handleStart}
                  id="nav-start-btn"
                >
                  Começar agora
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className={styles.mobileMenuToggle}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className={styles.mobileNavMenu} id="mobile-nav-menu">
            <a href="#como-funciona" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Como funciona</a>
            <a href="#segmentos" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Para quem é</a>
            <a href="#precos" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Planos</a>
            <a href="#faq" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>Dúvidas</a>
            {!user && (
              <button
                type="button"
                className={styles.mobileNavAction}
                onClick={() => {
                  setMobileMenuOpen(false);
                  (onGoToLogin || handleStart)();
                }}
              >
                Entrar
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Hero V3: composição editável inspirada na referência aprovada */}
      <section className={styles.heroSection} id="hero-section">
        <div className={styles.heroV3Shell}>
          <div className={styles.heroV3Topline}>
            <div className={styles.heroV3Institutional}>
              <span className={styles.heroV3InstitutionalMark}>SURVEY</span>
              <span>INSPEÇÕES QUE GERAM CONFIANÇA</span>
            </div>
            <span className={styles.heroV3TopMicrocopy}>MAIS CONTROLE. MAIS EFICIÊNCIA. MAIS RESULTADOS.</span>
          </div>

          <div className={styles.heroV3Main}>
            <div className={styles.heroV3Copy}>
              <span className={styles.heroV3Eyebrow}>
                <ShieldCheck size={14} aria-hidden="true" />
                Plataforma de inspeção veicular
              </span>

              <h1 className={styles.heroV3Title}>
                Da entrada ao histórico, <span>tudo organizado.</span>
              </h1>

              <p className={styles.heroV3Subtitle}>
                Checklist, evidências e rastreabilidade em um só lugar para inspeções veiculares mais rápidas, seguras e confiáveis.
              </p>

              <div className={styles.heroButtonGroup}>
                <button
                  type="button"
                  id="hero-start-btn"
                  className={`${styles.primaryBtn} ${styles.heroV3PrimaryBtn}`}
                  onClick={handleStart}
                >
                  Começar agora
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  id="hero-demo-btn"
                  className={`${styles.secondaryBtn} ${styles.heroV3SecondaryBtn}`}
                  onClick={handleDemo}
                >
                  <Sparkles size={16} />
                  Ver o SURVEY funcionando
                </button>
              </div>

              <div className={styles.heroV3Values} aria-label="Valores da plataforma">
                <span><CheckCircle2 size={15} aria-hidden="true" />Processos mais ágeis</span>
                <span><CheckCircle2 size={15} aria-hidden="true" />Mais conformidade</span>
                <span><CheckCircle2 size={15} aria-hidden="true" />Decisões com dados</span>
              </div>
            </div>

            <div className={styles.heroV3Visual} aria-label="Demonstração visual do dashboard e checklist SURVEY">
              <div className={styles.heroV3Glow} aria-hidden="true" />

              <div className={styles.heroV3Laptop} role="img" aria-label="Dashboard SURVEY em um notebook">
                <div className={styles.heroV3LaptopLid}>
                  <div className={styles.heroV3LaptopCamera} />
                  <div className={styles.heroV3LaptopScreen}>
                    <aside className={styles.heroV3DashboardSidebar}>
                      <div className={styles.heroV3DashboardBrand}>
                        <span className={styles.heroV3DashboardLogo}>S</span>
                        <strong>SURVEY</strong>
                      </div>
                      <span className={styles.heroV3SidebarSection}>MENU</span>
                      <div className={`${styles.heroV3SidebarItem} ${styles.heroV3SidebarItemActive}`}><Layers size={13} /> Início</div>
                      <div className={styles.heroV3SidebarItem}><ClipboardCheck size={13} /> Inspeções</div>
                      <div className={styles.heroV3SidebarItem}><Car size={13} /> Veículos</div>
                      <div className={styles.heroV3SidebarItem}><Users size={13} /> Clientes</div>
                      <div className={styles.heroV3SidebarItem}><Building2 size={13} /> Unidades</div>
                      <div className={styles.heroV3SidebarItem}><FileText size={13} /> Relatórios</div>
                      <div className={styles.heroV3SidebarItem}><Lock size={13} /> Configurações</div>
                    </aside>

                    <div className={styles.heroV3DashboardContent}>
                      <div className={styles.heroV3DashboardHeader}>
                        <div>
                          <span className={styles.heroV3DashboardKicker}>VISÃO OPERACIONAL</span>
                          <strong>Boa tarde, Carlos!</strong>
                          <small>Acompanhe suas inspeções em um só lugar.</small>
                        </div>
                        <span className={styles.heroV3Avatar}>CM</span>
                      </div>

                      <div className={styles.heroV3DashboardStats}>
                        <div><span>Inspeções</span><strong>124</strong><small><TrendingDown size={10} /> 12% este mês</small></div>
                        <div><span>Em andamento</span><strong>18</strong><small><Clock size={10} /> Atualizado agora</small></div>
                        <div><span>Concluídas hoje</span><strong>06</strong><small><CheckCircle2 size={10} /> Tudo em dia</small></div>
                      </div>

                      <div className={styles.heroV3RecentHeader}>
                        <strong>Inspeções recentes</strong>
                        <span>Ver todas <ArrowRight size={11} /></span>
                      </div>
                      <div className={styles.heroV3InspectionTable}>
                        <div className={styles.heroV3TableRow}><span><b className={styles.heroV3CarDot} /> Civic EXL 2.0</span><small>BRA2E19</small><em className={styles.heroV3TableDone}>Concluída</em></div>
                        <div className={styles.heroV3TableRow}><span><b className={styles.heroV3CarDot} /> Corolla XEi</span><small>RTA4J82</small><em className={styles.heroV3TableProgress}>Em andamento</em></div>
                        <div className={styles.heroV3TableRow}><span><b className={styles.heroV3CarDot} /> Onix Premier</span><small>QWE7C16</small><em className={styles.heroV3TableDone}>Concluída</em></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.heroV3LaptopBase}><span /></div>
              </div>

              <div className={styles.heroV3SideNote} aria-hidden="true">
                <span>VEÍCULOS MAIS SEGUROS</span>
                <strong>NEGÓCIOS<br />MAIS FORTES</strong>
                <div className={styles.heroV3SideLine} />
              </div>

              <div className={styles.heroV3Phone} role="img" aria-label="Checklist de inspeção SURVEY em um smartphone">
                <div className={styles.heroV3PhoneNotch} />
                <div className={styles.heroV3PhoneScreen}>
                  <div className={styles.heroV3PhoneHeader}><ArrowRight size={12} className={styles.heroV3PhoneBack} /><strong>Inspeção</strong><span>•••</span></div>
                  <div className={styles.heroV3PhoneVehicle}><Car size={17} /><div><strong>Civic EXL 2.0</strong><small>BRA2E19 • Entrada</small></div></div>
                  <div className={styles.heroV3PhoneOperator}><span>Operador</span><strong>Carlos M.</strong></div>
                  <div className={styles.heroV3PhoneProgress}><div><span>Progresso da inspeção</span><strong>2 de 6</strong></div><i><b /></i></div>
                  <div className={styles.heroV3ChecklistHeader}><strong>Parte externa</strong><span>2/3</span></div>
                  <div className={styles.heroV3ChecklistItem}><span className={styles.heroV3CheckMark}><Check size={10} /></span><span>Identificação</span><em className={styles.heroV3PhoneOk}>Conforme</em></div>
                  <div className={styles.heroV3ChecklistItem}><span className={styles.heroV3AttentionMark}>!</span><span>Parte externa</span><em className={styles.heroV3PhoneAttention}>Atenção</em></div>
                  <div className={styles.heroV3ChecklistItem}><span className={styles.heroV3EmptyMark}>3</span><span>Parte interna</span><em className={styles.heroV3PhonePending}>Não conforme</em></div>
                  <div className={styles.heroV3PhonePhotos}><span><Camera size={11} /></span><span><Camera size={11} /></span><small>+2 fotos</small></div>
                  <span className={styles.heroV3PhoneAction}>Próximo item <ArrowRight size={12} /></span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.heroV3Flow} aria-label="Etapas do processo SURVEY">
            <div className={styles.heroV3FlowCard}>
              <span className={styles.heroV3FlowNumber}>01</span><div className={styles.heroV3FlowIcon}><Car size={16} /></div>
              <div><strong>Veículo chegou</strong><p>Identifique o veículo e registre a entrada.</p></div>
            </div>
            <ArrowRight className={styles.heroV3FlowArrow} size={18} aria-hidden="true" />
            <div className={styles.heroV3FlowCard}>
              <span className={styles.heroV3FlowNumber}>02</span><div className={styles.heroV3FlowIcon}><ClipboardCheck size={16} /></div>
              <div><strong>Abre a inspeção</strong><p>Inicie uma nova inspeção no sistema.</p></div>
            </div>
            <ArrowRight className={styles.heroV3FlowArrow} size={18} aria-hidden="true" />
            <div className={styles.heroV3FlowCard}>
              <span className={styles.heroV3FlowNumber}>03</span><div className={styles.heroV3FlowIcon}><CheckCircle2 size={16} /></div>
              <div><strong>Segue checklist</strong><p>Responda os itens de forma guiada.</p></div>
            </div>
            <ArrowRight className={styles.heroV3FlowArrow} size={18} aria-hidden="true" />
            <div className={styles.heroV3FlowCard}>
              <span className={styles.heroV3FlowNumber}>04</span><div className={styles.heroV3FlowIcon}><Camera size={16} /></div>
              <div><strong>Registra fotos e respostas</strong><p>Anexe evidências e registre observações.</p></div>
            </div>
            <ArrowRight className={styles.heroV3FlowArrow} size={18} aria-hidden="true" />
            <div className={styles.heroV3FlowCard}>
              <span className={styles.heroV3FlowNumber}>05</span><div className={styles.heroV3FlowIcon}><History size={16} /></div>
              <div><strong>Salva histórico</strong><p>Tudo fica registrado e rastreável para consultas futuras.</p></div>
            </div>
          </div>

          <div className={styles.heroV3Bottomline}>
            <span>SURVEY | INSPEÇÃO VEICULAR INTELIGENTE</span>
            <span>PESSOAS &gt; PROCESSOS &gt; CONFIANÇA</span>
          </div>
        </div>
      </section>

      {/* Faixa de Valor Operacional */}
      <section className={styles.metricsStrip} id="metrics-strip">
        <div className={styles.metricsContainer}>
          <div className={styles.metricBlock}>
            <div className={styles.metricValue}>REGISTRO POR VEÍCULO</div>
            <div className={styles.metricLabel}>Cada vistoria fica vinculada ao veículo certo.</div>
          </div>
          <div className={styles.metricBlock}>
            <div className={styles.metricValue}>EVIDÊNCIAS POR ETAPA</div>
            <div className={styles.metricLabel}>Fotos e respostas ficam ligadas ao item vistoriado.</div>
          </div>
          <div className={styles.metricBlock}>
            <div className={styles.metricValue}>RESPONSÁVEL IDENTIFICADO</div>
            <div className={styles.metricLabel}>Saiba quem realizou cada inspeção.</div>
          </div>
          <div className={styles.metricBlock}>
            <div className={styles.metricValue}>HISTÓRICO CONSULTÁVEL</div>
            <div className={styles.metricLabel}>Consulte depois o que foi registrado na entrada ou saída.</div>
          </div>
        </div>
      </section>

      {/* O problema operacional */}
      <section className={styles.problemSection} id="problema">
        <div className={styles.problemContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>O ponto de partida</span>
            <h2 className={styles.sectionTitle}>Sua operação ainda depende de informação espalhada?</h2>
            <p className={styles.sectionSubtitle}>
              Quando a vistoria fica dividida entre papel, WhatsApp, planilhas e memória da equipe, recuperar o estado real do veículo depois se torna difícil.
            </p>
          </div>

          <div className={styles.problemTags} role="list" aria-label="Exemplos de registros espalhados">
            {['Foto no WhatsApp', 'Observação em papel', 'Planilha incompleta', 'Galeria do celular', 'Áudio perdido', 'Memória da equipe', 'Vistoria sem padrão'].map((item) => (
              <span className={styles.problemTag} role="listitem" key={item}>
                <AlertTriangle size={16} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>

          <p className={styles.problemTransition}>
            O SURVEY transforma esses registros soltos em um processo único e rastreável.
          </p>
        </div>
      </section>

      {/* Processo visual */}
      <section className={styles.storySection} id="processo">
        <div className={styles.storyContainer}>
          <div className={styles.storyCopy}>
            <span className={styles.sectionEyebrow}>Processo organizado</span>
            <h2 className={styles.storyTitle}>Da entrada ao histórico, tudo organizado.</h2>
            <p className={styles.storyText}>
              O veículo chega, a inspeção é aberta, a equipe segue o checklist e cada evidência fica vinculada ao registro certo.
            </p>
            <div className={styles.storySignal}>
              <CheckCircle2 size={18} />
              <span>Um fluxo claro para registrar e consultar.</span>
            </div>
          </div>
          <div className={styles.storyMedia}>
            <img
              src="/assets/landing/survey-process-overview.webp"
              alt="Visão geral do SURVEY com inspeção no desktop e no celular"
              width={1672}
              height={941}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Como Funciona em 3 Passos */}
      <section className={styles.stepsSection} id="como-funciona">
        <div className={styles.stepsContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Simples e Rápido</span>
            <h2 className={styles.sectionTitle}>Como sua equipe começa a vistoriar em 3 passos</h2>
            <p className={styles.sectionSubtitle}>
              Sem treinamentos complexos. Criado para ser usado no pátio com apenas uma mão.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepBadgeNum}>1</div>
              <h3 className={styles.stepTitle}>Identifique o Veículo</h3>
              <p className={styles.stepDesc}>
                Digite a placa do carro e selecione o modelo de vistoria adequado para a operação (Entrada Rápida, Preventiva ou Completa).
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepBadgeNum}>2</div>
              <h3 className={styles.stepTitle}>Checklist Guiado no Celular</h3>
              <p className={styles.stepDesc}>
                O operador checa os componentes em cards curtos: Pneus, Faróis, Lataria e Combustível. Ao finalizar uma etapa, o próximo card se abre na hora.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepBadgeNum}>3</div>
              <h3 className={styles.stepTitle}>Laudo Digital Concluído</h3>
              <p className={styles.stepDesc}>
                A vistoria é finalizada com carimbo de horário, identificação do operador e sincronização segura com o banco de dados da sua empresa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Operação no celular */}
      <section className={styles.storySection} id="mobile-processo">
        <div className={`${styles.storyContainer} ${styles.storyContainerReverse}`}>
          <div className={styles.storyCopy}>
            <span className={styles.sectionEyebrow}>Feito para a equipe</span>
            <h2 className={styles.storyTitle}>Feito para vistoriar, não para preencher formulário.</h2>
            <p className={styles.storyText}>
              Em vez de um formulário gigante, o operador percorre cards curtos no celular, um item por vez.
            </p>
            <div className={styles.flowSteps} aria-label="Fluxo da vistoria">
              <span>Pneus</span>
              <ArrowRight size={15} aria-hidden="true" />
              <span>Faróis</span>
              <ArrowRight size={15} aria-hidden="true" />
              <span>Lataria</span>
              <ArrowRight size={15} aria-hidden="true" />
              <span>Interior</span>
              <ArrowRight size={15} aria-hidden="true" />
              <span>Motor</span>
            </div>
            <p className={styles.storyNote}>
              Fotos, respostas e observações ficam registradas dentro da etapa correspondente.
            </p>
          </div>
          <div className={styles.storyMedia}>
            <img
              src="/assets/landing/survey-mobile-inspection.webp"
              alt="Checklist de vistoria sendo preenchido no celular"
              width={1448}
              height={1086}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Recursos Desenvolvidos para o Pátio */}
      <section className={styles.featuresSection} id="features-section">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Funcionalidades Operacionais</span>
          <h2 className={styles.sectionTitle}>Tudo o que sua equipe precisa, sem complexidade inútil</h2>
          <p className={styles.sectionSubtitle}>
            Desenhado para ser eficiente e direto ao ponto, eliminando distrações e retrabalho.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard} id="feat-steps">
            <div className={styles.featureIconWrapper}>
              <Layers size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>1 Card Aberto por Vez</h3>
            <p className={styles.featureCardDesc}>
              Evite formulários cansativos com 50 campos na mesma tela. O sistema foca no componente atual e guia o vistoriador até a conclusão.
            </p>
          </div>

          <div className={styles.featureCard} id="feat-photos">
            <div className={styles.featureIconWrapper}>
              <Camera size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Evidências por Item</h3>
            <p className={styles.featureCardDesc}>
              Cada evidência fica atrelada diretamente ao componente conferido, impedindo que fotos fiquem misturadas ou perdidas.
            </p>
          </div>

          <div className={styles.featureCard} id="feat-history">
            <div className={styles.featureIconWrapper}>
              <History size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Histórico Imediato por Placa</h3>
            <p className={styles.featureCardDesc}>
              Consulte vistorias passadas a qualquer momento para comprovar o estado anterior do veículo em caso de dúvidas do cliente.
            </p>
          </div>

          <div className={styles.featureCard} id="feat-multitenant">
            <div className={styles.featureIconWrapper}>
              <Building2 size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Multiempresa e Multiusuário</h3>
            <p className={styles.featureCardDesc}>
              Controle de acesso seguro por filial e operador. Cada oficina ou filial acessa somente suas próprias vistorias.
            </p>
          </div>

          <div className={styles.featureCard} id="feat-mobile">
            <div className={styles.featureIconWrapper}>
              <Smartphone size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Mobile-First de Verdade</h3>
            <p className={styles.featureCardDesc}>
              Botões generosos com área de toque mínima de 44px, contraste elevado para luz do sol no pátio e navegação fluida.
            </p>
          </div>

          <div className={styles.featureCard} id="feat-cloud">
            <div className={styles.featureIconWrapper}>
              <Lock size={22} />
            </div>
            <h3 className={styles.featureCardTitle}>Segurança e Conformidade</h3>
            <p className={styles.featureCardDesc}>
              Respostas estruturadas em tipos estritos (Boolean, Texto, Número, Opção Única e Múltipla) integradas a banco na nuvem.
            </p>
          </div>
        </div>
      </section>

      {/* Uso real em campo */}
      <section className={styles.storySection} id="uso-real">
        <div className={styles.storyContainer}>
          <div className={styles.storyCopy}>
            <span className={styles.sectionEyebrow}>Uso real</span>
            <h2 className={styles.storyTitle}>Registre a condição real do veículo no momento certo.</h2>
            <p className={styles.storyText}>
              A inspeção acontece onde o veículo está: no pátio, na oficina, na entrega ou no recebimento.
            </p>
            <ul className={styles.storyChecklist}>
              <li><Check size={16} /> Veículo identificado</li>
              <li><Check size={16} /> Operador identificado</li>
              <li><Check size={16} /> Data e hora</li>
              <li><Check size={16} /> Checklist utilizado</li>
              <li><Check size={16} /> Evidências vinculadas</li>
            </ul>
          </div>
          <div className={styles.storyMedia}>
            <img
              src="/assets/landing/survey-field-inspection.webp"
              alt="Vistoriador fotografando um veículo no pátio"
              width={1448}
              height={1086}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Rastreabilidade e histórico */}
      <section className={`${styles.storySection} ${styles.storySectionMuted}`} id="rastreabilidade">
        <div className={`${styles.storyContainer} ${styles.storyContainerReverse}`}>
          <div className={styles.storyCopy}>
            <span className={styles.sectionEyebrow}>Rastreabilidade</span>
            <h2 className={styles.storyTitle}>Foto sozinha não é histórico.</h2>
            <p className={styles.storyText}>
              Uma imagem na galeria mostra apenas uma foto. No SURVEY, a evidência pertence ao contexto certo.
            </p>
            <div className={styles.traceChain} aria-label="Cadeia de contexto da evidência">
              {['Veículo', 'Vistoria', 'Item', 'Operador', 'Filial', 'Data'].map((item, index, items) => (
                <React.Fragment key={item}>
                  <span className={styles.traceStep}>{item}</span>
                  {index < items.length - 1 && <ArrowRight size={14} aria-hidden="true" />}
                </React.Fragment>
              ))}
            </div>
            <p className={styles.storyNote}>
              Quando surgir uma dúvida, a empresa encontra o registro completo em vez de procurar arquivos espalhados.
            </p>
          </div>
          <div className={styles.storyMedia}>
            <img
              src="/assets/landing/survey-history-dashboard.webp"
              alt="Dashboard do histórico de inspeções por veículo"
              width={1448}
              height={1086}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Visão do proprietário */}
      <section className={styles.ownerSection} id="visao-operacional">
        <div className={styles.ownerContainer}>
          <div className={styles.ownerIcon} aria-hidden="true"><Building2 size={24} /></div>
          <div>
            <span className={styles.sectionEyebrow}>Para quem acompanha a operação</span>
            <h2 className={styles.storyTitle}>Você deixa de depender do “eu conferi”.</h2>
            <p className={styles.storyText}>
              Tenha um registro estruturado de quem realizou a vistoria, quando ela aconteceu e o que foi encontrado.
            </p>
            <div className={styles.ownerPillars}>
              {['Controle da operação', 'Histórico', 'Equipe identificada', 'Consulta por veículo', 'Visão por filial'].map((item) => (
                <span key={item}><Check size={15} /> {item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Para Quem É (Segmentos Específicos com Dores Mapeadas) */}
      <section className={styles.audienceSection} id="segmentos">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Especialidades</span>
          <h2 className={styles.sectionTitle}>Desenvolvido sob medida para seu tipo de negócio</h2>
          <p className={styles.sectionSubtitle}>
            Se sua empresa recebe, manuseia e libera veículos de clientes ou frotas, o SURVEY organiza o processo.
          </p>
        </div>

        <div className={styles.audienceGrid}>
          <div className={styles.audienceCard} id="aud-oficina">
            <Wrench size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Oficinas & Centros Automotivos</h3>
            <p className={styles.audienceDesc}>
              Registre a entrada, os itens observados e as evidências antes do serviço começar.
            </p>
          </div>

          <div className={styles.audienceCard} id="aud-loja">
            <Car size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Lojas de Seminovos</h3>
            <p className={styles.audienceDesc}>
              Padronize o check-in de compra, troca ou consignação e mantenha o histórico por veículo.
            </p>
          </div>

          <div className={styles.audienceCard} id="aud-locadora">
            <ClipboardCheck size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Locadoras de Veículos</h3>
            <p className={styles.audienceDesc}>
              Conecte entrada e saída com conferência de estepe, ferramentas, combustível e hodômetro.
            </p>
          </div>

          <div className={styles.audienceCard} id="aud-frota">
            <Building2 size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Gestão de Frotas</h3>
            <p className={styles.audienceDesc}>
              Acompanhe trocas de condutores com registros organizados por unidade, veículo e responsável.
            </p>
          </div>

          <div className={styles.audienceCard} id="aud-estetica">
            <ShieldCheck size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Estética Automotiva & Detailing</h3>
            <p className={styles.audienceDesc}>
              Mapeie pintura, micro-riscos e peças internas antes de polimentos e vitrificações.
            </p>
          </div>
        </div>
      </section>

      {/* Seção Tabela de Preços */}
      <section className={styles.pricingSection} id="precos">
        <div className={styles.pricingContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Planos & Investimento</span>
            <h2 className={styles.sectionTitle}>Tabela de Preços Simples e Transparente</h2>
            <p className={styles.sectionSubtitle}>
              Sem surpresas na fatura. Escolha a capacidade ideal para o ritmo do seu pátio e economize no plano anual.
            </p>
            <div className={styles.billingNoticeBadge}>
              <Flame size={15} />
              <span>Economize até R$ 360/ano assinando com cobrança anual</span>
            </div>
          </div>

          <div className={styles.pricingGrid}>
            {/* Plano Starter */}
            <div className={styles.pricingCard} id="plan-starter">
              <div className={styles.planHeader}>
                <h3 className={styles.planTitle}>Starter</h3>
                <p className={styles.planSubtitle}>Ideal para autônomos</p>
              </div>

              <div className={styles.planPriceArea}>
                <div className={styles.priceWrapper}>
                  <span className={styles.priceCurrency}>R$</span>
                  <span className={styles.priceValue}>24,90</span>
                  <span className={styles.pricePeriod}>/mês</span>
                </div>
                <div className={styles.priceBillingTerm}>por mês, cobrado anualmente</div>
                <div className={styles.savingsTag}>
                  <Flame size={12} /> Economize R$60/ano
                </div>
              </div>

              <div className={styles.planSpecsBox}>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <Users size={14} color="#64748b" /> Operadores
                  </span>
                  <span className={styles.planSpecValue}>1 operador</span>
                </div>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <ClipboardCheck size={14} color="#64748b" /> Checklists/mês
                  </span>
                  <span className={styles.planSpecValue}>50 vistorias</span>
                </div>
              </div>

              <div className={styles.planFeaturesList}>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Todos os tipos de veículo</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Relatórios PDF automáticos</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Fotos e assinaturas digitais</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Funciona offline</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Dashboard em tempo real</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Suporte por e-mail</span>
                </div>
              </div>

              <button
                type="button"
                className={styles.planBtnSecondary}
                onClick={handleStart}
                id="btn-plan-starter"
              >
                Começar com Starter
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Plano Equipe */}
            <div className={styles.pricingCard} id="plan-equipe">
              <div className={styles.planHeader}>
                <h3 className={styles.planTitle}>Equipe</h3>
                <p className={styles.planSubtitle}>Perfeito para pequenas frotas</p>
              </div>

              <div className={styles.planPriceArea}>
                <div className={styles.priceWrapper}>
                  <span className={styles.priceCurrency}>R$</span>
                  <span className={styles.priceValue}>74,90</span>
                  <span className={styles.pricePeriod}>/mês</span>
                </div>
                <div className={styles.priceBillingTerm}>por mês, cobrado anualmente</div>
                <div className={styles.savingsTag}>
                  <Flame size={12} /> Economize R$180/ano
                </div>
              </div>

              <div className={styles.planSpecsBox}>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <Users size={14} color="#64748b" /> Operadores
                  </span>
                  <span className={styles.planSpecValue}>5</span>
                </div>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <ClipboardCheck size={14} color="#64748b" /> Checklists/mês
                  </span>
                  <span className={styles.planSpecValue}>250</span>
                </div>
              </div>

              <div className={styles.planFeaturesList}>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Todos os tipos de veículo</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Relatórios PDF automáticos</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Fotos e assinaturas digitais</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Funciona offline</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Dashboard em tempo real</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Suporte por e-mail & chat</span>
                </div>
              </div>

              <button
                type="button"
                className={styles.planBtnSecondary}
                onClick={handleStart}
                id="btn-plan-equipe"
              >
                Escolher Plano Equipe
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Plano Profissional (Destaque) */}
            <div className={styles.pricingCardFeatured} id="plan-profissional">
              <span className={styles.planPopularBadge}>🔥 Melhor Custo-Benefício</span>

              <div className={styles.planHeader}>
                <h3 className={styles.planTitle}>Profissional</h3>
                <p className={styles.planSubtitle}>Mais escolhido pelas empresas</p>
              </div>

              <div className={styles.planPriceArea}>
                <div className={styles.priceWrapper}>
                  <span className={styles.priceCurrency}>R$</span>
                  <span className={styles.priceValue}>159,90</span>
                  <span className={styles.pricePeriod}>/mês</span>
                </div>
                <div className={styles.priceBillingTerm}>por mês, cobrado anualmente</div>
                <div className={styles.savingsTag}>
                  <Flame size={12} /> Economize R$360/ano
                </div>
              </div>

              <div className={styles.planSpecsBox}>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <Users size={14} color="#64748b" /> Operadores
                  </span>
                  <span className={styles.planSpecValue}>10</span>
                </div>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <ClipboardCheck size={14} color="#64748b" /> Checklists/mês
                  </span>
                  <span className={styles.planSpecValue}>900</span>
                </div>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <Sparkles size={14} color="#2563eb" /> Excedente
                  </span>
                  <span className={styles.planSpecValue}>R$0,20/chk</span>
                </div>
              </div>

              <div className={styles.planFeaturesList}>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Todos os tipos de veículo</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Relatórios PDF avançados</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Fotos e assinaturas digitais</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Funciona offline</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Dashboard completo</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Suporte prioritário</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Alertas automáticos</span>
                </div>
              </div>

              <button
                type="button"
                className={styles.planBtnPrimary}
                onClick={handleStart}
                id="btn-plan-profissional"
              >
                Começar com Profissional
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Plano Enterprise */}
            <div className={styles.pricingCard} id="plan-enterprise">
              <div className={styles.planHeader}>
                <h3 className={styles.planTitle}>Enterprise</h3>
                <p className={styles.planSubtitle}>Solução corporativa</p>
              </div>

              <div className={styles.planPriceArea}>
                <div className={styles.priceWrapper}>
                  <span className={styles.priceValue} style={{ fontSize: '26px' }}>Sob consulta</span>
                </div>
                <div className={styles.priceBillingTerm}>Volume sob demanda</div>
                <div className={styles.savingsTag} style={{ backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#e2e8f0' }}>
                  Atendimento Dedicado
                </div>
              </div>

              <div className={styles.planSpecsBox}>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <Users size={14} color="#64748b" /> Operadores
                  </span>
                  <span className={styles.planSpecValue}>Personalizado</span>
                </div>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <ClipboardCheck size={14} color="#64748b" /> Checklists
                  </span>
                  <span className={styles.planSpecValue}>Sob demanda</span>
                </div>
                <div className={styles.planSpecRow}>
                  <span className={styles.planSpecLabel}>
                    <Sparkles size={14} color="#64748b" /> Excedente
                  </span>
                  <span className={styles.planSpecValue}>Negociado</span>
                </div>
              </div>

              <div className={styles.planFeaturesList}>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Múltiplas unidades</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Implantação assistida</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>SLA prioritário</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Atendimento dedicado</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Estrutura corporativa</span>
                </div>
                <div className={styles.planFeatureItem}>
                  <Check size={15} className={styles.planFeatureIcon} />
                  <span>Relatórios customizados</span>
                </div>
              </div>

              <button
                type="button"
                className={styles.planBtnOutline}
                onClick={() => {
                  setConsultPlanName('Enterprise');
                  setConsultModalOpen(true);
                }}
                id="btn-plan-enterprise"
              >
                Falar com Consultor
                <PhoneCall size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção FAQ (Perguntas Frequentes) */}
      <section className={styles.faqSection} id="faq">
        <div className={styles.faqContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Perguntas Frequentes</span>
            <h2 className={styles.sectionTitle}>Tire suas dúvidas antes de começar</h2>
            <p className={styles.sectionSubtitle}>
              Tudo o que você precisa saber sobre a implementação no seu pátio.
            </p>
          </div>

          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                <HelpCircle size={18} color="#2563eb" />
                Preciso instalar um aplicativo?
              </h3>
              <p className={styles.faqAnswer}>
                Não. O SURVEY funciona diretamente no navegador do celular, sem exigir um aplicativo separado para começar.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                <HelpCircle size={18} color="#2563eb" />
                Funciona no celular da equipe?
              </h3>
              <p className={styles.faqAnswer}>
                Sim. A interface é organizada em cards curtos e fluxo guiado para apoiar o trabalho no pátio, na oficina, na entrega ou no recebimento.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                <HelpCircle size={18} color="#2563eb" />
                Como consultar uma vistoria anterior?
              </h3>
              <p className={styles.faqAnswer}>
                O histórico organiza os registros por veículo, permitindo encontrar a vistoria e revisar seus itens, responsáveis, data e evidências.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                <HelpCircle size={18} color="#2563eb" />
                Várias filiais podem usar o SURVEY?
              </h3>
              <p className={styles.faqAnswer}>
                Sim. A operação pode organizar registros por filial e acompanhar quem realizou cada inspeção em cada unidade.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                <HelpCircle size={18} color="#2563eb" />
                As fotos ficam vinculadas à vistoria?
              </h3>
              <p className={styles.faqAnswer}>
                Sim. As evidências podem ficar associadas à etapa e ao item correspondente, junto das respostas e observações registradas.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                <HelpCircle size={18} color="#2563eb" />
                Quem pode acessar os registros?
              </h3>
              <p className={styles.faqAnswer}>
                O acesso segue os perfis e a configuração da equipe da empresa, mantendo a consulta alinhada à operação de cada unidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final com Alto Impacto */}
      <section className={styles.ctaSection} id="cta-section">
        <div className={styles.ctaContainer}>
          <span className={styles.ctaTag}>Comece Hoje Mesmo</span>
          <h2 className={styles.ctaTitle}>
            Registre como o veículo entrou. Consulte quando precisar.
          </h2>
          <p className={styles.ctaSubtitle}>
            Padronize sua operação com vistoria guiada, evidências organizadas e histórico por veículo.
          </p>

          <div className={styles.ctaActionsGroup}>
            <button
              type="button"
              id="cta-bottom-btn"
              className={styles.ctaBtnPrimary}
              onClick={handleStart}
            >
              Começar agora
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              id="cta-bottom-demo-btn"
              className={styles.ctaBtnSecondary}
              onClick={handleDemo}
            >
              Ver o SURVEY funcionando
            </button>
          </div>
        </div>
      </section>

      {/* Rodapé Corporativo */}
      <footer className={styles.footer} id="main-footer">
        <div className={styles.footerContainer}>
          <div className={styles.footerTop}>
            <div className={styles.brandLogo}>
              <span className={styles.logoBadge}>SURVEY</span>
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '15px' }}>
                Vistoria, evidências e rastreabilidade
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#94a3b8', flexWrap: 'wrap' }}>
              <a href="#como-funciona" style={{ color: 'inherit', textDecoration: 'none' }}>Como Funciona</a>
              <a href="#problema" style={{ color: 'inherit', textDecoration: 'none' }}>O problema</a>
              <a href="#segmentos" style={{ color: 'inherit', textDecoration: 'none' }}>Segmentos</a>
              <a href="#precos" style={{ color: 'inherit', textDecoration: 'none' }}>Planos & Preços</a>
              <a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>Perguntas Frequentes</a>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>SURVEY • Vistoria, evidências e rastreabilidade veicular</span>
            <span>Registros organizados para operações que trabalham com veículos.</span>
          </div>
        </div>
      </footer>

      {/* Modal de Atendimento Consultivo Enterprise */}
      {consultModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setConsultModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setConsultModalOpen(false)}
              aria-label="Fechar"
            >
              ×
            </button>

            <div style={{ marginBottom: '16px' }}>
              <span className={styles.heroTag} style={{ marginBottom: '8px' }}>
                <Building2 size={13} />
                Solução Corporativa {consultPlanName}
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
                Falar com Especialista SURVEY
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                Desenvolvemos propostas sob medida para grandes frotas, locadoras de âmbito nacional e redes de oficinas com SLA prioritário.
              </p>
            </div>

            {consultSubmitted ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                  Solicitação Recebida com Sucesso!
                </h4>
                <p style={{ fontSize: '13px', color: '#15803d', lineHeight: 1.5, marginBottom: '16px' }}>
                  Nossa equipe entrará em contato em menos de 15 minutos em horário comercial para entender seu volume e dimensionar sua implantação.
                </p>
                <button
                  type="button"
                  className={styles.planBtnPrimary}
                  onClick={() => {
                    setConsultSubmitted(false);
                    setConsultModalOpen(false);
                  }}
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setConsultSubmitted(true);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Seu E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ex: contato@suaempresa.com.br"
                    value={consultEmail}
                    onChange={(e) => setConsultEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Telefone / WhatsApp com DDD
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={consultPhone}
                    onChange={(e) => setConsultPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button type="submit" className={styles.planBtnPrimary}>
                    <Send size={15} />
                    Solicitar Proposta Comercial
                  </button>

                  <a
                    href={`https://wa.me/5511999999999?text=${encodeURIComponent('Olá! Gostaria de conversar com um especialista do SURVEY sobre o plano Enterprise.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.planBtnOutline}
                    style={{ textDecoration: 'none' }}
                  >
                    <MessageSquare size={15} color="#16a34a" />
                    Chamar direto no WhatsApp
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
