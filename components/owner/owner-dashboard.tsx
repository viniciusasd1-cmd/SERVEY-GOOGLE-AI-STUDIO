'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
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
  Check
} from 'lucide-react';
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
import { useTheme } from '../../lib/theme-context';
import { ThemeToggle } from '../ui/theme-toggle';

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
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'team' | 'access'>(initialTab);

  // Estados do Histórico
  const [inspectionsList, setInspectionsList] = useState<InspectionHistoryItem[]>(MOCK_HISTORICAL_INSPECTIONS);
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APROVADO' | 'COM_AVARIA' | 'PENDENTE'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

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

  // Filtro de Histórico
  const filteredInspections = inspectionsList.filter((insp) => {
    const term = historySearch.toLowerCase().trim();
    const matchesTerm =
      !term ||
      insp.vehicle.plate.toLowerCase().includes(term) ||
      insp.vehicle.model.toLowerCase().includes(term) ||
      insp.vehicle.brand.toLowerCase().includes(term) ||
      insp.operatorName.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'ALL' || insp.classification === statusFilter;

    const matchesBranch =
      branchFilter === 'ALL' || insp.branchName.includes(branchFilter);

    return matchesTerm && matchesStatus && matchesBranch;
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
      style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#090d16' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.2s ease',
      }}
    >
      {/* ========================================================= */}
      {/* CABEÇALHO DO PAINEL DO PROPRIETÁRIO */}
      {/* ========================================================= */}
      <header
        id="owner-header"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.04)',
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
          {/* Identificação da Empresa e Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                backgroundColor: isDark ? '#1e293b' : '#0f172a',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '14px',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: isDark ? '1px solid #334155' : 'none',
              }}
            >
              <span>SURVEY</span>
              <span
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                }}
              >
                PROPRIETÁRIO
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                  {currentUser.company || 'Locafrotas Gestão de Veículos'}
                </h1>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isDark ? '#86efac' : '#166534',
                    backgroundColor: isDark ? 'rgba(22, 101, 52, 0.25)' : '#f0fdf4',
                    border: isDark ? '1px solid rgba(134, 239, 172, 0.3)' : '1px solid #bbf7d0',
                    padding: '2px 7px',
                    borderRadius: '999px',
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
                      backgroundColor: '#16a34a',
                    }}
                  />
                  Plano Ativo
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                Painel Gerencial • Administrador: <strong style={{ color: isDark ? '#cbd5e1' : 'inherit' }}>{currentUser.name}</strong>
              </p>
            </div>
          </div>

          {/* Ações Rápidas no Topo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Alternador de Tema Claro / Escuro */}
            <ThemeToggle variant="compact" id="owner-header-theme-toggle" />

            {/* Botão de Simulação do Operador */}
            <button
              type="button"
              id="btn-simulate-operator"
              onClick={onSimulateOperator}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                color: isDark ? '#e2e8f0' : '#334155',
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

            {/* Botão de Sair */}
            <button
              type="button"
              id="btn-owner-logout"
              onClick={onLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'transparent',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                color: isDark ? '#94a3b8' : '#64748b',
                borderRadius: '8px',
                padding: '7px 10px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
              title="Encerrar sessão administrativa"
            >
              <LogOut size={13} />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegação entre Módulos / Abas */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            id="owner-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '12px 2px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              color: activeTab === 'dashboard' ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#64748b'),
              borderBottom: activeTab === 'dashboard' ? (isDark ? '2.5px solid #60a5fa' : '2.5px solid #2563eb') : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <LayoutDashboard size={15} />
            Visão Geral (Dashboard)
          </button>

          <button
            type="button"
            id="owner-tab-history"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 2px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              fontWeight: activeTab === 'history' ? 700 : 500,
              color: activeTab === 'history' ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#64748b'),
              borderBottom: activeTab === 'history' ? (isDark ? '2.5px solid #60a5fa' : '2.5px solid #2563eb') : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <ClipboardList size={15} />
            Histórico de Vistorias
            <span
              style={{
                fontSize: '10px',
                backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                color: isDark ? '#93c5fd' : '#2563eb',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              {inspectionsList.length}
            </span>
          </button>

          <button
            type="button"
            id="owner-tab-team"
            onClick={() => setActiveTab('team')}
            style={{
              padding: '12px 2px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              fontWeight: activeTab === 'team' ? 700 : 500,
              color: activeTab === 'team' ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#64748b'),
              borderBottom: activeTab === 'team' ? (isDark ? '2.5px solid #60a5fa' : '2.5px solid #2563eb') : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <Users size={15} />
            Equipe & Licenças
          </button>

          <button
            type="button"
            id="owner-tab-access"
            onClick={() => setActiveTab('access')}
            style={{
              padding: '12px 2px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '13px',
              fontWeight: activeTab === 'access' ? 700 : 500,
              color: activeTab === 'access' ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#64748b'),
              borderBottom: activeTab === 'access' ? (isDark ? '2.5px solid #60a5fa' : '2.5px solid #2563eb') : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldCheck size={15} />
            Controles de Logins & Acessos
            <span
              style={{
                fontSize: '10px',
                backgroundColor: isDark ? 'rgba(22, 163, 74, 0.2)' : '#f0fdf4',
                color: isDark ? '#86efac' : '#166534',
                border: isDark ? '1px solid rgba(134, 239, 172, 0.25)' : '1px solid #bbf7d0',
                padding: '1px 5px',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              3 Online
            </span>
          </button>
        </div>
      </header>

      {/* Notificação / Toast de Segurança */}
      {securityToast && (
        <div
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
        {/* ABA 1: VISÃO GERAL (DASHBOARD EXECUTIVO) */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Banner de Boas-vindas ao Proprietário */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                background: 'linear-gradient(to right, #ffffff, #f8fafc)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#2563eb',
                    letterSpacing: '0.5px',
                  }}
                >
                  Painel de Gestão & Rastreabilidade
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  Visão Geral da Operação de Vistorias
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Monitore em tempo real as inspeções realizadas pelos operadores nos pátios, homologações e registros de avarias.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  id="dash-btn-go-history"
                  onClick={() => setActiveTab('history')}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ClipboardList size={14} />
                  Ver Histórico Completo
                </button>

                <button
                  type="button"
                  id="dash-btn-go-team"
                  onClick={() => setActiveTab('team')}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Users size={14} />
                  Gerenciar Operadores
                </button>
              </div>
            </div>

            {/* Grid de 4 Cards de Métricas Principais (KPIs) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              {/* KPI 1: Vistorias no Mês */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    Vistorias Realizadas (Mês)
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ClipboardList size={16} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>248</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>+18% este mês</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  Média de 8.2 vistorias por dia útil
                </span>
              </div>

              {/* KPI 2: Vistorias Concluídas Hoje */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    Vistorias Concluídas Hoje
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#f0fdf4',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>18</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>em 3 pátios</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                  ● 1 vistoria em andamento agora
                </span>
              </div>

              {/* KPI 3: Índice Sem Avarias (Conformidade) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    Homologados Sem Avarias
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#fef3c7',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>88.5%</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#d97706' }}>11.5% com danos</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  Proteção com fotos e termos assinados
                </span>
              </div>

              {/* KPI 4: Operadores Conectados */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    Operadores Conectados
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users size={16} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>3 / 5</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>Assentos Ativos</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                  2 assentos disponíveis no plano
                </span>
              </div>
            </div>

            {/* Seção Dupla: Vistorias Recentes do Dia + Alertas de Avarias */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '16px',
              }}
            >
              {/* Painel Esquerdo: Vistorias Recentes Homologadas */}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      Últimas Vistorias Concluídas
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      Emissão recente de laudos com dados e assinaturas
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Ver todas <ChevronRight size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {inspectionsList.slice(0, 4).map((insp) => (
                    <div
                      key={insp.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '11px',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {insp.vehicle.plate}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            {insp.vehicle.brand} {insp.vehicle.model}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {insp.operatorName} • {insp.branchName}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor:
                              insp.classification === 'APROVADO'
                                ? '#f0fdf4'
                                : insp.classification === 'COM_AVARIA'
                                ? '#fef3c7'
                                : '#eff6ff',
                            color:
                              insp.classification === 'APROVADO'
                                ? '#166534'
                                : insp.classification === 'COM_AVARIA'
                                ? '#92400e'
                                : '#1e40af',
                          }}
                        >
                          {insp.classification === 'APROVADO'
                            ? 'Aprovado'
                            : insp.classification === 'COM_AVARIA'
                            ? 'Com Avaria'
                            : 'Em Andamento'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenSendPdf(insp)}
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '4px 7px',
                            cursor: 'pointer',
                            color: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Enviar PDF no WhatsApp"
                        >
                          <MessageSquare size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Painel Direito: Avarias Registradas & Auditoria Rápida */}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      Alertas de Avarias & Contestações
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      Veículos que entraram com danos fotografados
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#b45309',
                      backgroundColor: '#fef3c7',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    2 Avarias Recentes
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={15} color="#d97706" />
                        <strong style={{ fontSize: '12.5px', color: '#92400e' }}>
                          Honda Civic EXL • BRA2E19
                        </strong>
                      </div>
                      <span style={{ fontSize: '11px', color: '#b45309' }}>Hoje às 14:48</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#78350f', lineHeight: 1.4 }}>
                      Risco superficial de 5cm no para-choque traseiro direito registrado por Marcos Silveira com foto comprobatória.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const item = inspectionsList.find((i) => i.vehicle.plate === 'BRA2E19');
                          if (item) setViewDetailsInspection(item);
                        }}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #fed7aa',
                          color: '#92400e',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Ver Foto & Detalhes
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={15} color="#d97706" />
                        <strong style={{ fontSize: '12.5px', color: '#92400e' }}>
                          Jeep Compass • GHX9J88
                        </strong>
                      </div>
                      <span style={{ fontSize: '11px', color: '#b45309' }}>Hoje às 09:32</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#78350f', lineHeight: 1.4 }}>
                      2 avarias registradas na recepção da oficina: amassado na porta esquerda e ralado no para-choque dianteiro.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const item = inspectionsList.find((i) => i.vehicle.plate === 'GHX9J88');
                          if (item) setViewDetailsInspection(item);
                        }}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #fed7aa',
                          color: '#92400e',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Ver Foto & Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
                    Todas ({inspectionsList.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('APROVADO')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid ' + (statusFilter === 'APROVADO' ? '#16a34a' : '#cbd5e1'),
                      backgroundColor: statusFilter === 'APROVADO' ? '#f0fdf4' : '#ffffff',
                      color: statusFilter === 'APROVADO' ? '#166534' : '#475569',
                    }}
                  >
                    Aprovadas
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('COM_AVARIA')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1px solid ' + (statusFilter === 'COM_AVARIA' ? '#d97706' : '#cbd5e1'),
                      backgroundColor: statusFilter === 'COM_AVARIA' ? '#fef3c7' : '#ffffff',
                      color: statusFilter === 'COM_AVARIA' ? '#92400e' : '#475569',
                    }}
                  >
                    Com Avarias
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Vistorias */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredInspections.length === 0 ? (
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
                    Nenhuma vistoria encontrada com os filtros selecionados.
                  </p>
                </div>
              ) : (
                filteredInspections.map((insp) => (
                  <div
                    key={insp.id}
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
                        {insp.vehicle.plate}
                      </div>

                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                          {insp.vehicle.brand} {insp.vehicle.model}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{insp.vehicle.color} • {insp.vehicle.year}</span>
                          <span>•</span>
                          <span>{insp.branchName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vistoriador & Horário */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '180px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                        Vistoriador / Horário
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        {insp.operatorName}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {insp.startedAt} • {insp.inspectionDuration}
                      </span>
                    </div>

                    {/* Badge de Status / Avarias */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor:
                            insp.classification === 'APROVADO'
                              ? '#f0fdf4'
                              : insp.classification === 'COM_AVARIA'
                              ? '#fef3c7'
                              : '#eff6ff',
                          color:
                            insp.classification === 'APROVADO'
                              ? '#166534'
                              : insp.classification === 'COM_AVARIA'
                              ? '#92400e'
                              : '#1e40af',
                          border: `1px solid ${
                            insp.classification === 'APROVADO'
                              ? '#bbf7d0'
                              : insp.classification === 'COM_AVARIA'
                              ? '#fde68a'
                              : '#bfdbfe'
                          }`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {insp.classification === 'APROVADO' && <CheckCircle2 size={13} />}
                        {insp.classification === 'COM_AVARIA' && <AlertTriangle size={13} />}
                        {insp.classification === 'PENDENTE' && <Clock size={13} />}
                        {insp.classification === 'APROVADO'
                          ? '100% Aprovado'
                          : insp.classification === 'COM_AVARIA'
                          ? `${insp.damageCount} Avaria(s)`
                          : 'Em Andamento'}
                      </span>
                    </div>

                    {/* Ações Rápidas do Laudo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setViewDetailsInspection(insp)}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Ver fotos e itens checados"
                      >
                        <Eye size={13} />
                        Detalhes
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(insp)}
                        style={{
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Baixar laudo oficial em PDF"
                      >
                        <Download size={13} />
                        Baixar PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSendPdf(insp)}
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 1px 3px rgba(22, 163, 74, 0.25)',
                        }}
                        title="Enviar PDF no WhatsApp"
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
              onBack={() => setActiveTab('dashboard')}
              onStartInspectionForUser={(operatorName) => {
                onStartNewInspection();
              }}
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
