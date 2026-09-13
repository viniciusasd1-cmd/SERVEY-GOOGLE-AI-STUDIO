import React, { useEffect, useRef, useState } from 'react';
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
import { isSupabaseReady, supabase } from './lib/supabase';
import { BrowserCodeReader, BrowserQRCodeReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';
import {
  createOwnerInspection,
  createOwnerVehicleWithPlate,
  findOwnerVehicleByPlate,
  isSupportedOwnerVehiclePlate,
  listAvailableOwnerBranches,
  normalizeOwnerVehiclePlate,
} from './lib/survey-api';
import type { OwnerInspectionVehicleOption, OwnerVehiclePlateType } from './lib/survey-api';

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
  const [operatorVehicle, setOperatorVehicle] = useState<OwnerInspectionVehicleOption | null>(null);
  const [operatorVehicleConfirmed, setOperatorVehicleConfirmed] = useState(false);
  const [operatorPlateInput, setOperatorPlateInput] = useState('');
  const [operatorVehicleLookupState, setOperatorVehicleLookupState] = useState<
    'IDLE' | 'LOADING' | 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS' | 'ERROR'
  >('IDLE');
  const [operatorVehicleLookupError, setOperatorVehicleLookupError] = useState<string | null>(null);
  const [operatorRegistrationPlateType, setOperatorRegistrationPlateType] = useState<OwnerVehiclePlateType>('BRAZIL_MERCOSUL');
  const [operatorRegistrationMake, setOperatorRegistrationMake] = useState('');
  const [operatorRegistrationModel, setOperatorRegistrationModel] = useState('');
  const [operatorRegistrationError, setOperatorRegistrationError] = useState<string | null>(null);
  const [isRegisteringOperatorVehicle, setIsRegisteringOperatorVehicle] = useState(false);
  const [isCreatingOperatorDraft, setIsCreatingOperatorDraft] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScannerState, setQrScannerState] = useState<'IDLE' | 'STARTING' | 'SCANNING' | 'ERROR'>('IDLE');
  const [qrScannerError, setQrScannerError] = useState<string | null>(null);
  const [qrFeedback, setQrFeedback] = useState<string | null>(null);
  const [qrRawPayload, setQrRawPayload] = useState<string | null>(null);
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const qrControlsRef = useRef<IScannerControls | null>(null);

  const resetOperatorVehicleStep = () => {
    setInspection((prev) => ({ ...prev, id: '' }));
    setOperatorVehicle(null);
    setOperatorVehicleConfirmed(false);
    setOperatorPlateInput('');
    setOperatorVehicleLookupState('IDLE');
    setOperatorVehicleLookupError(null);
    setOperatorRegistrationPlateType('BRAZIL_MERCOSUL');
    setOperatorRegistrationMake('');
    setOperatorRegistrationModel('');
    setOperatorRegistrationError(null);
    setIsRegisteringOperatorVehicle(false);
    setIsCreatingOperatorDraft(false);
    setQrFeedback(null);
    setQrRawPayload(null);
  };

  const stopQrScannerResources = () => {
    qrControlsRef.current?.stop();
    qrControlsRef.current = null;
    qrReaderRef.current = null;

    const video = qrVideoRef.current;
    const source = video?.srcObject;
    if (source && 'getTracks' in source) {
      source.getTracks().forEach((track) => track.stop());
    }
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    BrowserCodeReader.releaseAllStreams();
  };

  const handleCloseQrScanner = () => {
    stopQrScannerResources();
    setIsQrScannerOpen(false);
    setQrScannerState('IDLE');
    setQrScannerError(null);
  };

  const handleQrPayload = (payload: string) => {
    const trimmedPayload = payload.trim();
    const normalizedPlate = normalizeOwnerVehiclePlate(trimmedPayload);
    const isSimplePlate =
      normalizedPlate === trimmedPayload.toUpperCase() && isSupportedOwnerVehiclePlate(normalizedPlate);

    setQrRawPayload(trimmedPayload);
    setQrFeedback(
      isSimplePlate
        ? 'QR Code lido com sucesso.'
        : 'QR Code lido, mas o formato ainda não foi reconhecido.',
    );

    if (!isSimplePlate) return;

    setOperatorPlateInput(normalizedPlate);
    setOperatorVehicle(null);
    setOperatorVehicleConfirmed(false);
    setOperatorVehicleLookupState('IDLE');
    setOperatorVehicleLookupError(null);
  };

  const handleOpenQrScanner = () => {
    setQrScannerError(null);
    setQrScannerState('STARTING');
    setIsQrScannerOpen(true);
  };

  useEffect(() => {
    if (!isQrScannerOpen) return;

    let active = true;
    const video = qrVideoRef.current;
    if (!video) return;

    const reader = new BrowserQRCodeReader();
    qrReaderRef.current = reader;

    const startScanner = async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } }, audio: false },
          video,
          (result, _error, callbackControls) => {
            if (!active || !result) return;

            callbackControls?.stop();
            stopQrScannerResources();
            setIsQrScannerOpen(false);
            setQrScannerState('IDLE');
            handleQrPayload(result.getText());
          },
        );

        if (!active) {
          controls.stop();
          return;
        }

        qrControlsRef.current = controls;
        setQrScannerState('SCANNING');
      } catch (error: unknown) {
        if (!active) return;

        stopQrScannerResources();
        setQrScannerState('ERROR');
        const errorName = error instanceof Error ? error.name : '';
        setQrScannerError(
          errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError'
            ? 'Permita o acesso à câmera ou digite a placa manualmente.'
            : 'Não foi possível acessar a câmera. Digite a placa manualmente.',
        );
      }
    };

    void startScanner();

    return () => {
      active = false;
      stopQrScannerResources();
    };
  }, [isQrScannerOpen]);

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
        resetOperatorVehicleStep();
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

  const handleOperatorVehicleInputChange = (value: string) => {
    setOperatorPlateInput(normalizeOwnerVehiclePlate(value));
    setOperatorVehicle(null);
    setOperatorVehicleConfirmed(false);
    setOperatorVehicleLookupState('IDLE');
    setOperatorVehicleLookupError(null);
    setOperatorRegistrationPlateType('BRAZIL_MERCOSUL');
    setOperatorRegistrationMake('');
    setOperatorRegistrationModel('');
    setOperatorRegistrationError(null);
    setQrFeedback(null);
    setQrRawPayload(null);
  };

  const handleFindOperatorVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPlate = normalizeOwnerVehiclePlate(operatorPlateInput);
    setOperatorPlateInput(normalizedPlate);
    setOperatorVehicle(null);
    setOperatorVehicleConfirmed(false);
    setOperatorVehicleLookupError(null);

    if (!isSupportedOwnerVehiclePlate(normalizedPlate)) {
      setOperatorVehicleLookupState('ERROR');
      setOperatorVehicleLookupError('Digite uma placa válida para continuar.');
      return;
    }

    if (!isSupabaseReady()) {
      setOperatorVehicleLookupState('ERROR');
      setOperatorVehicleLookupError('Não foi possível consultar o veículo agora.');
      return;
    }

    setOperatorVehicleLookupState('LOADING');

    try {
      const result = await findOwnerVehicleByPlate(normalizedPlate);
      if (result.status === 'NOT_FOUND') {
        setOperatorVehicleLookupState('NOT_FOUND');
        return;
      }

      if (result.status === 'AMBIGUOUS') {
        setOperatorVehicleLookupState('AMBIGUOUS');
        return;
      }

      setOperatorVehicle(result.vehicle);
      setOperatorVehicleLookupState('FOUND');
    } catch {
      setOperatorVehicleLookupState('ERROR');
      setOperatorVehicleLookupError('Não foi possível consultar o veículo agora.');
    }
  };

  const handleRegisterOperatorVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRegisteringOperatorVehicle) return;

    const normalizedPlate = normalizeOwnerVehiclePlate(operatorPlateInput);
    const make = operatorRegistrationMake.trim();
    const model = operatorRegistrationModel.trim();

    if (!normalizedPlate || !make || !model) {
      setOperatorRegistrationError('Informe o tipo da placa, a marca e o modelo.');
      return;
    }

    setIsRegisteringOperatorVehicle(true);
    setOperatorRegistrationError(null);

    try {
      const result = await createOwnerVehicleWithPlate({
        make,
        model,
        plateNumber: normalizedPlate,
        plateType: operatorRegistrationPlateType,
      });

      setOperatorVehicle({
        id: result.vehicleId,
        organizationId: null,
        make,
        model,
        version: null,
        modelYear: null,
        color: null,
        currentPlate: result.plateNumber,
        hasAmbiguousCurrentPlate: false,
      });
      setOperatorPlateInput(result.plateNumber);
      setOperatorVehicleLookupState('FOUND');
      setOperatorVehicleConfirmed(false);
    } catch (error: unknown) {
      setOperatorRegistrationError(
        error instanceof Error ? error.message : 'Não foi possível cadastrar o veículo.',
      );
    } finally {
      setIsRegisteringOperatorVehicle(false);
    }
  };

  const handleContinueWithOperatorVehicle = async () => {
    if (!operatorVehicle || operatorVehicleLookupState !== 'FOUND') return;
    if (isCreatingOperatorDraft) return;

    setIsCreatingOperatorDraft(true);
    setOperatorVehicleLookupError(null);

    try {
      let branchId = currentUser?.branchId ?? null;
      if (!branchId && currentUser && isManagementRole(currentUser.membershipRole)) {
        const accessibleBranches = await listAvailableOwnerBranches();
        if (accessibleBranches.length !== 1) {
          throw new Error(
            accessibleBranches.length === 0
              ? 'Nenhuma unidade ativa cadastrada.'
              : 'Não foi possível determinar uma unidade única para esta operação.',
          );
        }
        branchId = accessibleBranches[0].id;
      }

      if (!branchId) {
        throw new Error('Não foi possível determinar a unidade desta operação.');
      }

      let assignedUserId: string | null = null;
      if (currentUser?.membershipRole === 'INSPECTOR') {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user?.id) {
          throw new Error('Não foi possível validar o usuário responsável.');
        }
        assignedUserId = data.user.id;
      }

      const draft = await createOwnerInspection({
        branchId,
        vehicleId: operatorVehicle.id,
        assignedUserId,
      });

      if (draft.status !== 'DRAFT' || !draft.inspectionId) {
        throw new Error('Não foi possível confirmar a criação da vistoria.');
      }

      setInspection((prev) => ({
        ...prev,
        id: draft.inspectionId,
        vehicle: {
          plate: operatorVehicle.currentPlate ?? '—',
          model: operatorVehicle.model ?? '—',
          brand: operatorVehicle.make ?? '—',
          year: operatorVehicle.modelYear ?? 0,
          color: operatorVehicle.color ?? '—',
          companyName: currentUser?.company || '—',
        },
      }));
      setOperatorVehicleConfirmed(true);
    } catch (error: unknown) {
      setOperatorVehicleLookupError(
        error instanceof Error ? error.message : 'Não foi possível criar a vistoria como rascunho.',
      );
    } finally {
      setIsCreatingOperatorDraft(false);
    }
  };

  // Ação ao clicar em "Começar vistoria" na Landing Page
  const handleStartInspectionFromLanding = () => {
    if (currentUser) {
      // Se for proprietário, vai para o dashboard ou vistoria; se for operador vai direto para a vistoria
      if (isManagementRole(currentUser.membershipRole)) {
        setCurrentRoute('dashboard');
      } else {
        resetOperatorVehicleStep();
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
    resetOperatorVehicleStep();

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
      resetOperatorVehicleStep();
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
                  resetOperatorVehicleStep();
                  setInspection((prev) => ({
                    ...prev,
                    operatorName: `${currentUser?.name || 'Carlos Mendes'} (Vistoria Gerencial)`,
                  }));
                  setCurrentRoute('template');
                }}
                onSimulateOperator={() => {
                  resetOperatorVehicleStep();
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
                  resetOperatorVehicleStep();
                  setInspection((prev) => ({
                    ...prev,
                    operatorName: `${operatorName} (${currentUser?.company || 'Locafrotas'})`,
                  }));
                  setCurrentRoute('template');
                }}
              />
            )}

            {currentRoute === 'template' && currentUser && !currentUser.isTestMode && !operatorVehicleConfirmed && (
              <main
                aria-labelledby="operator-vehicle-identification-title"
                style={{
                  width: '100%',
                  maxWidth: 560,
                  margin: '0 auto',
                  padding: 'clamp(24px, 6vw, 56px) 20px',
                  boxSizing: 'border-box',
                }}
              >
                <section
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: 'clamp(20px, 5vw, 32px)',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <div style={{ marginBottom: 24 }}>
                    <h1
                      id="operator-vehicle-identification-title"
                      style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(22px, 5vw, 28px)', lineHeight: 1.2 }}
                    >
                      Identificar veículo
                    </h1>
                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
                      Informe a placa para carregar os dados reais do veículo antes de escolher o modelo de vistoria.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenQrScanner}
                    style={{
                      width: '100%',
                      minHeight: 44,
                      marginBottom: 16,
                      border: '1px solid #bfdbfe',
                      borderRadius: 8,
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Ler QR Code
                  </button>

                  {qrFeedback && (
                    <div
                      role="status"
                      style={{
                        marginBottom: 16,
                        padding: '10px 12px',
                        borderRadius: 8,
                        backgroundColor: qrFeedback === 'QR Code lido com sucesso.' ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${qrFeedback === 'QR Code lido com sucesso.' ? '#bbf7d0' : '#fde68a'}`,
                        color: qrFeedback === 'QR Code lido com sucesso.' ? '#166534' : '#92400e',
                        fontSize: 13,
                      }}
                    >
                      {qrFeedback}
                    </div>
                  )}

                  {import.meta.env.DEV && qrRawPayload && (
                    <details style={{ marginBottom: 16, color: '#475569', fontSize: 12 }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Payload bruto (DEV)</summary>
                      <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                        {qrRawPayload}
                      </pre>
                    </details>
                  )}

                  <form onSubmit={handleFindOperatorVehicle}>
                    <label
                      htmlFor="operator-vehicle-plate"
                      style={{ display: 'block', marginBottom: 8, color: '#334155', fontSize: 13, fontWeight: 700 }}
                    >
                      Placa do veículo
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        id="operator-vehicle-plate"
                        type="text"
                        value={operatorPlateInput}
                        onChange={(event) => handleOperatorVehicleInputChange(event.target.value)}
                        placeholder="ABC1D23"
                        autoComplete="off"
                        inputMode="text"
                        maxLength={7}
                        aria-describedby="operator-vehicle-plate-help"
                        style={{
                          flex: '1 1 220px',
                          minWidth: 0,
                          height: 44,
                          padding: '0 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: 8,
                          color: '#0f172a',
                          fontSize: 16,
                          fontWeight: 700,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={operatorVehicleLookupState === 'LOADING'}
                        style={{
                          flex: '0 1 auto',
                          minHeight: 44,
                          padding: '0 16px',
                          border: 0,
                          borderRadius: 8,
                          backgroundColor: operatorVehicleLookupState === 'LOADING' ? '#93c5fd' : '#2563eb',
                          color: '#ffffff',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: operatorVehicleLookupState === 'LOADING' ? 'wait' : 'pointer',
                        }}
                      >
                        {operatorVehicleLookupState === 'LOADING' ? 'Buscando…' : 'Buscar veículo'}
                      </button>
                    </div>
                    <span id="operator-vehicle-plate-help" style={{ display: 'block', marginTop: 8, color: '#64748b', fontSize: 12 }}>
                      Use a placa atual do veículo, sem espaços ou hífen.
                    </span>
                  </form>

                  {operatorVehicleLookupState === 'FOUND' && operatorVehicle && (
                    <div
                      role="status"
                      style={{
                        marginTop: 20,
                        padding: 16,
                        border: '1px solid #bbf7d0',
                        borderRadius: 10,
                        backgroundColor: '#f0fdf4',
                      }}
                    >
                      <strong style={{ display: 'block', color: '#166534', fontSize: 16, letterSpacing: 0.6 }}>
                        {operatorVehicle.currentPlate}
                      </strong>
                      <span style={{ display: 'block', marginTop: 6, color: '#14532d', fontSize: 14, fontWeight: 700 }}>
                        {[operatorVehicle.make, operatorVehicle.model, operatorVehicle.version].filter(Boolean).join(' ') || 'Veículo identificado'}
                      </span>
                      <span style={{ display: 'block', marginTop: 3, color: '#166534', fontSize: 13 }}>
                        {operatorVehicle.modelYear ?? '—'}{operatorVehicle.color ? ` • ${operatorVehicle.color}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={handleContinueWithOperatorVehicle}
                        disabled={isCreatingOperatorDraft}
                        style={{
                          width: '100%',
                          marginTop: 16,
                          minHeight: 42,
                          border: '1px solid #16a34a',
                          borderRadius: 8,
                          backgroundColor: isCreatingOperatorDraft ? '#f8fafc' : '#ffffff',
                          color: '#166534',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: isCreatingOperatorDraft ? 'wait' : 'pointer',
                        }}
                      >
                        {isCreatingOperatorDraft ? 'Criando vistoria…' : 'Continuar'}
                      </button>
                      {operatorVehicleLookupError && (
                        <div role="alert" style={{ marginTop: 12, color: '#991b1b', fontSize: 13 }}>
                          {operatorVehicleLookupError}
                        </div>
                      )}
                    </div>
                  )}

                  {operatorVehicleLookupState === 'NOT_FOUND' && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 16,
                        border: '1px solid #fed7aa',
                        borderRadius: 10,
                        backgroundColor: '#fff7ed',
                      }}
                    >
                      <div role="alert" style={{ color: '#9a3412', fontSize: 13 }}>
                        <strong style={{ display: 'block' }}>Veículo não encontrado.</strong>
                        <span>Cadastre o veículo antes de iniciar a vistoria.</span>
                      </div>

                      <form onSubmit={handleRegisterOperatorVehicle} style={{ marginTop: 16 }}>
                        <h2 style={{ margin: 0, color: '#0f172a', fontSize: 17, lineHeight: 1.3 }}>
                          Cadastrar veículo
                        </h2>
                        <p style={{ margin: '6px 0 14px', color: '#475569', fontSize: 12, lineHeight: 1.45 }}>
                          Use a placa identificada e informe os dados mínimos para continuar.
                        </p>

                        <label
                          htmlFor="operator-registration-plate-type"
                          style={{ display: 'block', marginBottom: 6, color: '#334155', fontSize: 13, fontWeight: 700 }}
                        >
                          Tipo da placa
                        </label>
                        <select
                          id="operator-registration-plate-type"
                          value={operatorRegistrationPlateType}
                          onChange={(event) => setOperatorRegistrationPlateType(event.target.value as OwnerVehiclePlateType)}
                          style={{
                            width: '100%',
                            height: 42,
                            padding: '0 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            fontSize: 14,
                            boxSizing: 'border-box',
                          }}
                        >
                          <option value="BRAZIL_MERCOSUL">Brasil — Mercosul</option>
                          <option value="BRAZIL_OLD">Brasil — padrão antigo</option>
                          <option value="FOREIGN">Estrangeira</option>
                          <option value="OTHER">Outro</option>
                        </select>

                        <label
                          htmlFor="operator-registration-plate"
                          style={{ display: 'block', margin: '14px 0 6px', color: '#334155', fontSize: 13, fontWeight: 700 }}
                        >
                          Placa
                        </label>
                        <input
                          id="operator-registration-plate"
                          type="text"
                          value={operatorPlateInput}
                          readOnly
                          aria-describedby="operator-registration-plate-help"
                          style={{
                            width: '100%',
                            height: 42,
                            padding: '0 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            backgroundColor: '#f8fafc',
                            color: '#0f172a',
                            fontSize: 15,
                            fontWeight: 700,
                            letterSpacing: 1,
                            boxSizing: 'border-box',
                          }}
                        />
                        <span id="operator-registration-plate-help" style={{ display: 'block', marginTop: 6, color: '#64748b', fontSize: 12 }}>
                          A placa será cadastrada como identificada acima.
                        </span>

                        <label
                          htmlFor="operator-registration-make"
                          style={{ display: 'block', margin: '14px 0 6px', color: '#334155', fontSize: 13, fontWeight: 700 }}
                        >
                          Marca
                        </label>
                        <input
                          id="operator-registration-make"
                          type="text"
                          value={operatorRegistrationMake}
                          onChange={(event) => setOperatorRegistrationMake(event.target.value)}
                          autoComplete="organization"
                          required
                          style={{
                            width: '100%',
                            height: 42,
                            padding: '0 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            fontSize: 14,
                            boxSizing: 'border-box',
                          }}
                        />

                        <label
                          htmlFor="operator-registration-model"
                          style={{ display: 'block', margin: '14px 0 6px', color: '#334155', fontSize: 13, fontWeight: 700 }}
                        >
                          Modelo
                        </label>
                        <input
                          id="operator-registration-model"
                          type="text"
                          value={operatorRegistrationModel}
                          onChange={(event) => setOperatorRegistrationModel(event.target.value)}
                          autoComplete="off"
                          required
                          style={{
                            width: '100%',
                            height: 42,
                            padding: '0 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            backgroundColor: '#ffffff',
                            color: '#0f172a',
                            fontSize: 14,
                            boxSizing: 'border-box',
                          }}
                        />

                        {operatorRegistrationError && (
                          <div role="alert" style={{ marginTop: 12, color: '#991b1b', fontSize: 13 }}>
                            {operatorRegistrationError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isRegisteringOperatorVehicle}
                          style={{
                            width: '100%',
                            minHeight: 42,
                            marginTop: 16,
                            border: 0,
                            borderRadius: 8,
                            backgroundColor: isRegisteringOperatorVehicle ? '#93c5fd' : '#2563eb',
                            color: '#ffffff',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: isRegisteringOperatorVehicle ? 'wait' : 'pointer',
                          }}
                        >
                          {isRegisteringOperatorVehicle ? 'Cadastrando…' : 'Cadastrar veículo'}
                        </button>
                      </form>
                    </div>
                  )}

                  {operatorVehicleLookupState === 'AMBIGUOUS' && (
                    <div role="alert" style={{ marginTop: 16, color: '#991b1b', fontSize: 13 }}>
                      Não foi possível confirmar uma placa atual única para este veículo.
                    </div>
                  )}

                  {operatorVehicleLookupState === 'ERROR' && operatorVehicleLookupError && (
                    <div role="alert" style={{ marginTop: 16, color: '#991b1b', fontSize: 13 }}>
                      {operatorVehicleLookupError}
                    </div>
                  )}
                </section>
              </main>
            )}

            {isQrScannerOpen && (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="operator-qr-scanner-title"
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  backgroundColor: 'rgba(15, 23, 42, 0.82)',
                  boxSizing: 'border-box',
                }}
              >
                <section
                  style={{
                    width: 'min(100%, 480px)',
                    maxHeight: '100%',
                    overflow: 'auto',
                    padding: 18,
                    borderRadius: 16,
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <h2 id="operator-qr-scanner-title" style={{ margin: 0, color: '#0f172a', fontSize: 19 }}>
                        Ler QR Code
                      </h2>
                      <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.4 }}>
                        Aponte a câmera para o código do veículo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCloseQrScanner}
                      aria-label="Fechar leitor de QR Code"
                      style={{
                        minWidth: 40,
                        minHeight: 40,
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        backgroundColor: '#ffffff',
                        color: '#334155',
                        fontSize: 20,
                        lineHeight: 1,
                        cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {qrScannerState !== 'ERROR' ? (
                    <video
                      ref={qrVideoRef}
                      muted
                      autoPlay
                      playsInline
                      aria-label="Pré-visualização da câmera para leitura de QR Code"
                      style={{
                        display: 'block',
                        width: '100%',
                        aspectRatio: '4 / 3',
                        marginTop: 16,
                        borderRadius: 12,
                        backgroundColor: '#0f172a',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      role="alert"
                      style={{
                        marginTop: 16,
                        padding: 16,
                        borderRadius: 10,
                        backgroundColor: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#9a3412',
                        fontSize: 13,
                        lineHeight: 1.45,
                      }}
                    >
                      {qrScannerError}
                    </div>
                  )}

                  {qrScannerState === 'STARTING' && (
                    <p style={{ margin: '12px 0 0', color: '#475569', fontSize: 13 }}>
                      Solicitando acesso à câmera…
                    </p>
                  )}
                  {qrScannerState === 'SCANNING' && (
                    <p style={{ margin: '12px 0 0', color: '#475569', fontSize: 13 }}>
                      Leitura ativa. Você pode fechar a câmera a qualquer momento.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleCloseQrScanner}
                    style={{
                      width: '100%',
                      minHeight: 42,
                      marginTop: 16,
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Fechar
                  </button>
                </section>
              </div>
            )}

            {currentRoute === 'template' && currentUser && (Boolean(currentUser.isTestMode) || operatorVehicleConfirmed) && (
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

