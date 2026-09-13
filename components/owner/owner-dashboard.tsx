'use client';

import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Users,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Clock,
  Car,
  AlertTriangle,
  CheckCircle2,
  Download,
  Share2,
  MessageSquare,
  Eye,
  LogOut,
  Smartphone,
  Monitor,
  Laptop,
  Globe,
  Lock,
  UserCheck,
  RefreshCw,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  MapPin,
  Building2,
  Check,
  BarChart3,
  ClipboardCheck,
  FileClock,
  House,
  Menu,
  Settings2,
  UsersRound,
  X as CloseIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AuthenticatedUser } from '../auth/auth-screens';
import { TeamManagement } from '../team/team-management';
import {
  MOCK_HISTORICAL_INSPECTIONS,
  MOCK_ACCESS_LOGS,
  InspectionHistoryItem,
  AccessLogEntry,
} from '../../lib/owner-mock-data';
import { generateInspectionPDF } from '../../src/lib/pdf-generator';
import { MOCK_TEMPLATES } from '../../lib/mock-inspection-data';
import { SendPdfModal } from '../inspection/send-pdf-modal';
import { isSupabaseReady } from '../../src/lib/supabase';
import {
  listOwnerInspections,
  listAvailableOwnerBranches,
  findOwnerVehicleByPlate,
  normalizeOwnerVehiclePlate,
  isSupportedOwnerVehiclePlate,
  createOwnerInspection,
  OwnerInspectionListItem,
  OwnerInspectionStatus,
  OwnerInspectionBranchOption,
  OwnerInspectionVehicleOption,
  OwnerVehicleLookupResult,
} from '../../src/lib/survey-api';
import styles from './owner-dashboard.module.css';

type OwnerTab = 'dashboard' | 'history' | 'team' | 'access';
type OwnerSidebarItemId =
  | 'home'
  | 'inspections'
  | 'history'
  | 'vehicles'
  | 'customers'
  | 'branches'
  | 'reports'
  | 'settings';

interface OwnerSidebarItem {
  id: OwnerSidebarItemId;
  label: string;
  icon: LucideIcon;
}

const OWNER_SIDEBAR_ITEMS: OwnerSidebarItem[] = [
  { id: 'home', label: 'Início', icon: House },
  { id: 'inspections', label: 'Inspeções', icon: ClipboardCheck },
  { id: 'history', label: 'Histórico', icon: FileClock },
  { id: 'vehicles', label: 'Veículos', icon: Car },
  { id: 'customers', label: 'Clientes', icon: UsersRound },
  { id: 'branches', label: 'Unidades', icon: Building2 },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'settings', label: 'Configurações', icon: Settings2 },
];

// MOCK UI DATA — substituir por consultas reais quando o dashboard receber a integração de dados.
const OWNER_DASHBOARD_MOCK_DATA = {
  summary: {
    inspectionsToday: 12,
    inProgress: 2,
    completedToday: 8,
    withDamage: 2,
  },
  inProgressInspections: [
    {
      id: 'progress-bra2e19',
      plate: 'BRA2E19',
      vehicle: 'Honda Civic EXL',
      operator: 'Marcos Silveira',
      branch: 'Pátio Central - SP',
      startedAgo: 'há 18 min',
      status: 'Em andamento',
      tone: 'info',
    },
    {
      id: 'progress-ghx9j88',
      plate: 'GHX9J88',
      vehicle: 'Jeep Compass',
      operator: 'Marcos Vinicius Santos',
      branch: 'Filial Campinas - SP',
      startedAgo: 'há 46 min',
      status: 'Em andamento',
      tone: 'info',
    },
  ],
  alerts: [
    {
      id: 'alert-damage-bra2e19',
      type: 'Avaria registrada',
      vehicle: 'Honda Civic EXL',
      plate: 'BRA2E19',
      branch: 'Pátio Central - SP',
      time: 'Hoje às 14:48',
      tone: 'warning',
    },
    {
      id: 'alert-pending-rtl4b12',
      type: 'Vistoria incompleta',
      vehicle: 'Toyota Corolla Cross',
      plate: 'RTL4B12',
      branch: 'Pátio Congonhas - SP',
      time: 'Hoje às 12:06',
      tone: 'info',
    },
    {
      id: 'alert-owner-qwp3c77',
      type: 'Veículo sem responsável',
      vehicle: 'Ford Ranger',
      plate: 'QWP3C77',
      branch: 'Filial Campinas - SP',
      time: 'Hoje às 10:40',
      tone: 'warning',
    },
  ],
  activeTeam: [
    { id: 'operator-juliana', name: 'Juliana Paes Silva', branch: 'Pátio Congonhas - SP', status: 'Disponível', currentInspection: '—' },
    { id: 'operator-marcos', name: 'Marcos Vinicius Santos', branch: 'Filial Campinas - SP', status: 'Em vistoria', currentInspection: 'GHX9J88' },
    { id: 'operator-aline', name: 'Aline Ferreira', branch: 'Pátio Central - SP', status: 'Offline', currentInspection: '—' },
    { id: 'operator-roberto', name: 'Roberto Antunes', branch: 'Pátio Congonhas - SP', status: 'Disponível', currentInspection: '—' },
  ],
  branches: [
    { id: 'branch-central', name: 'Pátio Central - SP', inspectionsToday: 12, inProgress: 2, pending: 1 },
    { id: 'branch-congonhas', name: 'Pátio Congonhas - SP', inspectionsToday: 8, inProgress: 1, pending: 0 },
    { id: 'branch-campinas', name: 'Filial Campinas - SP', inspectionsToday: 6, inProgress: 0, pending: 1 },
  ],
} as const;

function getDashboardInspectionStatus(classification: InspectionHistoryItem['classification']) {
  switch (classification) {
    case 'APROVADO':
      return { label: 'Concluída', tone: 'success' as const };
    case 'COM_AVARIA':
      return { label: 'Com avaria', tone: 'warning' as const };
    case 'REPROVADO':
      return { label: 'Cancelada', tone: 'danger' as const };
    default:
      return { label: 'Em andamento', tone: 'info' as const };
  }
}

function getDashboardInspectionTime(inspection: InspectionHistoryItem) {
  const source = inspection.completedAt || inspection.startedAt || '';
  return source.includes('às ') ? source.split('às ').pop() || '—' : source || '—';
}

function getOwnerInspectionStatusLabel(status: OwnerInspectionStatus) {
  switch (status) {
    case 'DRAFT':
      return 'Rascunho';
    case 'IN_PROGRESS':
      return 'Em andamento';
    case 'COMPLETED':
      return 'Concluída';
    case 'CANCELLED':
      return 'Cancelada';
  }
}

