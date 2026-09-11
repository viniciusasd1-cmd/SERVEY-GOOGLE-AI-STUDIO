import React, { useEffect, useState } from 'react';
import LandingPage from '../app/page';
import { TemplateSelector } from '../components/inspection/template-selector';
import { ChecklistScreen } from '../components/inspection/checklist-screen';
import { AuthScreens, AuthenticatedUser, AuthScreenType, AuthSuccessOptions, MfaGate } from '../components/auth/auth-screens';
import { TeamManagement } from '../components/team/team-management';
import { OwnerDashboard } from '../components/owner/owner-dashboard';
import { INITIAL_INSPECTION_MOCK, MOCK_TEMPLATES } from '../lib/mock-inspection-data';
import { Inspection, InspectionTemplate } from '../lib/inspection-types';
import { ShieldAlert } from 'lucide-react';
import { useTheme } from '../lib/theme-context';
import {
  AuthAccessError,
  createAuthenticatedUser,
  getAuthenticatedSession,
  getOwnerMfaState,
  signOut,
} from './lib/auth';
import type { AuthenticatedSession, OwnerMfaState } from './lib/auth';
import { isSupabaseReady } from './lib/supabase';

type CurrentRoute = 'landing' | 'login' | 'register' | 'forgot-password' | 'mfa-setup' | 'mfa-challenge' | 'mfa-error' | 'dashboard' | 'team' | 'template' | 'checklist';

function isManagementRole(role: AuthenticatedUser['membershipRole']): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

function isOperationalRole(role: AuthenticatedUser['membershipRole']): boolean {
  return role === 'SUPERVISOR' || role === 'INSPECTOR';
}

export default function App() {
  const { isDark } = useTheme();
  const [currentRoute, setCurrentRoute] = useState<CurrentRoute>('landing');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-completa');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [authActionError, setAuthActionError] = useState<string | null>(null);
  const [mfaSession, setMfaSession] = useState<AuthenticatedSession | null>(null);
  const [mfaState, setMfaState] = useState<OwnerMfaState | null>(null);

  // Controle de ciclo de teste único (Ambiente Sandbox)
  const [testCycleCompleted, setTestCycleCompleted] = useState<boolean>(false);
  const [showTestLimitModal, setShowTestLimitModal] = useState<boolean>(false);

  // Instância de vistoria em andamento
  const [inspection, setInspection] = useState<Inspection>(INITIAL_INSPECTION_MOCK);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (!isSupabaseReady()) return;

      try {
        const authenticatedSession = await getAuthenticatedSession();
        if (!active) return;

        const restoredMfaState = await getOwnerMfaState(authenticatedSession.access.role);
        if (
          restoredMfaState.state !== 'READY' &&
          restoredMfaState.state !== 'NOT_REQUIRED'
        ) {
          setMfaSession(authenticatedSession);
          setMfaState(restoredMfaState);
          setCurrentRoute(
            restoredMfaState.state === 'SETUP_REQUIRED'
              ? 'mfa-setup'
              : restoredMfaState.state === 'CHALLENGE_REQUIRED'
                ? 'mfa-challenge'
                : 'mfa-error'
          );
          return;
        }

        const restoredUser = createAuthenticatedUser(authenticatedSession.user, authenticatedSession.access, 'email');
        setMfaSession(null);
        setMfaState(null);
        setCurrentUser(restoredUser);
        setInspection((prev) => ({
          ...prev,
          operatorName: `${restoredUser.name} (${restoredUser.company})`,
        }));
        setCurrentRoute(
          isOperationalRole(restoredUser.membershipRole) ? 'template' : 'dashboard'
        );
      } catch (error: unknown) {
        if (
          active &&
          error instanceof AuthAccessError &&
          error.code !== 'SESSION_REQUIRED'
        ) {
          await signOut().catch(() => undefined);
        }
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (currentRoute === 'dashboard' && (!currentUser || !isManagementRole(currentUser.membershipRole))) {
      setCurrentRoute('login');
    }
  }, [currentRoute, currentUser]);

  // Obtém o template selecionado atualmente
  const activeTemplate = 
    MOCK_TEMPLATES.find((t) => t.id === selectedTemplateId) || MOCK_TEMPLATES[1];

  // Ação ao clicar em "Começar vistoria" na Landing Page
  const handleStartInspectionFromLanding = () => {
    if (currentUser) {
      // Se for proprietário, vai para o dashboard ou vistoria; se for operador vai direto para a vistoria
      if (isManagementRole(currentUser.membershipRole)) {
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
  const handleAuthSuccess = (user: AuthenticatedUser, options: AuthSuccessOptions = {}) => {
    if (user.membershipRole === 'OWNER' && !options.mfaVerified) {
      setCurrentUser(null);
      setMfaSession(null);
      setMfaState(null);
      setAuthActionError('A autenticação adicional é obrigatória para contas de proprietário.');
      void signOut().catch(() => undefined);
      setCurrentRoute('login');
      return;
    }

    setMfaSession(null);
    setMfaState(null);
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
    if (isOperationalRole(user.membershipRole)) {
      setCurrentRoute('template');
    } else {
      setCurrentRoute('dashboard');
    }
  };

  // Logout
  const handleLogout = async () => {
    setAuthActionError(null);

    try {
      await signOut();
      setCurrentUser(null);
      setMfaSession(null);
      setMfaState(null);
      setTestCycleCompleted(false);
      setShowTestLimitModal(false);
      setCurrentRoute('landing');
    } catch (error: unknown) {
      console.error('Erro ao encerrar sessão:', error);
      setAuthActionError('Não foi possível encerrar a sessão. Tente novamente.');
    }
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9' }}>
      {authActionError && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 10000,
            maxWidth: 360,
            padding: '12px 16px',
            borderRadius: 10,
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontSize: 13,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
          }}
        >
          {authActionError}
        </div>
      )}
      {/* Conteúdo Renderizado (Direto ou dentro da Moldura Mobile) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          padding: '0',
          backgroundColor: isDark ? '#090d16' : '#ffffff',
          overflowY: 'auto',
          transition: 'background-color 0.2s ease',
        }}
      >
        <div
          id="desktop-view-container"
          style={{
            width: '100%',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: isDark ? '#090d16' : '#ffffff',
            transition: 'background-color 0.2s ease',
          }}
        >
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

            {(currentRoute === 'mfa-setup' || currentRoute === 'mfa-challenge' || currentRoute === 'mfa-error') &&
              mfaSession &&
              mfaState && (
                <MfaGate
                  session={mfaSession}
                  initialState={mfaState}
                  onSuccessAuth={handleAuthSuccess}
                  onLogout={handleLogout}
                />
              )}

            {currentRoute === 'dashboard' && currentUser && isManagementRole(currentUser.membershipRole) && (
              <OwnerDashboard
                currentUser={currentUser}
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
                  if (currentUser && isManagementRole(currentUser.membershipRole)) {
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
                  if (currentUser && isManagementRole(currentUser.membershipRole)) {
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
                  if (currentUser && isManagementRole(currentUser.membershipRole)) {
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

