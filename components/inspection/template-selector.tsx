'use client';

import React, { useState } from 'react';
import { InspectionTemplate, VehicleInfo } from '../../lib/inspection-types';
import { MOCK_TEMPLATES } from '../../lib/mock-inspection-data';
import styles from '../../app/app/inspections/[inspectionId]/template/template.module.css';
import { 
  CheckCircle2, 
  Clock, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Car, 
  Wrench,
  Database,
  Users,
  Search,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  listAvailableInspectionTemplateVersions,
  setInspectionTemplate,
  startInspection,
  listAvailableInspectionAssignees
} from '../../src/lib/survey-api';
import { isSupabaseReady } from '../../src/lib/supabase';
import { ThemeToggle } from '../ui/theme-toggle';

interface TemplateSelectorProps {
  inspectionId: string;
  vehicle?: VehicleInfo;
  currentTemplateId?: string;
  onStartInspection: (templateId: string) => void;
  onBackToLanding?: () => void;
  isTestMode?: boolean;
  testCycleCompleted?: boolean;
  onUpgradeOrRegister?: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  inspectionId: initialInspectionId,
  vehicle = {
    plate: 'BRA2E19',
    model: 'Civic EXL 2.0 Flex Aut.',
    brand: 'Honda',
    year: 2022,
    color: 'Prata Platinum',
    companyName: 'Autosul Veículos & Vistorias',
  },
  currentTemplateId = 'tpl-completa',
  onStartInspection,
  onBackToLanding,
  isTestMode = false,
  testCycleCompleted = false,
  onUpgradeOrRegister,
}) => {
  const [currentInspectionId, setCurrentInspectionId] = useState<string>(initialInspectionId);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(currentTemplateId);
  const [isBound, setIsBound] = useState<boolean>(true);
  const [isCallingRpc, setIsCallingRpc] = useState<boolean>(false);
  const [rpcStatus, setRpcStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [assigneesList, setAssigneesList] = useState<any[] | null>(null);
  const [showRpcToolbar, setShowRpcToolbar] = useState<boolean>(false);

  const templates: InspectionTemplate[] = MOCK_TEMPLATES;
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  // Chamar RPC: list_available_inspection_template_versions
  const handleFetchTemplateVersions = async () => {
    if (!currentInspectionId.trim()) {
      setRpcStatus({ type: 'error', message: 'Informe um UUID válido de target_inspection_id.' });
      return;
    }

    setIsCallingRpc(true);
    setRpcStatus(null);

    try {
      const data = await listAvailableInspectionTemplateVersions(currentInspectionId.trim());
      console.log('RPC list_available_inspection_template_versions:', data);
      setRpcStatus({
        type: 'success',
        message: Array.isArray(data) && data.length > 0
          ? `Sucesso: ${data.length} versão(ões) de template publicada(s) retornada(s) pelo Supabase.`
          : 'Chamada executada: nenhuma versão publicada retornada para esta inspeção DRAFT.',
      });
    } catch (err: any) {
      console.error('Erro no listAvailableInspectionTemplateVersions:', err);
      const isPerm = err?.message?.toLowerCase().includes('permission') || 
                     err?.message?.toLowerCase().includes('violates') ||
                     err?.code === '42501';
      setRpcStatus({
        type: 'error',
        message: isPerm
          ? 'Erro de permissão no Supabase: o usuário precisa estar autenticado e ter membership válida na organização/filial da inspeção.'
          : (err?.message || 'Falha ao consultar list_available_inspection_template_versions no Supabase.'),
      });
    } finally {
      setIsCallingRpc(false);
    }
  };

  // Chamar RPC: list_available_inspection_assignees
  const handleFetchAssignees = async () => {
    if (!currentInspectionId.trim()) {
      setRpcStatus({ type: 'error', message: 'Informe um UUID de inspeção.' });
      return;
    }

    setIsCallingRpc(true);
    setRpcStatus(null);

    try {
      const data = await listAvailableInspectionAssignees(currentInspectionId.trim());
      console.log('RPC list_available_inspection_assignees:', data);
      setAssigneesList(Array.isArray(data) ? data : []);
      setRpcStatus({
        type: 'success',
        message: Array.isArray(data) && data.length > 0
          ? `${data.length} responsável(is) elegível(is) retornado(s) pelo Supabase.`
          : 'Nenhum responsável elegível retornado para esta inspeção.',
      });
    } catch (err: any) {
      console.error('Erro no listAvailableInspectionAssignees:', err);
      const isPerm = err?.message?.toLowerCase().includes('permission') || 
                     err?.message?.toLowerCase().includes('violates') ||
                     err?.code === '42501';
      setRpcStatus({
        type: 'error',
        message: isPerm
          ? 'Erro de permissão no Supabase: o usuário precisa estar autenticado e ter membership válida na organização/filial da inspeção.'
          : (err?.message || 'Falha ao consultar list_available_inspection_assignees.'),
      });
    } finally {
      setIsCallingRpc(false);
    }
  };

  // Selecionar Modelo (Chama RPC set_inspection_template se houver Supabase)
  const handleSelectTemplate = async (id: string) => {
    setSelectedTemplateId(id);
    setIsBound(true);

    if (isSupabaseReady() && currentInspectionId) {
      try {
        await setInspectionTemplate(currentInspectionId, id);
        setRpcStatus({
          type: 'success',
          message: `Modelo ${id} vinculado via RPC set_inspection_template.`,
        });
      } catch (err: any) {
        console.error('Erro no setInspectionTemplate:', err);
        const isPerm = err?.message?.toLowerCase().includes('permission') || 
                       err?.message?.toLowerCase().includes('violates') ||
                       err?.code === '42501';
        setRpcStatus({
          type: 'error',
          message: isPerm
            ? 'Erro de permissão no Supabase: o usuário precisa ter membership válida para vincular o checklist nesta inspeção.'
            : (err?.message || 'Falha ao vincular template via RPC no Supabase.'),
        });
      }
    }
  };

  // Iniciar Vistoria (Chama RPC start_inspection)
  const handleStart = async () => {
    if (isTestMode && testCycleCompleted) {
      setRpcStatus({
        type: 'error',
        message: 'Limite do modo de testes atingido: o ambiente de degustação autoriza a execução de apenas 1 ciclo único de vistoria.',
      });
      return;
    }

    if (!isTestMode && isSupabaseReady() && currentInspectionId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentInspectionId)) {
      try {
        await startInspection(currentInspectionId);
      } catch (err: any) {
        console.error('Erro no startInspection:', err);
        const isPerm = err?.message?.toLowerCase().includes('permission') || 
                       err?.message?.toLowerCase().includes('violates') ||
                       err?.code === '42501';
        setRpcStatus({
          type: 'error',
          message: isPerm
            ? 'Erro de permissão no Supabase: o usuário precisa estar autenticado e ter membership válida na organização/filial desta inspeção.'
            : (err?.message || 'Falha ao iniciar inspeção via RPC start_inspection no Supabase.'),
        });
      }
    }

    onStartInspection(selectedTemplateId);
  };

  const renderTemplateIcon = (id: string) => {
    switch (id) {
      case 'tpl-rapida':
        return <Zap size={18} color="#d97706" />;
      case 'tpl-locadora':
        return <Car size={18} color="#2563eb" />;
      case 'tpl-oficina':
        return <Wrench size={18} color="#475569" />;
      case 'tpl-completa':
      default:
        return <ShieldCheck size={18} color="#16a34a" />;
    }
  };

  return (
    <div className={styles.templateContainer} id="template-selector-screen">
      {/* Header Operacional */}
      <header className={styles.header} id="template-header">
        <div className={styles.headerInner}>
          <div className={styles.headerTitleGroup}>
            <h1 className={styles.title}>Selecionar modelo de vistoria</h1>
            <p className={styles.subtitle}>Escolha o checklist adequado para o veículo e operação</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle variant="icon-only" id="template-header-theme-toggle" />
            {onBackToLanding && (
              <button 
                type="button" 
                onClick={onBackToLanding}
                style={{
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#475569'
                }}
                id="back-to-landing-btn"
              >
                Voltar ao Início
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={styles.content} id="template-content-body">
        {/* Banner do Estado de Testes (Sandbox / Degustação de 1 Ciclo) */}
        {isTestMode && !testCycleCompleted && (
          <div
            id="sandbox-test-banner"
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#d97706',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#92400e' }}>
                  Ambiente de Testes (Degustação) • Permissão de 1 Ciclo Único
                </div>
                <div style={{ fontSize: '12px', color: '#b45309' }}>
                  Você está operando em um estado isolado de testes. Selecione um dos modelos abaixo para preencher o checklist.
                </div>
              </div>
            </div>
            <span
              style={{
                backgroundColor: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Ciclo 1 de 1 Disponível
            </span>
          </div>
        )}

        {isTestMode && testCycleCompleted && (
          <div
            id="sandbox-limit-banner"
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#991b1b' }}>
                  Limite de 1 Ciclo de Testes Atingido
                </div>
                <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                  Você já concluiu o seu ciclo único experimental de vistoria. Para gerar novos laudos ilimitados e cadastrar sua equipe, crie sua conta regular.
                </div>
              </div>
            </div>
            {onUpgradeOrRegister && (
              <button
                type="button"
                onClick={onUpgradeOrRegister}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Criar Cadastro Regular
              </button>
            )}
          </div>
        )}

        {/* Toggle para Barra Técnica de RPC Supabase */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setShowRpcToolbar(!showRpcToolbar)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 4px',
            }}
            id="toggle-rpc-toolbar-btn"
          >
            <Database size={12} />
            <span>{showRpcToolbar ? 'Ocultar ferramentas RPC Supabase' : 'Ferramentas RPC Supabase (Opcional)'}</span>
          </button>
        </div>

        {/* Barra de Teste RPC Supabase com input de inspectionId */}
        {showRpcToolbar && (
          <div
            id="supabase-rpc-toolbar"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                <Database size={16} color="#2563eb" />
                <span>Conexão Supabase SURVEY (RPCs Reais)</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Project: survey-dev
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 240px' }}>
                <label htmlFor="input-target-inspection-id" style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                  target_inspection_id (UUID da Inspeção)
                </label>
                <input
                  id="input-target-inspection-id"
                  type="text"
                  value={currentInspectionId}
                  onChange={(e) => setCurrentInspectionId(e.target.value)}
                  placeholder="Ex: d1e7bf2e-4b6a-4d78-9e5c-123456789abc"
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleFetchTemplateVersions}
                  disabled={isCallingRpc}
                  id="btn-rpc-list-templates"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: isCallingRpc ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Search size={13} />
                  Buscar Templates (RPC)
                </button>

                <button
                  type="button"
                  onClick={handleFetchAssignees}
                  disabled={isCallingRpc}
                  id="btn-rpc-list-assignees"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: isCallingRpc ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Users size={13} />
                  Listar Responsáveis
                </button>
              </div>
            </div>

            {/* Feedback da RPC */}
            {rpcStatus && (
              <div
                id="rpc-status-box"
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: rpcStatus.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  color: rpcStatus.type === 'error' ? '#991b1b' : '#166534',
                  border: `1px solid ${rpcStatus.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                }}
              >
                <AlertCircle size={15} />
                <span>{rpcStatus.message}</span>
              </div>
            )}

            {assigneesList && assigneesList.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569' }}>
                <strong>Responsáveis elegíveis:</strong> {assigneesList.map((a: any) => a.name || a.email || a.id).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Identificação do Veículo */}
        <div className={styles.vehicleBanner} id="vehicle-banner">
          <div className={styles.vehicleText}>
            <span className={styles.plateBadge}>{vehicle.plate}</span>
            <span className={styles.vehicleDesc}>
              {vehicle.brand} {vehicle.model} ({vehicle.year}) • {vehicle.color}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            ID: {currentInspectionId}
          </span>
        </div>

        {/* Lista de Modelos de Vistoria */}
        <div className={styles.templatesList} id="templates-list">
          {templates.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;

            return (
              <div
                key={tpl.id}
                id={`template-card-${tpl.id}`}
                className={`${styles.templateCard} ${isSelected ? styles.templateCardSelected : ''}`}
                onClick={() => handleSelectTemplate(tpl.id)}
              >
                <div className={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {renderTemplateIcon(tpl.id)}
                    <h2 className={styles.templateName}>{tpl.name}</h2>
                  </div>
                  <span className={styles.templateCategory}>{tpl.category}</span>
                </div>

                <p className={styles.templateDesc}>{tpl.description}</p>

                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <Layers size={14} />
                    <span>{tpl.stepsCount} etapas</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Clock size={14} />
                    <span>~{tpl.estimatedMinutes} minutos</span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`btn-use-template-${tpl.id}`}
                  className={`${styles.selectActionBtn} ${isSelected ? styles.selectActionBtnActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTemplate(tpl.id);
                  }}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 size={16} />
                      Modelo Selecionado
                    </>
                  ) : (
                    'Usar este modelo'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Estado "Modelo vinculado" e Ação de Iniciar */}
        {isBound && selectedTemplate && (
          <div className={styles.boundStateBanner} id="template-bound-banner">
            <div className={styles.boundInfo}>
              <CheckCircle2 size={24} color="#16a34a" />
              <div className={styles.boundTextGroup}>
                <span className={styles.boundStatus}>Modelo vinculado</span>
                <span className={styles.boundSub}>
                  {selectedTemplate.name} ({selectedTemplate.stepsCount} etapas configuradas)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botão de Iniciar Vistoria */}
        <button
          type="button"
          id="btn-start-inspection"
          className={styles.startInspectionBtn}
          onClick={handleStart}
          disabled={isTestMode && testCycleCompleted}
          style={
            isTestMode && testCycleCompleted
              ? { backgroundColor: '#94a3b8', cursor: 'not-allowed', opacity: 0.7 }
              : undefined
          }
        >
          {isTestMode && testCycleCompleted ? (
            <>
              <ShieldCheck size={18} />
              Limite de 1 Ciclo Concluído (Teste Finalizado)
            </>
          ) : (
            <>
              {isTestMode ? 'Iniciar Vistoria do Ciclo de Teste' : 'Iniciar vistoria'}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </main>
    </div>
  );
};