function formatOwnerInspectionTimestamp(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

interface OwnerDashboardProps {
  currentUser: AuthenticatedUser;
  onLogout: () => void;
  onStartNewInspection: () => void;
  onSimulateOperator: () => void;
  initialTab?: 'dashboard' | 'history' | 'team' | 'access';
}

export function OwnerDashboard({
  currentUser,
  onLogout,
  onStartNewInspection,
  onSimulateOperator,
  initialTab = 'dashboard',
}: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<OwnerTab>(initialTab);
  const [activeSidebarItem, setActiveSidebarItem] = useState<OwnerSidebarItemId>(
    initialTab === 'history' ? 'history' : initialTab === 'team' ? 'branches' : initialTab === 'access' ? 'settings' : 'home'
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados do Histórico
  const [inspectionsList, setInspectionsList] = useState<InspectionHistoryItem[]>(MOCK_HISTORICAL_INSPECTIONS);
  const [realInspections, setRealInspections] = useState<OwnerInspectionListItem[]>([]);
  const [realInspectionReadState, setRealInspectionReadState] = useState<'LOADING' | 'SUCCESS' | 'EMPTY' | 'ERROR'>('LOADING');
  const [realInspectionReadError, setRealInspectionReadError] = useState<string | null>(null);
  const [realInspectionRefreshToken, setRealInspectionRefreshToken] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OwnerInspectionStatus>('ALL');

  // Estados da criação real de vistoria em DRAFT
  const [isCreateInspectionOpen, setIsCreateInspectionOpen] = useState(false);
  const [createInspectionReadState, setCreateInspectionReadState] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'EMPTY' | 'ERROR'>('IDLE');
  const [createInspectionReadError, setCreateInspectionReadError] = useState<string | null>(null);
  const [availableBranches, setAvailableBranches] = useState<OwnerInspectionBranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [vehiclePlateInput, setVehiclePlateInput] = useState('');
  const [vehicleLookupState, setVehicleLookupState] = useState<'IDLE' | 'LOADING' | 'FOUND' | 'NOT_FOUND' | 'AMBIGUOUS' | 'ERROR'>('IDLE');
  const [vehicleLookupError, setVehicleLookupError] = useState<string | null>(null);
  const [identifiedVehicle, setIdentifiedVehicle] = useState<OwnerInspectionVehicleOption | null>(null);
  const [isVehicleConfirmed, setIsVehicleConfirmed] = useState(false);
  const [createInspectionError, setCreateInspectionError] = useState<string | null>(null);
  const [isCreatingInspection, setIsCreatingInspection] = useState(false);

  // Estados de Controle de Acessos & Logins
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>(MOCK_ACCESS_LOGS);
  const [logSearch, setLogSearch] = useState('');
  const [revokedSessionId, setRevokedSessionId] = useState<string | null>(null);
  const [securityToast, setSecurityToast] = useState<string | null>(null);

  // Políticas de Acesso (Toggles)
  const [requireGps, setRequireGps] = useState(true);
  const [businessHoursOnly, setBusinessHoursOnly] = useState(false);
  const [notifyNewLogins, setNotifyNewLogins] = useState(true);
  const [requirePhotoId, setRequirePhotoId] = useState(true);

  // Modais de ação rápida
  const [selectedInspectionForModal, setSelectedInspectionForModal] = useState<InspectionHistoryItem | null>(null);
  const [isSendPdfOpen, setIsSendPdfOpen] = useState(false);
  const [viewDetailsInspection, setViewDetailsInspection] = useState<InspectionHistoryItem | null>(null);
  const isBranchScopedRole = currentUser.membershipRole === 'SUPERVISOR' || currentUser.membershipRole === 'INSPECTOR';
  const canChooseBranch = currentUser.membershipRole === 'OWNER' || currentUser.membershipRole === 'ADMIN';

  useEffect(() => {
    if (activeTab !== 'history') return;

    let active = true;
    setRealInspectionReadState('LOADING');
    setRealInspectionReadError(null);

    if (!isSupabaseReady()) {
      setRealInspectionReadState('ERROR');
      setRealInspectionReadError('Não foi possível carregar as inspeções agora.');
      return () => {
        active = false;
      };
    }

    void listOwnerInspections({ limit: 25 })
      .then((items) => {
        if (!active) return;
        setRealInspections(items);
        setRealInspectionReadState(items.length > 0 ? 'SUCCESS' : 'EMPTY');
      })
      .catch(() => {
        if (!active) return;
        setRealInspectionReadState('ERROR');
        setRealInspectionReadError('Não foi possível carregar as inspeções agora.');
      });

    return () => {
      active = false;
    };
  }, [activeTab, realInspectionRefreshToken]);

  useEffect(() => {
    if (!isCreateInspectionOpen) return;

    let active = true;
    setCreateInspectionReadState('LOADING');
    setCreateInspectionReadError(null);
    setCreateInspectionError(null);

    if (!isSupabaseReady()) {
      setCreateInspectionReadState('ERROR');
      setCreateInspectionReadError('Não foi possível carregar as opções agora.');
      return () => {
        active = false;
      };
    }

    const membershipBranchId = currentUser.branchId;

    if (isBranchScopedRole && !membershipBranchId) {
      setCreateInspectionReadState('ERROR');
      setCreateInspectionReadError('Não foi possível resolver a unidade ativa da sua associação.');
      return () => {
        active = false;
      };
    }

    void listAvailableOwnerBranches(isBranchScopedRole ? membershipBranchId ?? undefined : undefined)
      .then((branches) => {
        if (!active) return;
        setAvailableBranches(branches);

        if (branches.length === 0) {
          setCreateInspectionReadState(isBranchScopedRole ? 'ERROR' : 'EMPTY');
          setCreateInspectionReadError(
            isBranchScopedRole
              ? 'Não foi possível resolver a unidade ativa da sua associação.'
              : 'Nenhuma unidade ativa cadastrada.',
          );
          return;
        }

        if (isBranchScopedRole) {
          setSelectedBranchId(branches[0].id);
        } else if (branches.length === 1) {
          setSelectedBranchId(branches[0].id);
        } else {
          setSelectedBranchId('');
        }

        setCreateInspectionReadState('SUCCESS');
      })
      .catch(() => {
        if (!active) return;
        setCreateInspectionReadState('ERROR');
        setCreateInspectionReadError('Não foi possível carregar as opções agora.');
      });

    return () => {
      active = false;
    };
  }, [currentUser.branchId, currentUser.membershipRole, isCreateInspectionOpen]);

  useEffect(() => {
    if (!isCreateInspectionOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCreateInspectionModal();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isCreateInspectionOpen, isCreatingInspection]);

  // Filtro da listagem real de inspeções
  const filteredRealInspections = realInspections.filter((insp) => {
    const term = historySearch.toLowerCase().trim();
    const matchesTerm =
      !term ||
      (insp.plate ?? '').toLowerCase().includes(term) ||
      (insp.make ?? '').toLowerCase().includes(term) ||
      (insp.model ?? '').toLowerCase().includes(term) ||
      (insp.version ?? '').toLowerCase().includes(term) ||
      insp.branchName.toLowerCase().includes(term) ||
      insp.branchCode.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'ALL' || insp.status === statusFilter;

    return matchesTerm && matchesStatus;
  });

  // Filtro de Logs de Acesso
  const filteredLogs = accessLogs.filter((log) => {
    const term = logSearch.toLowerCase().trim();
    return (
      !term ||
      log.userName.toLowerCase().includes(term) ||
      log.userEmail.toLowerCase().includes(term) ||
      log.device.toLowerCase().includes(term) ||
      log.ipAddress.includes(term) ||
      log.branch.toLowerCase().includes(term)
    );
  });

  const handleSidebarItemClick = (item: OwnerSidebarItem) => {
    setActiveSidebarItem(item.id);
    setIsSidebarOpen(false);

    if (item.id === 'home' || item.id === 'inspections') {
      setActiveTab('dashboard');
    } else if (item.id === 'history') {
      setActiveTab('history');
    } else if (item.id === 'branches') {
      setActiveTab('team');
    } else if (item.id === 'settings') {
      setActiveTab('access');
    }
  };

  const handleExistingTabChange = (tab: OwnerTab, sidebarItem: OwnerSidebarItemId) => {
    setActiveTab(tab);
    setActiveSidebarItem(sidebarItem);
  };

  const resetCreateInspectionForm = () => {
    setSelectedBranchId('');
    setVehiclePlateInput('');
    setVehicleLookupState('IDLE');
    setVehicleLookupError(null);
    setIdentifiedVehicle(null);
    setIsVehicleConfirmed(false);
    setCreateInspectionError(null);
    setAvailableBranches([]);
    setCreateInspectionReadState('IDLE');
    setCreateInspectionReadError(null);
  };

  const openCreateInspectionModal = () => {
    setCreateInspectionError(null);
    setIsCreateInspectionOpen(true);
  };

  const closeCreateInspectionModal = () => {
    if (isCreatingInspection) return;
    setIsCreateInspectionOpen(false);
    resetCreateInspectionForm();
  };

  const handleVehiclePlateInputChange = (value: string) => {
    setVehiclePlateInput(normalizeOwnerVehiclePlate(value));
    setVehicleLookupState('IDLE');
    setVehicleLookupError(null);
    setIdentifiedVehicle(null);
    setIsVehicleConfirmed(false);
  };

  const handleFindVehicle = async () => {
    const normalizedPlate = normalizeOwnerVehiclePlate(vehiclePlateInput);
    setVehiclePlateInput(normalizedPlate);
    setVehicleLookupError(null);
    setIdentifiedVehicle(null);
    setIsVehicleConfirmed(false);

    if (!isSupportedOwnerVehiclePlate(normalizedPlate)) {
      setVehicleLookupState('ERROR');
      setVehicleLookupError('Digite uma placa válida para continuar.');
      return;
    }

    setVehicleLookupState('LOADING');

    try {
      const result: OwnerVehicleLookupResult = await findOwnerVehicleByPlate(normalizedPlate);
      if (result.status === 'NOT_FOUND') {
        setVehicleLookupState('NOT_FOUND');
        return;
      }
      if (result.status === 'AMBIGUOUS') {
        setVehicleLookupState('AMBIGUOUS');
        return;
      }

      setIdentifiedVehicle(result.vehicle);
      setVehicleLookupState('FOUND');
    } catch {
      setVehicleLookupState('ERROR');
      setVehicleLookupError('Não foi possível consultar o veículo agora.');
    }
  };

  const handleCreateInspection = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreatingInspection) return;

    if (!selectedBranchId || !identifiedVehicle || !isVehicleConfirmed) {
      setCreateInspectionError('Resolva a unidade e confirme um veículo válido para continuar.');
      return;
    }

    setIsCreatingInspection(true);
    setCreateInspectionError(null);

    try {
      const result = await createOwnerInspection({
        branchId: selectedBranchId,
        vehicleId: identifiedVehicle.id,
      });

      if (!result.inspectionId || result.status !== 'DRAFT') {
        throw new Error('Não foi possível confirmar a criação da vistoria.');
      }

      setIsCreateInspectionOpen(false);
      resetCreateInspectionForm();
      setActiveTab('history');
      setActiveSidebarItem('history');
      setRealInspectionRefreshToken((value) => value + 1);
      setSecurityToast('Vistoria criada como rascunho.');
    } catch (error) {
      setCreateInspectionError(
        error instanceof Error ? error.message : 'Não foi possível criar a vistoria.',
      );
    } finally {
      setIsCreatingInspection(false);
    }
  };

  // Ação: Baixar PDF de uma vistoria do histórico
  const handleDownloadPdf = (insp: InspectionHistoryItem) => {
    try {
      const template = MOCK_TEMPLATES.find((t) => t.id === insp.templateId) || MOCK_TEMPLATES[1];
      const { doc, filename } = generateInspectionPDF(insp, template.steps, {
        date: insp.startedAt.split(' às ')[0] || new Date().toLocaleDateString('pt-BR'),
        startTime: insp.startedAt.split(' às ')[1] || '14:30',
        endTime: insp.completedAt ? insp.completedAt.split(' às ')[1] || '14:48' : '14:48',
        duration: insp.inspectionDuration || '18 min',
      });
      doc.save(filename);
    } catch (err) {
      console.error('Erro ao baixar laudo:', err);
    }
  };

  // Ação: Abrir modal de envio pelo WhatsApp com PDF
  const handleOpenSendPdf = (insp: InspectionHistoryItem) => {
    setSelectedInspectionForModal(insp);
    setIsSendPdfOpen(true);
  };

  // Ação: Revogar sessão de operador
  const handleRevokeSession = (sessionId: string, userName: string) => {
    setAccessLogs((prev) =>
      prev.map((log) =>
        log.id === sessionId ? { ...log, status: 'OFFLINE', lastActivity: 'Sessão revogada agora' } : log
      )
    );
    setRevokedSessionId(sessionId);
    setSecurityToast(`A sessão de ${userName} foi encerrada e desconectada remotamente.`);
    setTimeout(() => {
      setSecurityToast(null);
      setRevokedSessionId(null);
    }, 4500);
  };

  // Obter template para envio de PDF
  const activeTemplateForModal = selectedInspectionForModal
    ? MOCK_TEMPLATES.find((t) => t.id === selectedInspectionForModal.templateId) || MOCK_TEMPLATES[1]
    : MOCK_TEMPLATES[1];

  return (
    <div
      id="owner-dashboard-root"
      className={styles.ownerDashboardRoot}
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.2s ease',
      }}
    >
      <aside
        className={`${styles.ownerSidebar} ${isSidebarOpen ? styles.ownerSidebarOpen : ''}`}
        aria-label="Navegação principal do proprietário"
      >
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarBrandMark}>S</div>
          <div>
            <div className={styles.sidebarBrandName}>SURVEY</div>
            <div className={styles.sidebarBrandCaption}>Operations workspace</div>
          </div>
          <button
            type="button"
            className={styles.sidebarCloseButton}
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className={styles.sidebarSectionLabel}>Workspace</div>
        <nav className={styles.sidebarNav}>
          {OWNER_SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSidebarItem === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.sidebarNavItem} ${isActive ? styles.sidebarNavItemActive : ''}`}
                onClick={() => handleSidebarItemClick(item)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={17} strokeWidth={isActive ? 2.4 : 1.9} />
                <span>{item.label}</span>
                {isActive && <span className={styles.sidebarActiveDot} aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarFooterRule} />
          <div className={styles.sidebarUserCard}>
            <div className={styles.sidebarAvatar} aria-hidden="true">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.sidebarUserMeta}>
              <strong>{currentUser.name}</strong>
              <span>Proprietário</span>
            </div>
            <div className={styles.sidebarUserActions}>
              <ShieldCheck size={16} className={styles.sidebarUserStatus} aria-label="Conta protegida" />
              <button
                type="button"
                className={styles.sidebarLogoutButton}
                onClick={onLogout}
                aria-label="Sair do dashboard"
                title="Sair"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          className={styles.sidebarOverlay}
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Fechar menu lateral"
        />
      )}

      {/* ========================================================= */}
      {/* CABEÇALHO DO PAINEL DO PROPRIETÁRIO */}
      {/* ========================================================= */}
      <header
        id="owner-header"
        className={styles.ownerDashboardHeader}
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Contexto da página atual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              className={styles.mobileSidebarTrigger}
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu lateral"
              aria-expanded={isSidebarOpen}
            >
              <Menu size={20} />
            </button>
            <div className={styles.ownerHeaderTitleBlock}>
              <div className={styles.ownerHeaderTitleRow}>
                <h1
                  className={styles.ownerHeaderTitle}
                  style={{ color: '#0f172a' }}
                >
                  Início
                </h1>
                <span
                  className={styles.ownerPlanBadge}
                  style={{
                    color: '#166534',
                    backgroundColor: '#f0fdf4',
                    borderColor: '#bbf7d0',
                  }}
                >
                  <span className={styles.ownerPlanDot} />
                  Plano Ativo
                </span>
              </div>
              <p
                className={styles.ownerHeaderSubtitle}
                style={{ color: '#64748b' }}
              >
                {currentUser.company || 'SURVEY'} • {currentUser.name}
              </p>
            </div>
          </div>

          {/* Ações Rápidas no Topo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Alternador de Tema Claro / Escuro */}
            {/* Botão de Simulação do Operador */}
            <button
              type="button"
              id="btn-simulate-operator"
              className={styles.ownerHeaderSecondaryAction}
              onClick={onSimulateOperator}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                borderRadius: '8px',
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title="Acessar a visão direta do vistoriador em campo"
            >
              <Smartphone size={14} color="#2563eb" />
              <span>Visão do Operador</span>
            </button>

            {/* Botão de Nova Vistoria Imediata */}
            <button
              type="button"
              id="btn-owner-new-inspection"
              className={styles.ownerHeaderPrimaryAction}
              onClick={onStartNewInspection}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#2563eb',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              }}
              title="Iniciar uma vistoria pelo painel"
            >
              <Plus size={16} />
              <span>Nova Vistoria</span>
            </button>

          </div>
        </div>

      </header>

      {/* Notificação / Toast de Segurança */}
      {securityToast && (
        <div
          className={styles.ownerDashboardToast}
          style={{
            maxWidth: '1280px',
            margin: '12px auto 0',
            padding: '0 20px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '12.5px',
              color: '#1e40af',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} />
              <span>{securityToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSecurityToast(null)}
              style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTEÚDO PRINCIPAL (RENDERIZADO POR ABA) */}
      {/* ========================================================= */}
      <main
        className={styles.ownerDashboardMain}
        style={{
          flex: 1,
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        {/* ========================================================= */}
        {/* ABA 1: VISÃO GERAL DA OPERAÇÃO — LAYOUT COMPACTO */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className={styles.dashboardCompact}>
            <section className={styles.dashboardCompactHeader} aria-labelledby="owner-dashboard-overview-title">
              <div>
                <span className={styles.dashboardCompactEyebrow}>CENTRO DE OPERAÇÃO</span>
                <h2 id="owner-dashboard-overview-title" className={styles.dashboardCompactTitle}>
                  Visão Geral da Operação
                </h2>
                <p className={styles.dashboardCompactSubtitle}>
                  Acompanhe o que está acontecendo agora e o que precisa de atenção.
                </p>
              </div>

              <div className={styles.dashboardCompactActions}>
                <button
                  type="button"
                  className={styles.dashboardActionSecondary}
                  onClick={() => handleExistingTabChange('history', 'history')}
                >
                  <ClipboardList size={14} aria-hidden="true" />
                  Ver Histórico
                </button>
                <button
                  type="button"
                  className={styles.dashboardActionPrimary}
                  onClick={() => handleExistingTabChange('team', 'branches')}
                >
                  <Users size={14} aria-hidden="true" />
                  Gerenciar Equipe
                </button>
              </div>
            </section>

            <section className={styles.dashboardCompactKpis} aria-label="Resumo operacional">
              {[
                {
                  label: 'Vistorias Hoje',
                  value: OWNER_DASHBOARD_MOCK_DATA.summary.inspectionsToday,
                  Icon: ClipboardList,
                  tone: 'blue',
                },
                {
                  label: 'Em andamento',
                  value: OWNER_DASHBOARD_MOCK_DATA.summary.inProgress,
                  Icon: Clock,
                  tone: 'slate',
                },
                {
                  label: 'Concluídas',
                  value: OWNER_DASHBOARD_MOCK_DATA.summary.completedToday,
                  Icon: CheckCircle2,
                  tone: 'green',
                },
                {
                  label: 'Pendências/Avarias',
                  value: OWNER_DASHBOARD_MOCK_DATA.summary.withDamage,
                  Icon: AlertTriangle,
                  tone: 'amber',
                },
              ].map((kpi) => (
                <article key={kpi.label} className={styles.dashboardCompactKpi}>
                  <span className={styles.dashboardCompactKpiIcon} data-tone={kpi.tone}>
                    <kpi.Icon size={15} aria-hidden="true" />
                  </span>
                  <div className={styles.dashboardCompactKpiValue}>{kpi.value}</div>
                  <div className={styles.dashboardCompactKpiLabel}>{kpi.label}</div>
                </article>
              ))}
            </section>

            <section className={styles.dashboardCompactPanel} aria-labelledby="in-progress-title">
              <div className={styles.dashboardCompactPanelHeader}>
                <div>
                  <h3 id="in-progress-title" className={styles.dashboardCompactPanelTitle}>
                    Vistorias em andamento
                  </h3>
                  <p className={styles.dashboardCompactPanelMeta}>
                    Acompanhe as inspeções abertas neste momento.
                  </p>
                </div>
                <span className={styles.dashboardCompactPanelCount}>
                  {OWNER_DASHBOARD_MOCK_DATA.inProgressInspections.length} abertas
                </span>
              </div>

              <div className={styles.dashboardCompactTable} role="table" aria-label="Vistorias em andamento">
                <div className={styles.dashboardCompactTableHeader} role="row">
                  <span role="columnheader">Placa</span>
                  <span role="columnheader">Veículo</span>
                  <span role="columnheader">Operador</span>
                  <span role="columnheader">Unidade</span>
                  <span role="columnheader">Iniciado há</span>
                  <span role="columnheader">Status</span>
                  <span role="columnheader">Ação</span>
                </div>

                {OWNER_DASHBOARD_MOCK_DATA.inProgressInspections.map((inspection) => {
                  const relatedInspection = inspectionsList.find(
                    (item) => item.vehicle.plate === inspection.plate
                  );

                  return (
                    <div key={inspection.id} className={styles.dashboardCompactTableRow} role="row">
                      <div className={styles.dashboardCompactTableCell} role="cell">
                        <span className={styles.dashboardCompactCellLabel}>Placa</span>
                        <strong className={styles.dashboardCompactPlate}>{inspection.plate}</strong>
                      </div>
                      <div className={styles.dashboardCompactTableCell} role="cell">
                        <span className={styles.dashboardCompactCellLabel}>Veículo</span>
                        <strong>{inspection.vehicle}</strong>
                      </div>
                      <div className={styles.dashboardCompactTableCell} role="cell">
                        <span className={styles.dashboardCompactCellLabel}>Operador</span>
                        <span>{inspection.operator}</span>
                      </div>
                      <div className={styles.dashboardCompactTableCell} role="cell">
                        <span className={styles.dashboardCompactCellLabel}>Unidade</span>
                        <span>{inspection.branch}</span>
                      </div>
                      <div className={styles.dashboardCompactTableCell} role="cell">
                        <span className={styles.dashboardCompactCellLabel}>Iniciado há</span>
                        <span>{inspection.startedAgo}</span>
                      </div>
                      <div className={styles.dashboardCompactTableCell} role="cell">
                        <span className={styles.dashboardCompactCellLabel}>Status</span>
                        <span className={styles.dashboardCompactStatus} data-tone={inspection.tone}>
                          {inspection.status}
                        </span>
                      </div>
                      <div className={styles.dashboardCompactTableCell} role="cell">
                        <span className={styles.dashboardCompactCellLabel}>Ação</span>
                        <button
                          type="button"
                          className={styles.dashboardCompactRowAction}
                          onClick={() => relatedInspection && setViewDetailsInspection(relatedInspection)}
                          disabled={!relatedInspection}
                        >
                          Ver vistoria
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className={styles.dashboardCompactLowerGrid}>
              <section className={styles.dashboardCompactPanel} aria-labelledby="recent-activity-title">
                <div className={styles.dashboardCompactPanelHeader}>
                  <div>
                    <h3 id="recent-activity-title" className={styles.dashboardCompactPanelTitle}>
                      Atividade recente
                    </h3>
                    <p className={styles.dashboardCompactPanelMeta}>
                      Últimos registros concluídos ou atualizados.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.dashboardCompactLink}
                    onClick={() => handleExistingTabChange('history', 'history')}
                  >
                    Ver todas
                    <ChevronRight size={13} aria-hidden="true" />
                  </button>
                </div>

                <div className={styles.dashboardCompactActivityList}>
                  {inspectionsList.slice(0, 4).map((inspection) => {
                    const status = getDashboardInspectionStatus(inspection.classification);

                    return (
                      <div key={inspection.id} className={styles.dashboardCompactActivityRow}>
                        <div className={styles.dashboardCompactActivityIdentity}>
                          <strong className={styles.dashboardCompactPlate}>{inspection.vehicle.plate}</strong>
                          <div>
                            <strong>{inspection.vehicle.brand} {inspection.vehicle.model}</strong>
                            <span>{inspection.operatorName} · {inspection.branchName}</span>
                          </div>
                        </div>
                        <div className={styles.dashboardCompactActivityMeta}>
                          <span>{getDashboardInspectionTime(inspection)}</span>
                          <span className={styles.dashboardCompactStatus} data-tone={status.tone}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={styles.dashboardCompactPanel} aria-labelledby="pending-title">
                <div className={styles.dashboardCompactPanelHeader}>
                  <div>
                    <h3 id="pending-title" className={styles.dashboardCompactPanelTitle}>
                      Pendências
                    </h3>
                    <p className={styles.dashboardCompactPanelMeta}>
                      Itens que exigem atenção da equipe.
                    </p>
                  </div>
                  <span className={styles.dashboardCompactPanelCount}>
                    {OWNER_DASHBOARD_MOCK_DATA.alerts.length}
                  </span>
                </div>

                <div className={styles.dashboardCompactPendingList}>
                  {OWNER_DASHBOARD_MOCK_DATA.alerts.map((alert) => {
                    const relatedInspection = inspectionsList.find(
                      (inspection) => inspection.vehicle.plate === alert.plate
                    );

                    return (
                      <div key={alert.id} className={styles.dashboardCompactPendingRow}>
                        <span className={styles.dashboardCompactPendingIcon} data-tone={alert.tone}>
                          <AlertTriangle size={14} aria-hidden="true" />
                        </span>
                        <div className={styles.dashboardCompactPendingBody}>
                          <strong>{alert.type}</strong>
                          <span>{alert.vehicle} · {alert.plate}</span>
                          <span>{alert.branch} · {alert.time}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.dashboardCompactRowAction}
                          onClick={() => relatedInspection && setViewDetailsInspection(relatedInspection)}
                          disabled={!relatedInspection}
                        >
                          Ver detalhes
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        )}
        {/* ========================================================= */}
        {/* ABA 2: HISTÓRICO COMPLETO DE VISTORIAS */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Barra de Filtros e Busca */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                    Histórico Geral de Vistorias
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    Consulte laudos, filtre por status de avarias ou faça download e envio pelo WhatsApp.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={onStartNewInspection}
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={15} />
                    Nova Vistoria
                  </button>
                </div>
              </div>

              {/* Linha de Controles de Busca e Filtro */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Campo de Pesquisa */}
                <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                  <Search
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    placeholder="Buscar por placa, modelo, marca ou operador..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Filtro por Status */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid ' + (statusFilter === 'ALL' ? '#2563eb' : '#cbd5e1'),
                      backgroundColor: statusFilter === 'ALL' ? '#eff6ff' : '#ffffff',
                      color: statusFilter === 'ALL' ? '#2563eb' : '#475569',
                    }}
                  >
                    Todas ({realInspections.length})
                  </button>

                  {(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid ' + (statusFilter === status ? '#2563eb' : '#cbd5e1'),
                        backgroundColor: statusFilter === status ? '#eff6ff' : '#ffffff',
                        color: statusFilter === status ? '#2563eb' : '#475569',
                      }}
                    >
                      {getOwnerInspectionStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de Vistorias */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {realInspectionReadState === 'LOADING' ? (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#64748b',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                    Carregando inspeções...
                  </p>
                </div>
              ) : realInspectionReadState === 'ERROR' ? (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#fff7ed',
                    borderRadius: '12px',
                    border: '1px solid #fed7aa',
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#9a3412',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                    {realInspectionReadError || 'Não foi possível carregar as inspeções agora.'}
                  </p>
                </div>
              ) : filteredRealInspections.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#64748b',
                  }}
                >
                  <Search size={32} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>
                    {realInspectionReadState === 'EMPTY'
                      ? 'Nenhuma inspeção disponível.'
                      : 'Nenhuma inspeção encontrada com os filtros selecionados.'}
                  </p>
                </div>
              ) : (
                filteredRealInspections.map((insp) => (
                  <div
                    key={insp.inspectionId}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                      transition: 'box-shadow 0.15s',
                    }}
                  >
                    {/* Dados do Veículo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '260px' }}>
                      <div
                        style={{
                          backgroundColor: '#0f172a',
                          color: '#ffffff',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '13px',
                          border: '2px solid #334155',
                          textAlign: 'center',
                          minWidth: '80px',
                        }}
                      >
                        {insp.plate || '—'}
                      </div>

                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          {[insp.make, insp.model, insp.version].filter(Boolean).join(' ') || 'Veículo não identificado'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>
                            {insp.color || '—'} • {insp.modelYear || insp.manufactureYear || 'Ano não informado'}
                          </span>
                          <span>•</span>
                          <span>{insp.branchName}{insp.branchCode !== '—' ? ` (${insp.branchCode})` : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Responsável & Horário */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                        Responsável / Atualização
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        {insp.assignedUserId ? 'Responsável atribuído' : '—'}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {formatOwnerInspectionTimestamp(insp.startedAt || insp.updatedAt)}
                      </span>
                    </div>

                    {/* Badge de Status real */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: insp.status === 'COMPLETED' ? '#f0fdf4' : insp.status === 'CANCELLED' ? '#fef2f2' : '#eff6ff',
                          color: insp.status === 'COMPLETED' ? '#166534' : insp.status === 'CANCELLED' ? '#991b1b' : '#1e40af',
                          border: `1px solid ${insp.status === 'COMPLETED' ? '#bbf7d0' : insp.status === 'CANCELLED' ? '#fecaca' : '#bfdbfe'}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {insp.status === 'COMPLETED' && <CheckCircle2 size={13} />}
                        {insp.status === 'IN_PROGRESS' && <Clock size={13} />}
                        {insp.status === 'CANCELLED' && <AlertTriangle size={13} />}
                        {getOwnerInspectionStatusLabel(insp.status)}
                      </span>
                    </div>

                    {/* Detalhes/PDF permanecem fora do escopo da Phase A */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'not-allowed',
                          opacity: 0.6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Detalhes serão integrados na próxima fase"
                      >
                        <Eye size={13} />
                        Detalhes
                      </button>

                      <button
                        type="button"
                        disabled
                        style={{
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'not-allowed',
                          opacity: 0.6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="PDF será integrado na próxima fase"
                      >
                        <Download size={13} />
                        Baixar PDF
                      </button>

                      <button
                        type="button"
                        disabled
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'not-allowed',
                          opacity: 0.6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 1px 3px rgba(22, 163, 74, 0.25)',
                        }}
                        title="Envio será integrado na próxima fase"
                      >
                        <MessageSquare size={13} />
                        WhatsApp (PDF)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: EQUIPES & ASSENTOS / OPERADORES */}
        {/* ========================================================= */}
        {activeTab === 'team' && (
          <div>
            <TeamManagement
              currentUser={currentUser}
              onBack={() => handleExistingTabChange('dashboard', 'home')}
              onStartInspectionForUser={() => openCreateInspectionModal()}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 4: CONTROLES DE LOGINS & ACESSOS (AUDITORIA E SEGURANÇA) */}
        {/* ========================================================= */}
        {activeTab === 'access' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header da Seção de Segurança */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="#2563eb" />
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Controle de Logins & Acessos de Operadores
                  </h2>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Audite sessões abertas nos pátios, aparelhos conectados, horários de login e desconecte sessões remotamente.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  3 Dispositivos Ativos Agora
                </span>
              </div>
            </div>

            {/* Configuração de Políticas de Segurança (Toggles) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '18px',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Políticas de Acesso da Empresa
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '14px',
                }}
              >
                {/* Toggle 1: GPS Obrigatório */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      Exigir GPS na Abertura de Vistoria
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Registra as coordenadas exatas do pátio para evitar fraudes ou vistorias remotas.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireGps}
                    onChange={(e) => setRequireGps(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                </div>

                {/* Toggle 2: Restringir por Horário */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      Restringir a Horário Comercial
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Bloqueia logins de operadores fora do turno homologado (07:00 às 19:00).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={businessHoursOnly}
                    onChange={(e) => setBusinessHoursOnly(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                </div>

                {/* Toggle 3: Foto de Identificação */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      Foto do Operador no Laudo
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Associa a foto do crachá/selfie do vistoriador ao documento final em PDF.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requirePhotoId}
                    onChange={(e) => setRequirePhotoId(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                </div>

                {/* Toggle 4: Alertas de Novos Logins */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                      Notificar Novos Aparelhos
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      Avisa o proprietário por e-mail quando um operador logar em um aparelho desconhecido.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyNewLogins}
                    onChange={(e) => setNotifyNewLogins(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Tabela de Auditoria de Logins e Sessões */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Registro de Acessos Recentes & Dispositivos
                </h3>

                <div style={{ position: 'relative', width: '260px' }}>
                  <Search
                    size={14}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    placeholder="Filtrar por nome, aparelho ou IP..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 30px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Lista dos Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: log.status === 'ONLINE' ? '#ffffff' : '#f8fafc',
                      border: log.isCurrentSession ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    {/* Usuário */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: log.userRole === 'Proprietário' ? '#eff6ff' : '#f1f5f9',
                          color: log.userRole === 'Proprietário' ? '#2563eb' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                        }}
                      >
                        {log.userName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{log.userName}</span>
                          {log.isCurrentSession && (
                            <span
                              style={{
                                fontSize: '10px',
                                backgroundColor: '#dbeafe',
                                color: '#1e40af',
                                padding: '1px 5px',
                                borderRadius: '4px',
                              }}
                            >
                              Sua Sessão
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {log.userRole} • {log.branch}
                        </div>
                      </div>
                    </div>

                    {/* Aparelho & IP */}
                    <div style={{ minWidth: '220px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {log.device.includes('iPhone') || log.device.includes('Galaxy') || log.device.includes('Motorola') ? (
                          <Smartphone size={13} color="#2563eb" />
                        ) : (
                          <Laptop size={13} color="#475569" />
                        )}
                        <span>{log.device}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        IP: {log.ipAddress} ({log.location})
                      </div>
                    </div>

                    {/* Horário */}
                    <div style={{ minWidth: '160px' }}>
                      <div style={{ fontSize: '12px', color: '#334155' }}>
                        Entrada: <strong>{log.loginTime}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Atividade: {log.lastActivity}
                      </div>
                    </div>

                    {/* Status e Ação */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor:
                            log.status === 'ONLINE' ? '#f0fdf4' : '#f1f5f9',
                          color: log.status === 'ONLINE' ? '#166534' : '#64748b',
                          border: `1px solid ${
                            log.status === 'ONLINE' ? '#bbf7d0' : '#e2e8f0'
                          }`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: log.status === 'ONLINE' ? '#16a34a' : '#94a3b8',
                          }}
                        />
                        {log.status === 'ONLINE' ? 'Ativo' : 'Encerrado'}
                      </span>

                      {!log.isCurrentSession && log.status === 'ONLINE' && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(log.id, log.userName)}
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="Desconectar sessão do operador remotamente"
                        >
                          Revogar Acesso
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {isCreateInspectionOpen && (
        <div
          className={styles.createInspectionOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreateInspectionModal();
          }}
        >
          <div
            className={styles.createInspectionModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-inspection-title"
          >
            <div className={styles.createInspectionHeader}>
              <div>
                <span className={styles.createInspectionEyebrow}>NOVA VISTORIA</span>
                <h2 id="create-inspection-title" className={styles.createInspectionTitle}>
                  Criar vistoria como rascunho
                </h2>
                <p className={styles.createInspectionDescription}>
                  Selecione a unidade e o veículo. O responsável será definido antes do início da vistoria.
                </p>
              </div>
              <button
                type="button"
                className={styles.createInspectionCloseButton}
                onClick={closeCreateInspectionModal}
                disabled={isCreatingInspection}
                aria-label="Fechar criação de vistoria"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {createInspectionReadState === 'LOADING' ? (
              <div className={styles.createInspectionState} role="status">
                Carregando unidades...
              </div>
            ) : createInspectionReadState === 'ERROR' ? (
              <div className={styles.createInspectionError} role="alert">
                {createInspectionReadError || 'Não foi possível carregar as opções agora.'}
              </div>
            ) : createInspectionReadState === 'EMPTY' ? (
              <div className={styles.createInspectionEmpty}>
                <strong>Nenhuma unidade ativa cadastrada.</strong>
                <span>Cadastre uma unidade em Configurações &gt; Unidades antes de criar uma vistoria.</span>
              </div>
            ) : (
              <form className={styles.createInspectionForm} onSubmit={handleCreateInspection}>
                {canChooseBranch && availableBranches.length > 1 ? (
                  <label className={styles.createInspectionField}>
                    <span className={styles.createInspectionLabel}>Unidade *</span>
                    <select
                      className={styles.createInspectionSelect}
                      value={selectedBranchId}
                      onChange={(event) => setSelectedBranchId(event.target.value)}
                      autoFocus
                      disabled={isCreatingInspection}
                    >
                      <option value="">Selecione uma unidade</option>
                      {availableBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} {branch.code !== '—' ? `• ${branch.code}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className={styles.createInspectionContext}>
                    Vistoria em: <strong>{availableBranches[0]?.name || 'Unidade não resolvida'}</strong>
                    {availableBranches[0]?.code !== '—' && availableBranches[0]?.code
                      ? ` • ${availableBranches[0].code}`
                      : ''}
                  </div>
                )}

                <div className={styles.createInspectionField}>
                  <span className={styles.createInspectionLabel}>Identificar veículo</span>
                  <div className={styles.createInspectionLookupActions}>
                    <button
                      type="button"
                      className={styles.createInspectionQrButton}
                      disabled
                      title="Leitura por QR Code será adicionada em uma próxima etapa"
                    >
                      Ler QR Code
                    </button>
                    <span className={styles.createInspectionOr}>ou</span>
                    <span className={styles.createInspectionHint}>Digitar placa</span>
                  </div>
                  <div className={styles.createInspectionPlateLookup}>
                    <input
                      id="owner-create-vehicle-plate"
                      className={styles.createInspectionSearch}
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      maxLength={10}
                      value={vehiclePlateInput}
                      onChange={(event) => handleVehiclePlateInputChange(event.target.value)}
                      placeholder="ABC1D23"
                      aria-label="Placa do veículo"
                      disabled={isCreatingInspection}
                      autoFocus={!canChooseBranch || availableBranches.length === 1}
                    />
                    <button
                      type="button"
                      className={styles.createInspectionPrimaryButton}
                      onClick={handleFindVehicle}
                      disabled={isCreatingInspection || vehicleLookupState === 'LOADING' || !vehiclePlateInput}
                    >
                      {vehicleLookupState === 'LOADING' ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>

                  {vehicleLookupState === 'NOT_FOUND' && (
                    <div className={styles.createInspectionEmpty} role="status">
                      <strong>Veículo não encontrado.</strong>
                      <span>Cadastre o veículo antes de iniciar a vistoria.</span>
                    </div>
                  )}
                  {vehicleLookupState === 'AMBIGUOUS' && (
                    <div className={styles.createInspectionError} role="alert">
                      Não foi possível confirmar esta placa. Existem registros atuais inconsistentes.
                    </div>
                  )}
                  {vehicleLookupState === 'ERROR' && (
                    <div className={styles.createInspectionError} role="alert">
                      {vehicleLookupError || 'Não foi possível consultar o veículo agora.'}
                    </div>
                  )}

                  {identifiedVehicle && vehicleLookupState === 'FOUND' && (
                    <div className={styles.createInspectionVehicleConfirmation}>
                      <span className={styles.createInspectionVehiclePlate}>{identifiedVehicle.currentPlate}</span>
                      <span className={styles.createInspectionVehicleInfo}>
                        <strong>{[identifiedVehicle.make, identifiedVehicle.model, identifiedVehicle.version].filter(Boolean).join(' ') || 'Veículo identificado'}</strong>
                        <span>{[identifiedVehicle.modelYear, identifiedVehicle.color].filter(Boolean).join(' • ') || 'Dados complementares indisponíveis'}</span>
                      </span>
                      <button
                        type="button"
                        className={styles.createInspectionSecondaryButton}
                        onClick={() => setIsVehicleConfirmed(true)}
                        disabled={isCreatingInspection || isVehicleConfirmed}
                      >
                        {isVehicleConfirmed ? 'Veículo confirmado' : 'Usar este veículo'}
                      </button>
                    </div>
                  )}
                </div>

                {createInspectionError && (
                  <div className={styles.createInspectionError} role="alert">
                    {createInspectionError}
                  </div>
                )}

                <div className={styles.createInspectionFooter}>
                  <button
                    type="button"
                    className={styles.createInspectionSecondaryButton}
                    onClick={closeCreateInspectionModal}
                    disabled={isCreatingInspection}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={styles.createInspectionPrimaryButton}
                    disabled={isCreatingInspection || !selectedBranchId || !identifiedVehicle || !isVehicleConfirmed}
                  >
                    {isCreatingInspection ? 'Criando...' : 'Criar vistoria'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETALHES DE UMA VISTORIA SELECIONADA NO HISTÓRICO */}
      {/* ========================================================= */}
      {viewDetailsInspection && (
        <div
          id="inspection-details-modal-overlay"
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
            id="inspection-details-modal"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '13px',
                  }}
                >
                  {viewDetailsInspection.vehicle.plate}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {viewDetailsInspection.vehicle.brand} {viewDetailsInspection.vehicle.model} ({viewDetailsInspection.vehicle.year})
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Laudo Oficial • Vistoriador: {viewDetailsInspection.operatorName}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewDetailsInspection(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Resumo da Inspeção */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                fontSize: '12px',
              }}
            >
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Empresa / Pátio:</span>
                <strong style={{ color: '#0f172a' }}>{viewDetailsInspection.branchName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Data e Horário:</span>
                <strong style={{ color: '#0f172a' }}>{viewDetailsInspection.startedAt}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Tempo de Execução:</span>
                <strong style={{ color: '#0f172a' }}>{viewDetailsInspection.inspectionDuration}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Classificação Final:</span>
                <strong
                  style={{
                    color:
                      viewDetailsInspection.classification === 'APROVADO' ? '#16a34a' : '#d97706',
                  }}
                >
                  {viewDetailsInspection.classification === 'APROVADO'
                    ? 'Aprovado sem avarias'
                    : 'Com registro de avarias'}
                </strong>
              </div>
            </div>

            {/* Checklist Realizado */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Itens e Respostas Verificados:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(viewDetailsInspection.responses).map(([key, rawResp]) => {
                  const resp = rawResp as { value?: any; notes?: string; photos?: Array<{ url: string; caption?: string }> };
                  return (
                    <div
                      key={key}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '12px', color: '#1e293b' }}>
                          Etapa #{key}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                          ● Verificado
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155' }}>
                        <strong>Registro:</strong> {Array.isArray(resp?.value) ? resp.value.join(', ') : String(resp?.value ?? 'Concluído')}
                      </div>
                      {resp?.notes && (
                        <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                          Observação: "{resp.notes}"
                        </div>
                      )}
                      {resp?.photos && resp.photos.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          {resp.photos.map((photo, pIdx) => (
                            <img
                              key={pIdx}
                              src={photo.url}
                              alt={photo.caption || 'Foto'}
                              style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ações no Rodapé do Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => handleDownloadPdf(viewDetailsInspection)}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Download size={14} />
                Baixar Laudo PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  const item = viewDetailsInspection;
                  setViewDetailsInspection(null);
                  handleOpenSendPdf(item);
                }}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <MessageSquare size={14} />
                Enviar pelo WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE ENVIO DE LAUDO PDF PELO WHATSAPP (EXISTENTE) */}
      {/* ========================================================= */}
      {selectedInspectionForModal && (
        <SendPdfModal
          isOpen={isSendPdfOpen}
          onClose={() => {
            setIsSendPdfOpen(false);
            setSelectedInspectionForModal(null);
          }}
          inspection={selectedInspectionForModal}
          steps={activeTemplateForModal.steps}
          timing={{
            date: selectedInspectionForModal.startedAt.split(' às ')[0] || new Date().toLocaleDateString('pt-BR'),
            startTime: selectedInspectionForModal.startedAt.split(' às ')[1] || '14:30',
            endTime: selectedInspectionForModal.completedAt
              ? selectedInspectionForModal.completedAt.split(' às ')[1] || '14:48'
              : '14:48',
            duration: selectedInspectionForModal.inspectionDuration || '18 min',
          }}
        />
      )}
    </div>
  );
}
