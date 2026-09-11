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
  Send
} from 'lucide-react';
import { MOCK_PHOTOS_GALLERY } from '../lib/mock-inspection-data';
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
              <span className={styles.brandTagline}>Blindagem & Rastreabilidade B2B</span>
            </div>
          </div>

          <div className={styles.navLinks}>
            <a href="#como-funciona" className={styles.navLinkItem}>Como Funciona</a>
            <a href="#antes-depois" className={styles.navLinkItem}>Antes vs Depois</a>
            <a href="#segmentos" className={styles.navLinkItem}>Para Quem É</a>
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
                  Começar vistoria
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section com Copy Forte e CTA Principal */}
      <section className={styles.heroSection} id="hero-section">
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.heroTag}>
              <ShieldCheck size={14} />
              Proteção Jurídica & Rastreabilidade Operacional
            </div>

            <h1 className={styles.heroTitle}>
              Blindagem total contra avarias não registradas e <span className={styles.heroHighlight}>prejuízos indevidos</span>.
            </h1>

            <p className={styles.heroSubtitle}>
              Substitua pranchetas sujas e fotos perdidas no WhatsApp por um checklist digital 
              padronizado. Faça a vistoria completa de entrada e saída em menos de 2 minutos pelo 
              celular e gere laudos com valor probatório imediato.
            </p>

            <div className={styles.heroButtonGroup}>
              <button
                type="button"
                id="hero-start-btn"
                className={styles.primaryBtn}
                onClick={handleStart}
              >
                Começar vistoria grátis agora
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                id="hero-demo-btn"
                className={styles.secondaryBtn}
                onClick={handleDemo}
              >
                <Sparkles size={16} color="#2563eb" />
                Ver checklist interativo
              </button>
            </div>

            <div className={styles.trustList}>
              <span className={styles.trustItem}>
                <Check size={16} className={styles.trustIcon} /> Sem cartão de crédito
              </span>
              <span className={styles.trustItem}>
                <Check size={16} className={styles.trustIcon} /> Pronto em menos de 2 minutos
              </span>
              <span className={styles.trustItem}>
                <Check size={16} className={styles.trustIcon} /> 100% no celular sem instalar app
              </span>
            </div>
          </div>

          {/* Visual Mockup: Card do Laudo Digital */}
          <div className={styles.heroCardWrapper}>
            <div className={styles.heroReportCard}>
              <div className={styles.reportCardHeader}>
                <div className={styles.reportHeaderLeft}>
                  <span className={styles.reportPlateBadge}>BRA2E19</span>
                  <span className={styles.reportCarTitle}>Civic EXL 2.0 • Entrada</span>
                </div>
                <span className={styles.reportHeaderStatus}>
                  <CheckCircle2 size={13} />
                  Vistoriado
                </span>
              </div>

              <div className={styles.reportCardBody}>
                <div className={styles.reportMetaRow}>
                  <span>Data: <strong>Hoje, 14:38</strong></span>
                  <span>Operador: <strong>Carlos M. (Pátio 01)</strong></span>
                </div>

                <div className={styles.reportItemsList}>
                  <div className={styles.reportItemRow}>
                    <div className={styles.reportItemInfo}>
                      <CheckCircle2 size={15} color="#16a34a" />
                      <span>Pneus & Rodas (Sulco / TWI)</span>
                    </div>
                    <span className={styles.badgeOk}>Conforme (Novos)</span>
                  </div>

                  <div className={styles.reportItemRow}>
                    <div className={styles.reportItemInfo}>
                      <CheckCircle2 size={15} color="#16a34a" />
                      <span>Faróis & Lanternas</span>
                    </div>
                    <span className={styles.badgeOk}>Sem trincas</span>
                  </div>

                  <div className={styles.reportItemRow}>
                    <div className={styles.reportItemInfo}>
                      <AlertTriangle size={15} color="#d97706" />
                      <span>Lataria (Lateral Direita)</span>
                    </div>
                    <span className={styles.badgeAlert}>1 Risco Apontado</span>
                  </div>

                  <div className={styles.reportItemRow}>
                    <div className={styles.reportItemInfo}>
                      <CheckCircle2 size={15} color="#16a34a" />
                      <span>Nível de Combustível & Km</span>
                    </div>
                    <span className={styles.badgeOk}>3/4 Tanque • 42.180 km</span>
                  </div>
                </div>
              </div>

              <div className={styles.reportCardFooter}>
                <span className={styles.reportSignatureStamp}>
                  <ShieldCheck size={14} /> Laudo Digital Autenticado
                </span>
                <span>ID: #insp_78942</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Faixa de Métricas e Impacto Real */}
      <section className={styles.metricsStrip} id="metrics-strip">
        <div className={styles.metricsContainer}>
          <div className={styles.metricBlock}>
            <div className={styles.metricValue}>-85%</div>
            <div className={styles.metricLabel}>Contestações e reclamações de avarias em oficinas e locadoras</div>
          </div>
          <div className={styles.metricBlock}>
            <div className={styles.metricValue}>1m 45s</div>
            <div className={styles.metricLabel}>Tempo médio para o vistoriador preencher a entrada completa</div>
          </div>
          <div className={styles.metricBlock}>
            <div className={styles.metricValue}>R$ 1.800+</div>
            <div className={styles.metricLabel}>Economia média mensal evitando pagar funilaria que seu time não causou</div>
          </div>
          <div className={styles.metricBlock}>
            <div className={styles.metricValue}>100%</div>
            <div className={styles.metricLabel}>Rastreabilidade digital com fotos e respostas vinculadas na nuvem</div>
          </div>
        </div>
      </section>

      {/* Seção Antes vs Depois (O Fim do Caos Operacional) */}
      <section className={styles.comparisonSection} id="antes-depois">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionEyebrow}>Comparativo Direto</span>
          <h2 className={styles.sectionTitle}>Por que as melhores operações aposentaram a prancheta de papel?</h2>
          <p className={styles.sectionSubtitle}>
            Veja a diferença entre depender de improvisos e ter um processo profissional com o SURVEY.
          </p>
        </div>

        <div className={styles.comparisonGrid}>
          {/* O Risco do Método Antigo */}
          <div className={styles.comparisonColOld}>
            <div className={styles.colHeaderOld}>
              <X size={24} />
              <h3 className={styles.colTitleOld}>O Risco do Papel & WhatsApp</h3>
            </div>
            <div className={styles.comparisonList}>
              <div className={styles.comparisonItemOld}>
                <X size={18} className={styles.iconNegative} />
                <span><strong>Prejuízo em funilaria:</strong> O cliente alega que o risco na porta foi feito dentro da sua oficina e você é obrigado a pagar a pintura para não perder o cliente.</span>
              </div>
              <div className={styles.comparisonItemOld}>
                <X size={18} className={styles.iconNegative} />
                <span><strong>Fotos perdidas:</strong> Imagens dispersas na galeria do celular particular do mecânico ou no meio de conversas de WhatsApp sem organização.</span>
              </div>
              <div className={styles.comparisonItemOld}>
                <X size={18} className={styles.iconNegative} />
                <span><strong>Checklists ilegíveis:</strong> Folhas de papel molhadas, rasgadas, com manchas de óleo ou esquecidas em gavetas quando você mais precisa provar algo.</span>
              </div>
              <div className={styles.comparisonItemOld}>
                <X size={18} className={styles.iconNegative} />
                <span><strong>Falta de padrão:</strong> Cada operador confere o carro de um jeito; itens cruciais como estepe, manual e ferramentas passam despercebidos.</span>
              </div>
            </div>
          </div>

          {/* O Padrão SURVEY */}
          <div className={styles.comparisonColNew}>
            <span className={styles.newBadgePopular}>Recomendado</span>
            <div className={styles.colHeaderNew}>
              <Check size={24} />
              <h3 className={styles.colTitleNew}>A Segurança com o SURVEY</h3>
            </div>
            <div className={styles.comparisonList}>
              <div className={styles.comparisonItemNew}>
                <Check size={18} className={styles.iconPositive} />
                <span><strong>Blindagem jurídica imediata:</strong> Registro fotográfico e laudo datado no ato do check-in com apontamento claro das avarias pré-existentes.</span>
              </div>
              <div className={styles.comparisonItemNew}>
                <Check size={18} className={styles.iconPositive} />
                <span><strong>Fotos vinculadas ao componente:</strong> As fotos de pneus, lataria e faróis ficam indexadas direto no item certo, prontas para auditoria.</span>
              </div>
              <div className={styles.comparisonItemNew}>
                <Check size={18} className={styles.iconPositive} />
                <span><strong>Histórico pesquisável em segundos:</strong> Digite a placa do carro no sistema e veja instantaneamente todo o histórico de entradas e saídas.</span>
              </div>
              <div className={styles.comparisonItemNew}>
                <Check size={18} className={styles.iconPositive} />
                <span><strong>Interface passo a passo sem rolagem:</strong> O operador visualiza 1 card por vez na tela do celular; concluiu, avança automaticamente.</span>
              </div>
            </div>
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

      {/* Visual Showcase com Fotos de Vistoria */}
      <section className={styles.visualShowcaseSection} id="visual-showcase-section">
        <div className={styles.showcaseContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Comprovação Visual</span>
            <h2 className={styles.sectionTitle}>Registro de alta precisão sem margem para dúvidas</h2>
            <p className={styles.sectionSubtitle}>
              Simulação de inspeção fotográfica com data e hora vinculada para cada componente.
            </p>
          </div>

          <div className={styles.showcaseGrid}>
            <div className={styles.showcaseCard} id="showcase-pneus">
              <div className={styles.showcaseImageMock}>
                <img
                  src={MOCK_PHOTOS_GALLERY.pneus.url}
                  alt="Vistoria de Pneus"
                  className={styles.showcaseImg}
                />
              </div>
              <div className={styles.showcaseBody}>
                <span className={styles.showcaseTag}>Item 01 • Rodas & Pneus</span>
                <h3 className={styles.showcaseItemTitle}>Conferência de TWI e Sulcos</h3>
                <p className={styles.showcaseItemDesc}>
                  Evidência com registro de data e integridade dos pneus dianteiros e traseiros.
                </p>
              </div>
            </div>

            <div className={styles.showcaseCard} id="showcase-lataria">
              <div className={styles.showcaseImageMock}>
                <img
                  src={MOCK_PHOTOS_GALLERY.lataria.url}
                  alt="Vistoria de Lataria"
                  className={styles.showcaseImg}
                />
              </div>
              <div className={styles.showcaseBody}>
                <span className={styles.showcaseTag}>Item 02 • Lataria & Pintura</span>
                <h3 className={styles.showcaseItemTitle}>Apontamento Prévia de Riscos</h3>
                <p className={styles.showcaseItemDesc}>
                  Demarcação de pequenos arranhões e mossas antes da entrada do carro no box.
                </p>
              </div>
            </div>

            <div className={styles.showcaseCard} id="showcase-farois">
              <div className={styles.showcaseImageMock}>
                <img
                  src={MOCK_PHOTOS_GALLERY.farois.url}
                  alt="Vistoria de Faróis"
                  className={styles.showcaseImg}
                />
              </div>
              <div className={styles.showcaseBody}>
                <span className={styles.showcaseTag}>Item 03 • Iluminação</span>
                <h3 className={styles.showcaseItemTitle}>Conjunto Óptico e Lentes</h3>
                <p className={styles.showcaseItemDesc}>
                  Comprovação do estado das lentes de faróis e lanternas na entrega do veículo.
                </p>
              </div>
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
            Se sua empresa recebe, manuseia e libera veículos de clientes ou frotas, o SURVEY é indispensável.
          </p>
        </div>

        <div className={styles.audienceGrid}>
          <div className={styles.audienceCard} id="aud-oficina">
            <Wrench size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Oficinas & Centros Automotivos</h3>
            <p className={styles.audienceDesc}>
              Blinde seu faturamento contra clientes que exigem pintura de riscos que já estavam no veículo antes do conserto.
            </p>
          </div>

          <div className={styles.audienceCard} id="aud-loja">
            <Car size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Lojas de Seminovos</h3>
            <p className={styles.audienceDesc}>
              Check-in rigoroso de compra, troca ou consignação, documentando originalidade e pendências mecânicas.
            </p>
          </div>

          <div className={styles.audienceCard} id="aud-locadora">
            <ClipboardCheck size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Locadoras de Veículos</h3>
            <p className={styles.audienceDesc}>
              Check-in e check-out em 90 segundos com conferência de estepe, ferramentas, combustível e hodômetro.
            </p>
          </div>

          <div className={styles.audienceCard} id="aud-frota">
            <Building2 size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Gestão de Frotas</h3>
            <p className={styles.audienceDesc}>
              Acompanhamento de trocas de condutores com termo de custódia claro para preservar o patrimônio da empresa.
            </p>
          </div>

          <div className={styles.audienceCard} id="aud-estetica">
            <ShieldCheck size={26} className={styles.audienceIcon} />
            <h3 className={styles.audienceTitle}>Estética Automotiva & Detailing</h3>
            <p className={styles.audienceDesc}>
              Mapeie o estado da pintura, micro-riscos e peças internas antes de polimentos e vitrificações de alto valor.
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
                Preciso baixar algum aplicativo pesado da loja no celular?
              </h3>
              <p className={styles.faqAnswer}>
                Não! O SURVEY roda diretamente no navegador do celular (Chrome, Safari, etc.) com tecnologia web moderna. Não ocupa espaço na memória do aparelho do mecânico e funciona de forma instantânea.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                <HelpCircle size={18} color="#2563eb" />
                Um mecânico ou vistoriador sem conhecimento técnico consegue usar?
              </h3>
              <p className={styles.faqAnswer}>
                Com certeza. O sistema foi projetado com foco em ergonomia: apenas 1 card por vez na tela, botões grandes e fluxo guiado. Ao marcar OK ou Não OK, o sistema já avança automaticamente para a próxima etapa.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                <HelpCircle size={18} color="#2563eb" />
                O que acontece se um cliente questionar uma avaria após a entrega?
              </h3>
              <p className={styles.faqAnswer}>
                Basta digitar a placa do carro no histórico do SURVEY. O laudo digital com data, hora e fotos do momento em que o veículo deu entrada estará disponível para consulta imediata, comprovando a condição original.
              </p>
            </div>

            <div className={styles.faqItem}>
              <h3 className={styles.faqQuestion}>
                <HelpCircle size={18} color="#2563eb" />
                Minha empresa possui mais de uma filial ou oficina. Posso gerenciar todas?
              </h3>
              <p className={styles.faqAnswer}>
                Sim. A arquitetura multiempresa permite separar dados de cada filial, atribuir operadores responsáveis e manter a organização dos laudos centralizada com segurança.
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
            Proteja sua operação contra prejuízos e profissionalize seu pátio agora.
          </h2>
          <p className={styles.ctaSubtitle}>
            Junte-se a oficinas, locadoras e centros automotivos que eliminaram o papel e ganharam segurança jurídica definitiva.
          </p>

          <div className={styles.ctaActionsGroup}>
            <button
              type="button"
              id="cta-bottom-btn"
              className={styles.ctaBtnPrimary}
              onClick={handleStart}
            >
              Começar vistoria grátis agora
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              id="cta-bottom-demo-btn"
              className={styles.ctaBtnSecondary}
              onClick={handleDemo}
            >
              Ver demonstração interativa
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
                Vistoria Veicular Digital
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#94a3b8', flexWrap: 'wrap' }}>
              <a href="#como-funciona" style={{ color: 'inherit', textDecoration: 'none' }}>Como Funciona</a>
              <a href="#antes-depois" style={{ color: 'inherit', textDecoration: 'none' }}>Vantagens</a>
              <a href="#segmentos" style={{ color: 'inherit', textDecoration: 'none' }}>Segmentos</a>
              <a href="#precos" style={{ color: 'inherit', textDecoration: 'none' }}>Planos & Preços</a>
              <a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>Perguntas Frequentes</a>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>SURVEY • Sistema B2B de Vistoria, Identificação e Rastreabilidade de Veículos</span>
            <span>Todos os direitos reservados • Ambiente seguro e criptografado</span>
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
