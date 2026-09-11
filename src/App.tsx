import React, { useState } from 'react';
import LandingPage from '../app/page';
import { TemplateSelector } from '../components/inspection/template-selector';
import { ChecklistScreen } from '../components/inspection/checklist-screen';
import { AuthScreens, AuthenticatedUser, AuthScreenType } from '../components/auth/auth-screens';
import { TeamManagement } from '../components/team/team-management';
import { OwnerDashboard } from '../components/owner/owner-dashboard';
import { INITIAL_INSPECTION_MOCK, MOCK_TEMPLATES } from '../lib/mock-inspection-data';
import { Inspection, InspectionTemplate } from '../lib/inspection-types';
import { Smartphone, Monitor, Compass, RotateCcw, UserCheck, LogIn, Users, Sparkles, ShieldAlert, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/theme-context';

type CurrentRoute = 'landing' | 'login' | 'register' | 'forgot-password' | 'dashboard' | 'team' | 'template' | 'checklist';

export default function App() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [currentRoute, setCurrentRoute] = useState<CurrentRoute>('landing');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-completa');
  const [isMobilePreviewMode, setIsMobilePreviewMode] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);

  // Controle de ciclo de teste único (Ambiente Sandbox)
  const [testCycleCompleted, setTestCycleCompleted] = useState<boolean>(false);
  const [showTestLimitModal, setShowTestLimitModal] = useState<boolean>(false);

  // Instância de vistoria em andamento
  const [inspection, setInspection] = useState<Inspection>(INITIAL_INSPECTION_MOCK);

  // Obtém o template selecionado atualmente
  const activeTemplate = 
    MOCK_TEMPLATES.find((t) => t.id === selectedTemplateId) || MOCK_TEMPLATES[1];

  // Ação ao clicar em "Começar vistoria" na Landing Page
  const handleStartInspectionFromLanding = () => {
    if (currentUser) {
      // Se for proprietário, vai para o dashboard ou vistoria; se for operador vai direto para a vistoria
      if (currentUser.roleType === 'OWNER') {
        setCurrentRoute('dashboard');
      } else {
        setCurrentRoute('template');
      }
    } else {
      // Redireciona para a tela de login/cadastro conforme solicitado
      setCurrentRoute('login');
    }
  };

  // Sucesso na autenticação (Login, Cadastro, Google ou Estado de Testes)
  const handleAuthSuccess = (user: AuthenticatedUser) => {
    setCurrentUser(user);

    if (user.isTestMode) {
      setTestCycleCompleted(false);
      setShowTestLimitModal(false);
      // Cria estado de vistoria único e isolado para o usuário de teste
      setInspection({
        id: 'insp-sandbox-trial-01',
        vehicle: {
          plate: 'TEST-2026',
          model: 'Corolla Altis 2.0 Hybrid (Ambiente de Teste)',
          brand: 'Toyota',
          year: 2024,
          color: 'Branco Pérola',
          companyName: 'Ambiente de Testes / Sandbox',
        },
        templateId: 'tpl-completa',
        templateName: 'Vistoria Completa (Degustação)',
        operatorName: `${user.name} - Modo de Testes (1 Ciclo)`,
        status: 'IN_PROGRESS',
        startedAt:
          new Date().toLocaleDateString('pt-BR') +
          ' às ' +
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        stepStatuses: {
          'step-1': 'PENDING',
          'step-2': 'PENDING',
          'step-3': 'PENDING',
          'step-4': 'PENDING',
          'step-5': 'PENDING',
          'step-6': 'PENDING',
          'step-7': 'PENDING',
        },
        responses: {},
      });
      // Modo de teste de campo vai direto para a vistoria
      setCurrentRoute('template');
      return;
    }

    setTestCycleCompleted(false);
    setShowTestLimitModal(false);
    // Atualiza o operador responsável da vistoria com os dados autenticados do usuário regular
    setInspection((prev) => ({
      ...prev,
      operatorName: `${user.name} (${user.company || 'Operador'})`,
    }));

    // SEPARAÇÃO DE FLUXOS POR PAPEL (Diretriz do Usuário):
    // - Operador de Pátio: vai DIRETO para a vistoria de campo (seleção de modelo / checklist)
    // - Proprietário / Gestor: vai para o Painel Executivo (Dashboard, Histórico, Equipes, Controle de Logins/Acessos)
    if (user.roleType === 'OPERATOR') {
      setCurrentRoute('template');
    } else {
      setCurrentRoute('dashboard');
    }
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setTestCycleCompleted(false);
    setShowTestLimitModal(false);
    setCurrentRoute('landing');
  };

  // Iniciar vistoria a partir da seleção de template
  const handleStartInspectionFromTemplate = (templateId: string) => {
    // Se estiver no estado de testes e já completou o seu ciclo único, bloqueia novo início
    if (currentUser?.isTestMode && testCycleCompleted) {
      setShowTestLimitModal(true);
      return;
    }

    setSelectedTemplateId(templateId);
    const chosenTpl = MOCK_TEMPLATES.find((t) => t.id === templateId) || activeTemplate;

    // Inicializa status das etapas do template selecionado
    const newStepStatuses: Record<string, 'PENDING' | 'COMPLETED'> = {};
    chosenTpl.steps.forEach((s) => {
      newStepStatuses[s.id] = 'PENDING';
    });

    setInspection((prev) => ({
      ...prev,
      templateId,
      templateName: chosenTpl.name,
      stepStatuses: newStepStatuses,
      responses: {},
    }));

    setCurrentRoute('checklist');
  };

  // Concluir vistoria (registra fim do ciclo no estado de testes se aplicável)
  const handleFinishInspection = (completedInspection: Inspection) => {
    setInspection(completedInspection);
    if (currentUser?.isTestMode) {
      setTestCycleCompleted(true);
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              testCycleCompleted: true,
              testCyclesUsed: 1,
            }
          : null
      );
    }
  };

  // Resetar vistoria de teste
  const handleResetInspection = () => {
    setInspection({
      ...INITIAL_INSPECTION_MOCK,
      stepStatuses: {
        'step-1': 'COMPLETED',
        'step-2': 'COMPLETED',
        'step-3': 'PENDING',
        'step-4': 'PENDING',
        'step-5': 'PENDING',
        'step-6': 'PENDING',
        'step-7': 'PENDING',
      },
    });
    setSelectedTemplateId('tpl-completa');
    if (currentUser?.isTestMode) {
      setTestCycleCompleted(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9' }}>
      {/* Barra de Navegação e Controle do Protótipo (Simulador de Rotas do Next.js) */}
      <header
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          borderBottom: '1px solid #1e293b',
          zIndex: 100,
          flexWrap: 'wrap',
          gap: '8px',
        }}
        id="prototype-router-bar"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                backgroundColor: '#2563eb',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.5px',
              }}
            >
              SURVEY
            </span>
            <span style={{ color: '#94a3b8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Compass size={13} />
              Rota:
            </span>
          </div>

          {/* Abas de Rotas */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              type="button"
              id="route-landing-btn"
              onClick={() => setCurrentRoute('landing')}
              style={{
                backgroundColor: currentRoute === 'landing' ? '#334155' : 'transparent',
                color: currentRoute === 'landing' ? '#ffffff' : '#94a3b8',
                border: '1px solid ' + (currentRoute === 'landing' ? '#475569' : '#1e293b'),
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              1. Landing Page
            </button>

            <button
              type="button"
              id="route-login-btn"
              onClick={() => setCurrentRoute('login')}
              style={{
                backgroundColor: ['login', 'register', 'forgot-password'].includes(currentRoute) ? '#2563eb' : 'transparent',
                color: ['login', 'register', 'forgot-password'].includes(currentRoute) ? '#ffffff' : '#94a3b8',
                border: '1px solid ' + (['login', 'register', 'forgot-password'].includes(currentRoute) ? '#3b82f6' : '#1e293b'),
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <LogIn size={11} />
              2. Login & Cadastro
            </button>

            <button
              type="button"
              id="route-dashboard-btn"
              onClick={() => setCurrentRoute('dashboard')}
              style={{
                backgroundColor: currentRoute === 'dashboard' ? '#0f172a' : 'transparent',
                color: currentRoute === 'dashboard' ? '#38bdf8' : '#94a3b8',
                border: '1px solid ' + (currentRoute === 'dashboard' ? '#38bdf8' : '#1e293b'),
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <LayoutDashboard size={11} />
              3. Dashboard (Proprietário)
            </button>

            <button
              type="button"
              id="route-team-btn"
              onClick={() => setCurrentRoute('team')}
              style={{
                backgroundColor: currentRoute === 'team' ? '#2563eb' : 'transparent',
                color: currentRoute === 'team' ? '#ffffff' : '#94a3b8',
                border: '1px solid ' + (currentRoute === 'team' ? '#3b82f6' : '#1e293b'),
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Users size={11} />
              4. Equipe & Assentos
            </button>

            <button
              type="button"
              id="route-template-btn"
              onClick={() => setCurrentRoute('template')}
              style={{
                backgroundColor: currentRoute === 'template' ? '#334155' : 'transparent',
                color: currentRoute === 'template' ? '#ffffff' : '#94a3b8',
                border: '1px solid ' + (currentRoute === 'template' ? '#475569' : '#1e293b'),
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              5. Seleção Template (Operador)
            </button>

            <button
              type="button"
              id="route-checklist-btn"
              onClick={() => setCurrentRoute('checklist')}
              style={{
                backgroundColor: currentRoute === 'checklist' ? '#334155' : 'transparent',
                color: currentRoute === 'checklist' ? '#ffffff' : '#94a3b8',
                border: '1px solid ' + (currentRoute === 'checklist' ? '#475569' : '#1e293b'),
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              6. Checklist Operacional
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Status do Usuário Logado */}
          {currentUser ? (
            currentUser.isTestMode ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#78350f',
                  border: '1px solid #d97706',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#fef3c7',
                }}
                id="proto-user-status"
              >
                <Sparkles size={12} color="#fcd34d" />
                <span>
                  {currentUser.name} •{' '}
                  <strong style={{ color: testCycleCompleted ? '#fca5a5' : '#86efac' }}>
                    {testCycleCompleted ? '1 de 1 Ciclo Concluído' : 'Ciclo 1 de 1 Ativo'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fed7aa',
                    cursor: 'pointer',
                    fontSize: '10px',
                    textDecoration: 'underline',
                    paddingLeft: '4px',
                  }}
                >
                  (Sair)
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#1e293b',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#38bdf8',
                }}
                id="proto-user-status"
              >
                <UserCheck size={12} />
                <span>{currentUser.name}</span>
                <span
                  style={{
                    backgroundColor: currentUser.roleType === 'OWNER' ? '#1e3a8a' : '#064e3b',
                    color: currentUser.roleType === 'OWNER' ? '#bfdbfe' : '#a7f3d0',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}
                >
                  {currentUser.roleType === 'OWNER' ? 'Proprietário' : 'Operador'}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '10px',
                    textDecoration: 'underline',
                    paddingLeft: '4px',
                  }}
                >
                  (Sair)
                </button>
              </div>
            )
          ) : (
            <span style={{ color: '#64748b', fontSize: '11px' }}>Não autenticado</span>
          )}

          {/* Alternar Tema Claro / Escuro */}
          <button
            type="button"
            id="toggle-theme-mode-btn"
            onClick={toggleTheme}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: isDark ? '#1e293b' : '#334155',
              color: isDark ? '#fcd34d' : '#f8fafc',
              border: '1px solid ' + (isDark ? '#475569' : '#1e293b'),
              borderRadius: '4px',
              padding: '3px 9px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isDark ? 'Alternar para Tema Claro' : 'Alternar para Tema Escuro'}
          >
            {isDark ? <Sun size={13} color="#fcd34d" /> : <Moon size={13} color="#cbd5e1" />}
            <span>{isDark ? 'Tema Claro' : 'Tema Escuro'}</span>
          </button>

          {/* Alternar Modo Mobile Frame */}
          <button
            type="button"
            id="toggle-mobile-frame-btn"
            onClick={() => setIsMobilePreviewMode(!isMobilePreviewMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: isMobilePreviewMode ? '#2563eb' : '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Alternar moldura móvel para teste de usabilidade em celular"
          >
            {isMobilePreviewMode ? <Smartphone size={13} /> : <Monitor size={13} />}
            {isMobilePreviewMode ? 'Celular Ativo' : 'Simular Celular'}
          </button>

          {/* Resetar Dados */}
          <button
            type="button"
            id="btn-reset-prototype-data"
            onClick={handleResetInspection}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: 'none',
              fontSize: '11px',
              cursor: 'pointer',
            }}
            title="Resetar respostas da vistoria para o estado padrão"
          >
            <RotateCcw size={12} />
            Resetar Mock
          </button>
        </div>
      </header>

      {/* Conteúdo Renderizado (Direto ou dentro da Moldura Mobile) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: isMobilePreviewMode ? 'center' : 'stretch',
          padding: isMobilePreviewMode ? '24px 16px' : '0',
          backgroundColor: isMobilePreviewMode ? (isDark ? '#050811' : '#0b0f19') : (isDark ? '#090d16' : '#ffffff'),
          overflowY: 'auto',
          transition: 'background-color 0.2s ease',
        }}
      >
        <div
          id={isMobilePreviewMode ? 'mobile-frame-container' : 'desktop-view-container'}
          style={
            isMobilePreviewMode
              ? {
                  width: '100%',
                  maxWidth: '420px',
                  height: '840px',
                  backgroundColor: isDark ? '#090d16' : '#ffffff',
                  borderRadius: '36px',
                  overflow: 'hidden',
                  boxShadow: isDark
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 12px #1e293b'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 12px #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                }
              : {
                  width: '100%',
                  minHeight: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: isDark ? '#090d16' : '#ffffff',
                  transition: 'background-color 0.2s ease',
                }
          }
        >
          {/* Notch simulado no modo celular */}
          {isMobilePreviewMode && (
            <div
              id="mobile-frame-notch"
              style={{
                height: '24px',
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 60,
                borderBottom: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9',
              }}
            >
              <div
                style={{
                  width: '96px',
                  height: '5px',
                  backgroundColor: isDark ? '#334155' : '#cbd5e1',
                  borderRadius: '999px',
                }}
              />
            </div>
          )}

          {/* Renderização condicional por rota */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {currentRoute === 'landing' && (
              <LandingPage
                onStartInspection={handleStartInspectionFromLanding}
                onViewDemo={() => setCurrentRoute('checklist')}
                onGoToLogin={() => setCurrentRoute('login')}
                onGoToRegister={() => setCurrentRoute('register')}
                onGoToTeam={() => setCurrentRoute('team')}
                onGoToDashboard={() => setCurrentRoute('dashboard')}
                user={currentUser}
                onLogout={handleLogout}
              />
            )}

            {(currentRoute === 'login' || currentRoute === 'register' || currentRoute === 'forgot-password') && (
              <AuthScreens
                initialScreen={currentRoute as AuthScreenType}
                onSuccessAuth={handleAuthSuccess}
                onBackToLanding={() => setCurrentRoute('landing')}
              />
            )}

            {currentRoute === 'dashboard' && (
              <OwnerDashboard
                currentUser={
                  currentUser || {
                    name: 'Carlos Mendes',
                    email: 'carlos.mendes@locafrotas.com.br',
                    company: 'Locafrotas Brasil Gestão de Frotas',
                    role: 'Proprietário / Diretor',
                    roleType: 'OWNER',
                    provider: 'email',
                  }
                }
                onLogout={handleLogout}
                onStartNewInspection={() => {
                  setInspection((prev) => ({
                    ...prev,
                    operatorName: `${currentUser?.name || 'Carlos Mendes'} (Vistoria Gerencial)`,
                  }));
                  setCurrentRoute('template');
                }}
                onSimulateOperator={() => {
                  setInspection((prev) => ({
                    ...prev,
                    operatorName: 'Juliana Silva (Operadora de Pátio)',
                  }));
                  setCurrentRoute('template');
                }}
              />
            )}

            {currentRoute === 'team' && (
              <TeamManagement
                currentUser={currentUser}
                onBack={() => {
                  if (currentUser?.roleType === 'OWNER') {
                    setCurrentRoute('dashboard');
                  } else {
                    setCurrentRoute('landing');
                  }
                }}
                onStartInspectionForUser={(operatorName) => {
                  setInspection((prev) => ({
                    ...prev,
                    operatorName: `${operatorName} (${currentUser?.company || 'Locafrotas'})`,
                  }));
                  setCurrentRoute('template');
                }}
              />
            )}

            {currentRoute === 'template' && (
              <TemplateSelector
                inspectionId={inspection.id}
                vehicle={inspection.vehicle}
                currentTemplateId={selectedTemplateId}
                onStartInspection={handleStartInspectionFromTemplate}
                onBackToLanding={() => {
                  if (currentUser?.roleType === 'OWNER') {
                    setCurrentRoute('dashboard');
                  } else {
                    setCurrentRoute('landing');
                  }
                }}
                isTestMode={Boolean(currentUser?.isTestMode)}
                testCycleCompleted={testCycleCompleted}
                onUpgradeOrRegister={() => setCurrentRoute('register')}
              />
            )}

            {currentRoute === 'checklist' && (
              <ChecklistScreen
                inspection={inspection}
                steps={activeTemplate.steps}
                onChangeTemplate={() => setCurrentRoute('template')}
                onBackToLanding={() => {
                  if (currentUser?.roleType === 'OWNER') {
                    setCurrentRoute('dashboard');
                  } else {
                    setCurrentRoute('landing');
                  }
                }}
                isTestMode={Boolean(currentUser?.isTestMode)}
                testCycleCompleted={testCycleCompleted}
                onGoToRegister={() => setCurrentRoute('register')}
                onFinishInspection={handleFinishInspection}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal de Limite do Ciclo Único de Testes */}
      {showTestLimitModal && (
        <div
          id="test-limit-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            id="test-limit-modal"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Limite de 1 Ciclo de Testes Atingido
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                  Estado Único de Degustação Sandbox
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
              No modo de testes, você tem permissão para realizar <strong>um único ciclo de vistoria completo</strong> para conhecer a agilidade do preenchimento e a geração do laudo técnico.
              <br /><br />
              Este ciclo já foi executado. Para continuar emitindo novos laudos, gerenciar múltiplos operadores e cadastrar assentos de acordo com o plano contratado, crie uma conta regular.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                id="btn-limit-modal-register"
                onClick={() => {
                  setShowTestLimitModal(false);
                  setCurrentRoute('register');
                }}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                }}
              >
                Criar Cadastro Regular & Ver Planos
              </button>

              <button
                type="button"
                id="btn-limit-modal-view-report"
                onClick={() => {
                  setShowTestLimitModal(false);
                  setCurrentRoute('checklist');
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Visualizar Laudo do Ciclo Concluído
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  id="btn-limit-modal-restart-test"
                  onClick={() => {
                    setTestCycleCompleted(false);
                    setShowTestLimitModal(false);
                    setCurrentRoute('template');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#d97706',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Reiniciar novo ciclo no Sandbox
                </button>

                <button
                  type="button"
                  id="btn-limit-modal-logout"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Sair do Modo de Teste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

