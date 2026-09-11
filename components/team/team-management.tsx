'use client';

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  AlertTriangle, 
  Search, 
  ArrowLeft,
  X,
  CreditCard,
  KeyRound,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { AuthenticatedUser } from '../auth/auth-screens';
import { useTheme } from '../../lib/theme-context';
import { ThemeToggle } from '../ui/theme-toggle';
import {
  CompanyUser,
  getRegisteredTeamUsers,
  addTeamUser,
  removeTeamUser,
} from '../../lib/team-store';

export type { CompanyUser };

export interface CompanySubscription {
  planName: 'Starter' | 'Equipe' | 'Profissional' | 'Enterprise';
  maxSeats: number;
  billingPeriod: 'Mensal' | 'Anual';
  status: 'ACTIVE' | 'TRIAL' | 'OVERDUE';
}

interface TeamManagementProps {
  currentUser: AuthenticatedUser | null;
  onBack: () => void;
  onStartInspectionForUser?: (operatorName: string) => void;
}

export function TeamManagement({
  currentUser,
  onBack,
  onStartInspectionForUser,
}: TeamManagementProps) {
  const { isDark } = useTheme();
  const [users, setUsers] = useState<CompanyUser[]>(() => getRegisteredTeamUsers());
  const [subscription, setSubscription] = useState<CompanySubscription>({
    planName: 'Equipe',
    maxSeats: 5,
    billingPeriod: 'Anual',
    status: 'ACTIVE',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Form para adicionar operador
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'OPERATOR' | 'MANAGER' | 'ADMIN'>('OPERATOR');
  const [newUserBranch, setNewUserBranch] = useState('Pátio Central - SP');
  const [modalError, setModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeUsersCount = users.filter((u) => u.status !== 'INACTIVE').length;
  const isSeatLimitReached = activeUsersCount >= subscription.maxSeats;
  const usagePercentage = Math.round((activeUsersCount / subscription.maxSeats) * 100);

  // Filtragem de operadores
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Exibir toast temporário
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Adicionar novo operador
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (isSeatLimitReached) {
      setModalError(
        `Limite de assentos atingido (${subscription.maxSeats}/${subscription.maxSeats}). Faça upgrade do plano para cadastrar mais operadores.`
      );
      return;
    }

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setModalError('Preencha o nome completo e o e-mail corporativo do operador.');
      return;
    }

    const emailExists = users.some(
      (u) => u.email.toLowerCase() === newUserEmail.trim().toLowerCase()
    );
    if (emailExists) {
      setModalError('Já existe um usuário cadastrado com este e-mail nesta empresa.');
      return;
    }

    const newUser: CompanyUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      branch: newUserBranch,
      status: 'ACTIVE',
      inspectionsCount: 0,
      lastLogin: 'Primeiro acesso pendente',
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };

    const updated = addTeamUser(newUser);
    setUsers(updated);
    setIsAddModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    showToast(`Usuário ${newUser.name} (${newUser.role}) cadastrado com sucesso!`);
  };

  // Remover usuário e liberar vaga
  const handleRemoveUser = (userId: string, userName: string) => {
    if (users.length <= 1) {
      alert('A empresa deve possuir ao menos 1 usuário administrador ativo.');
      return;
    }
    if (confirm(`Deseja desativar o acesso de ${userName}? A licença ficará disponível para outro operador.`)) {
      const updated = removeTeamUser(userId);
      setUsers(updated);
      showToast(`Usuário ${userName} removido. 1 assento liberado!`);
    }
  };

  // Alterar Plano para Teste do Limite de Assentos
  const handleChangePlan = (plan: 'Starter' | 'Equipe' | 'Profissional' | 'Enterprise', seats: number) => {
    setSubscription((prev) => ({
      ...prev,
      planName: plan,
      maxSeats: seats,
    }));
    setIsPlanModalOpen(false);
    showToast(`Plano alterado para ${plan} (${seats} assentos disponíveis).`);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
            Administrador
          </span>
        );
      case 'MANAGER':
        return (
          <span style={{ backgroundColor: '#fdf2f8', color: '#be185d', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
            Gestor de Pátio
          </span>
        );
      default:
        return (
          <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
            Vistoriador / Operador
          </span>
        );
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#090d16' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        padding: '24px 16px',
        transition: 'background-color 0.2s ease',
      }}
      id="team-management-screen"
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Toast Notificação */}
        {successToast && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              backgroundColor: isDark ? '#1e293b' : '#0f172a',
              color: '#ffffff',
              padding: '12px 18px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 9999,
              border: isDark ? '1px solid #334155' : 'none',
            }}
          >
            <CheckCircle2 size={18} color="#22c55e" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Topo / Voltar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: isDark ? '#1e293b' : '#ffffff',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: isDark ? '#f8fafc' : '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            id="btn-back-from-team"
          >
            <ArrowLeft size={16} />
            Voltar para a área principal
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle variant="compact" id="team-header-theme-toggle" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>Empresa:</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={15} color="#2563eb" />
                {currentUser?.company || 'Locafrotas Locadora & Gestão de Pátio'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Principal da Tela */}
        <div
          style={{
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Users size={22} color="#2563eb" />
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', margin: 0 }}>
                  Gestão de Equipe & Controle de Licenças (Multi-Login)
                </h1>
              </div>
              <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                Cada vistoriador possui seu próprio login com rastreabilidade jurídica individual no laudo.
                Cadastre novos operadores conforme o total de licenças adquiridas no plano da sua empresa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              style={{
                backgroundColor: isSeatLimitReached ? '#94a3b8' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isSeatLimitReached ? 'not-allowed' : 'pointer',
                boxShadow: isSeatLimitReached ? 'none' : '0 2px 8px rgba(37,99,235,0.25)',
              }}
              id="btn-open-add-user-modal"
            >
              <UserPlus size={16} />
              Adicionar Novo Operador
            </button>
          </div>

          {/* Card de Status dos Assentos / Licenças Compradas */}
          <div
            style={{
              marginTop: '20px',
              padding: '16px 20px',
              backgroundColor: isSeatLimitReached ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${isSeatLimitReached ? '#fecaca' : '#e2e8f0'}`,
              borderRadius: '10px',
            }}
            id="seat-quota-banner"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Plano {subscription.planName}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                  {activeUsersCount} de {subscription.maxSeats} assentos utilizados ({subscription.maxSeats - activeUsersCount} disponíveis)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                  id="btn-change-plan-simulation"
                >
                  Alterar plano / Adicionar assentos
                </button>
              </div>
            </div>

            {/* Barra de Progresso Visual das Vagas */}
            <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(usagePercentage, 100)}%`,
                  height: '100%',
                  backgroundColor: isSeatLimitReached ? '#ef4444' : usagePercentage > 80 ? '#f59e0b' : '#2563eb',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {isSeatLimitReached && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <AlertTriangle size={15} />
                <span>
                  Você atingiu o limite máximo de {subscription.maxSeats} usuários contratados. Adquira assentos adicionais para habilitar novos operadores.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Operadores Cadastrados */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* Barra de Busca e Filtros */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou filial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  fontSize: '13px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  outline: 'none',
                }}
                id="input-search-users"
              />
            </div>

            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Mostrando <strong>{filteredUsers.length}</strong> operador(es)
            </div>
          </div>

          {/* Listagem */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Operador / E-mail</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Perfil</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Pátio / Filial</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Vistorias</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600 }}>Último Acesso</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            flexShrink: 0,
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{user.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>{getRoleBadge(user.role)}</td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>{user.branch}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{user.inspectionsCount}</span> laudos
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '12px' }}>
                      {user.lastLogin}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {onStartInspectionForUser && (
                          <button
                            type="button"
                            onClick={() => onStartInspectionForUser(user.name)}
                            style={{
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: '#1e293b',
                            }}
                            title="Iniciar vistoria como este operador"
                          >
                            Vistoriar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id, user.name)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                          }}
                          title="Remover operador e liberar vaga"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Novo Operador */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          id="modal-add-operator"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#2563eb" />
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Novo Operador / Vistoriador
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              O usuário receberá um convite por e-mail com senha temporária para acessar o aplicativo móvel ou web e realizar vistorias com login individual.
            </p>

            {modalError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Nome completo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fernando Souza"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                  id="input-new-user-name"
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  E-mail corporativo *
                </label>
                <input
                  type="email"
                  placeholder="fernando@suaempresa.com.br"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                  id="input-new-user-email"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Perfil de acesso
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e: any) => setNewUserRole(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                    id="select-new-user-role"
                  >
                    <option value="OPERATOR">Vistoriador</option>
                    <option value="MANAGER">Gestor de Pátio</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Pátio / Filial
                  </label>
                  <select
                    value={newUserBranch}
                    onChange={(e) => setNewUserBranch(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                    id="select-new-user-branch"
                  >
                    <option value="Pátio Central - SP">Pátio Central - SP</option>
                    <option value="Pátio Congonhas - SP">Pátio Congonhas - SP</option>
                    <option value="Filial Campinas">Filial Campinas</option>
                    <option value="Pátio Rio de Janeiro">Pátio Rio de Janeiro</option>
                  </select>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '11px', color: '#64748b', marginBottom: '20px' }}>
                ℹ️ Esta ação consumirá <strong>1 licença</strong> das {subscription.maxSeats - activeUsersCount} restantes do seu plano.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSeatLimitReached}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSeatLimitReached ? '#94a3b8' : '#2563eb',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isSeatLimitReached ? 'not-allowed' : 'pointer',
                  }}
                  id="btn-confirm-add-user"
                >
                  Criar Acesso do Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Simulador de Planos / Compra de Assentos */}
      {isPlanModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          id="modal-plan-selector"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#2563eb" />
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Simulação de Compra de Assentos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Alterne entre as opções de planos comercializados para validar como o sistema bloqueia ou libera o cadastro de usuários conforme a cota comprada:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => handleChangePlan('Starter', 1)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: subscription.planName === 'Starter' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: subscription.planName === 'Starter' ? '#eff6ff' : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Starter (1 Operador)</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Ideal para autônomos • R$ 24,90/mês</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>1 Assento</span>
              </button>

              <button
                type="button"
                onClick={() => handleChangePlan('Equipe', 5)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: subscription.planName === 'Equipe' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: subscription.planName === 'Equipe' ? '#eff6ff' : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Equipe (5 Operadores)</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Pequenas frotas e locadoras • R$ 74,90/mês</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>5 Assentos</span>
              </button>

              <button
                type="button"
                onClick={() => handleChangePlan('Profissional', 15)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: subscription.planName === 'Profissional' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: subscription.planName === 'Profissional' ? '#eff6ff' : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Profissional (15 Operadores)</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Múltiplas filiais e pátios • R$ 149,90/mês</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>15 Assentos</span>
              </button>

              <button
                type="button"
                onClick={() => handleChangePlan('Enterprise', 50)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: subscription.planName === 'Enterprise' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: subscription.planName === 'Enterprise' ? '#eff6ff' : '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Enterprise (50 Operadores)</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Grandes redes e transportadoras • Sob medida</div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>50 Assentos</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
