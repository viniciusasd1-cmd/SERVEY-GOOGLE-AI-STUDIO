'use client';

import React, { useState, useRef } from 'react';
import { 
  ChecklistResponse, 
  ChecklistStep, 
  ChecklistStepStatus, 
  Inspection, 
  MockPhoto, 
  ResponseType 
} from '../../lib/inspection-types';
import { 
  MOCK_PHOTOS_GALLERY, 
  createMockPhotoDataUrl 
} from '../../lib/mock-inspection-data';
import styles from './inspection-ui.module.css';
import { 
  Check, 
  ChevronDown, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  RotateCcw,
  Sparkles,
  Database,
  Calendar,
  Clock,
  Download,
  Share2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { 
  recordInspectionResponse, 
  completeInspection, 
  clearInspectionResponse,
  InspectionResponseMutation
} from '../../src/lib/survey-api';
import { isSupabaseReady } from '../../src/lib/supabase';
import { generateInspectionPDF } from '../../src/lib/pdf-generator';
import { SendPdfModal } from './send-pdf-modal';
import { ThemeToggle } from '../ui/theme-toggle';

interface ChecklistScreenProps {
  inspection: Inspection;
  steps: ChecklistStep[];
  onFinishInspection?: (completedInspection: Inspection) => void;
  onChangeTemplate?: () => void;
  onBackToLanding?: () => void;
  isTestMode?: boolean;
  testCycleCompleted?: boolean;
  onGoToRegister?: () => void;
}

const isValidUUID = (val?: string) =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export const ChecklistScreen: React.FC<ChecklistScreenProps> = ({
  inspection: initialInspection,
  steps,
  onFinishInspection,
  onChangeTemplate,
  onBackToLanding,
  isTestMode = false,
  testCycleCompleted = false,
  onGoToRegister,
}) => {
  // Estado local das respostas e status das etapas
  const [inspection, setInspection] = useState<Inspection>(initialInspection);
  const [activeStepId, setActiveStepId] = useState<string | null>(() => {
    // Abre por padrão a primeira etapa pendente, se houver
    const firstPending = steps.find((s) => initialInspection.stepStatuses[s.id] !== 'COMPLETED');
    return firstPending ? firstPending.id : steps[0]?.id || null;
  });
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState<boolean>(false);
  const [isSendPdfModalOpen, setIsSendPdfModalOpen] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Input de arquivo invisível para fotos reais ou testes
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetPhotoStepId, setTargetPhotoStepId] = useState<string | null>(null);

  // Feedback das chamadas RPC do Supabase
  const [supabaseFeedback, setSupabaseFeedback] = useState<{
    type: 'error' | 'success';
    message: string;
  } | null>(null);

  // Contagem de progresso
  const completedCount = steps.filter(
    (step) => inspection.stepStatuses[step.id] === 'COMPLETED'
  ).length;
  const totalCount = steps.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allRequiredCompleted = steps
    .filter((s) => s.required)
    .every((s) => inspection.stepStatuses[s.id] === 'COMPLETED');

  // Detalhes calculados de data e horários da vistoria
  const getTimingDetails = () => {
    const now = new Date();
    const defaultDate = now.toLocaleDateString('pt-BR');
    const defaultTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let date = defaultDate;
    let startTime = '14:30';
    let endTime = defaultTime;

    if (inspection.startedAt) {
      if (inspection.startedAt.includes('às')) {
        const [d, t] = inspection.startedAt.split('às');
        if (d?.trim()) date = d.trim();
        if (t?.trim()) startTime = t.trim();
      } else if (inspection.startedAt.includes('T')) {
        const dt = new Date(inspection.startedAt);
        if (!isNaN(dt.getTime())) {
          date = dt.toLocaleDateString('pt-BR');
          startTime = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
      } else {
        date = inspection.startedAt;
      }
    }

    if (inspection.completedAt) {
      if (inspection.completedAt.includes('às')) {
        const [d, t] = inspection.completedAt.split('às');
        if (t?.trim()) endTime = t.trim();
        if (d?.trim()) date = d.trim();
      } else if (inspection.completedAt.includes('T')) {
        const dt = new Date(inspection.completedAt);
        if (!isNaN(dt.getTime())) {
          endTime = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          date = dt.toLocaleDateString('pt-BR');
        }
      } else {
        endTime = inspection.completedAt;
      }
    }

    let duration = '18 min';
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60;
        if (diff === 0) duration = 'Menos de 1 min';
        else duration = `${diff} min`;
      }
    } catch {
      duration = '18 min';
    }

    return { date, startTime, endTime, duration };
  };

  const timing = getTimingDetails();

  // Download direto do Laudo em PDF
  const handleDownloadDirectPDF = () => {
    try {
      setIsDownloadingPdf(true);
      const { doc, filename } = generateInspectionPDF(inspection, steps, timing);
      doc.save(filename);
      setPdfSuccessMessage(`Laudo PDF "${filename}" baixado com sucesso!`);
      setTimeout(() => setPdfSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Erro ao gerar laudo em PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Alterna expansão do card
  const toggleStepExpansion = (stepId: string) => {
    setActiveStepId((prev) => (prev === stepId ? null : stepId));
  };

  // Atualiza valor de resposta da etapa
  const handleUpdateResponseValue = (stepId: string, value: any) => {
    // Ponto de integração com Supabase:
    // RPC futura: `record_inspection_response` (params: { inspection_id: inspection.id, step_id: stepId, response_value: value })
    setInspection((prev) => {
      const currentResp = prev.responses[stepId] || {
        stepId,
        value: null,
        notes: '',
        photos: [],
      };
      return {
        ...prev,
        responses: {
          ...prev.responses,
          [stepId]: {
            ...currentResp,
            value,
          },
        },
      };
    });
  };

  // Atualiza observação da etapa
  const handleUpdateNotes = (stepId: string, notes: string) => {
    setInspection((prev) => {
      const currentResp = prev.responses[stepId] || {
        stepId,
        value: null,
        notes: '',
        photos: [],
      };
      return {
        ...prev,
        responses: {
          ...prev.responses,
          [stepId]: {
            ...currentResp,
            notes,
          },
        },
      };
    });
  };

  // Adiciona foto mockada local ou abre seleção de imagem do aparelho
  const handleTriggerAddPhoto = (stepId: string) => {
    setTargetPhotoStepId(stepId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Tratamento do upload de arquivo ou fallback mock
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!targetPhotoStepId) return;

    const file = e.target.files?.[0];
    const stepId = targetPhotoStepId;
    const currentStep = steps.find((s) => s.id === stepId);
    const stepTitle = currentStep ? currentStep.title : 'Item';

    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: MockPhoto = {
          id: `photo_${Date.now()}`,
          url: dataUrl,
          caption: `Foto do item ${stepTitle}`,
          timestamp: nowStr,
        };
        addPhotoToStep(stepId, newPhoto);
      };
      reader.readAsDataURL(file);
    } else {
      // Fallback para mock instantâneo caso o usuário cancele o seletor nativo
      handleSimulateFastPhoto(stepId);
    }

    // Limpa o input
    e.target.value = '';
    setTargetPhotoStepId(null);
  };

  // Simula foto instantânea elegante para demonstração rápida sem precisar de arquivos
  const handleSimulateFastPhoto = (stepId: string) => {
    const currentStep = steps.find((s) => s.id === stepId);
    const stepTitle = currentStep ? currentStep.title.toUpperCase() : 'INSPEÇÃO';
    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const gradients = [
      '<stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e293b"/>',
      '<stop offset="0%" stop-color="#0369a1"/><stop offset="100%" stop-color="#0284c7"/>',
      '<stop offset="0%" stop-color="#047857"/><stop offset="100%" stop-color="#059669"/>',
      '<stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#475569"/>',
    ];
    const selectedGrad = gradients[Math.floor(Math.random() * gradients.length)];

    const newPhoto: MockPhoto = {
      id: `photo_${Date.now()}`,
      url: createMockPhotoDataUrl(stepTitle, selectedGrad),
      caption: `Registro de ${stepTitle}`,
      timestamp: nowStr,
      isPlaceholder: true,
    };
    addPhotoToStep(stepId, newPhoto);
  };

  const addPhotoToStep = (stepId: string, photo: MockPhoto) => {
    // Ponto de integração com Supabase Storage / RPC
    setInspection((prev) => {
      const currentResp = prev.responses[stepId] || {
        stepId,
        value: null,
        notes: '',
        photos: [],
      };
      return {
        ...prev,
        responses: {
          ...prev.responses,
          [stepId]: {
            ...currentResp,
            photos: [...currentResp.photos, photo],
          },
        },
      };
    });
  };

  // Remover foto da etapa
  const handleRemovePhoto = (stepId: string, photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInspection((prev) => {
      const currentResp = prev.responses[stepId];
      if (!currentResp) return prev;
      return {
        ...prev,
        responses: {
          ...prev.responses,
          [stepId]: {
            ...currentResp,
            photos: currentResp.photos.filter((p) => p.id !== photoId),
          },
        },
      };
    });
  };

  // Concluir Etapa Atual: marca como COMPLETED, fecha card e abre o próximo pendente
  const handleCompleteStep = async (stepId: string) => {
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const stepMeta = steps.find((s) => s.id === stepId);

    const currentResp = inspection.responses[stepId] || {
      stepId,
      value: null,
      notes: '',
      photos: [],
    };

    // Se o usuário não preencheu valor em etapa booleana ao clicar em concluir, assume OK por padrão
    let finalValue = currentResp.value;
    if (stepMeta?.responseType === 'BOOLEAN' && finalValue === null) {
      finalValue = true;
    }

    setInspection((prev) => ({
      ...prev,
      stepStatuses: {
        ...prev.stepStatuses,
        [stepId]: 'COMPLETED',
      },
      responses: {
        ...prev.responses,
        [stepId]: {
          ...currentResp,
          value: finalValue,
          completedAt: nowTime,
        },
      },
    }));

    // Chamada da RPC real record_inspection_response no Supabase (apenas para IDs UUID reais fora do modo de teste)
    if (isTestMode || !isValidUUID(stepId)) {
      setSupabaseFeedback({
        type: 'success',
        message: 'Etapa salva no ambiente de teste (Sandbox isolado - sem alteração no banco de produção).',
      });
    } else if (isSupabaseReady()) {
      try {
        let mutation: InspectionResponseMutation;
        const type = stepMeta?.responseType || 'TEXT';

        if (type === 'BOOLEAN') {
          mutation = { type: 'BOOLEAN', value: Boolean(finalValue) };
        } else if (type === 'NUMBER') {
          mutation = { type: 'NUMBER', value: Number(finalValue || 0) };
        } else if (type === 'SINGLE_CHOICE') {
          mutation = { type: 'SINGLE_CHOICE', selectedOptionIds: [String(finalValue || '')] };
        } else if (type === 'MULTIPLE_CHOICE') {
          const arr = Array.isArray(finalValue) ? finalValue.map(String) : [String(finalValue || '')];
          mutation = { type: 'MULTIPLE_CHOICE', selectedOptionIds: arr };
        } else {
          mutation = { type: 'TEXT', value: String(finalValue || '') };
        }

        await recordInspectionResponse(stepId, mutation);
        setSupabaseFeedback({
          type: 'success',
          message: `Resposta salva no Supabase (RPC record_inspection_response).`,
        });
      } catch (err: any) {
        console.error('Supabase record_inspection_response error:', err);
        const isPermission = err?.message?.toLowerCase().includes('permission') || 
                             err?.message?.toLowerCase().includes('violates') ||
                             err?.code === '42501';
        setSupabaseFeedback({
          type: 'error',
          message: isPermission
            ? 'Erro de permissão no Supabase: o usuário precisa estar autenticado e ter membership válida na organização/filial desta inspeção.'
            : (err?.message || 'Falha ao gravar resposta no Supabase.'),
        });
      }
    }

    // Encontra o próximo card pendente na sequência
    const currentIndex = steps.findIndex((s) => s.id === stepId);
    let nextPendingStep: ChecklistStep | undefined;

    for (let i = currentIndex + 1; i < steps.length; i++) {
      if (inspection.stepStatuses[steps[i].id] !== 'COMPLETED') {
        nextPendingStep = steps[i];
        break;
      }
    }

    if (!nextPendingStep) {
      for (let i = 0; i < currentIndex; i++) {
        if (inspection.stepStatuses[steps[i].id] !== 'COMPLETED' && steps[i].id !== stepId) {
          nextPendingStep = steps[i];
          break;
        }
      }
    }

    if (nextPendingStep) {
      setActiveStepId(nextPendingStep.id);
    } else {
      setActiveStepId(null);
    }
  };

  // Concluir Vistoria Completa (RPC complete_inspection)
  const handleFinalizeInspection = async () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const finalized: Inspection = {
      ...inspection,
      status: 'COMPLETED',
      completedAt: `${dateStr} às ${timeStr}`,
    };
    setInspection(finalized);
    setIsCompletedModalOpen(true);

    if (isTestMode || !isValidUUID(inspection.id)) {
      setSupabaseFeedback({
        type: 'success',
        message: 'Vistoria do ambiente Sandbox finalizada com sucesso (1 ciclo experimental concluído).',
      });
    } else if (isSupabaseReady()) {
      try {
        await completeInspection(inspection.id);
        setSupabaseFeedback({
          type: 'success',
          message: 'Vistoria concluída com sucesso no Supabase (RPC complete_inspection)!',
        });
      } catch (err: any) {
        console.error('Supabase complete_inspection error:', err);
        const isPermission = err?.message?.toLowerCase().includes('permission') || 
                             err?.message?.toLowerCase().includes('violates') ||
                             err?.code === '42501';
        setSupabaseFeedback({
          type: 'error',
          message: isPermission
            ? 'Erro de permissão no Supabase: o usuário precisa estar autenticado e ter membership válida na organização/filial para concluir esta inspeção.'
            : (err?.message || 'Falha ao concluir vistoria no Supabase via complete_inspection.'),
        });
      }
    }

    if (onFinishInspection) {
      onFinishInspection(finalized);
    }
  };

  // Helper para gerar resumo curto no card recolhido
  const getStepSummarySnippet = (step: ChecklistStep, resp?: ChecklistResponse): string => {
    if (!resp) return 'Pendente de preenchimento';

    const parts: string[] = [];
    if (resp.photos && resp.photos.length > 0) {
      parts.push(`${resp.photos.length} ${resp.photos.length === 1 ? 'foto' : 'fotos'}`);
    }

    if (resp.value !== null && resp.value !== undefined && resp.value !== '') {
      if (step.responseType === 'BOOLEAN') {
        parts.push(resp.value === true ? 'Condição: OK' : 'Condição: Atenção');
      } else if (Array.isArray(resp.value)) {
        parts.push(`${resp.value.length} selecionado(s)`);
      } else {
        const textVal = String(resp.value);
        parts.push(textVal.length > 20 ? `${textVal.substring(0, 18)}...` : textVal);
      }
    } else if (resp.notes && resp.notes.trim().length > 0) {
      parts.push('Com observação');
    } else {
      parts.push('Sem observação');
    }

    return parts.join(' • ');
  };

  // Renderizador dos Controles por Tipo (BOOLEAN, TEXT, NUMBER, SINGLE_CHOICE, MULTIPLE_CHOICE)
  const renderResponseControls = (step: ChecklistStep, resp?: ChecklistResponse) => {
    const value = resp?.value;

    switch (step.responseType) {
      case 'BOOLEAN':
        return (
          <div className={styles.booleanControls}>
            <button
              type="button"
              id={`btn-bool-ok-${step.id}`}
              className={`${styles.booleanBtn} ${value === true ? styles.booleanOkSelected : ''}`}
              onClick={() => handleUpdateResponseValue(step.id, true)}
            >
              <Check size={18} />
              OK / Conforme
            </button>
            <button
              type="button"
              id={`btn-bool-warn-${step.id}`}
              className={`${styles.booleanBtn} ${value === false ? styles.booleanWarningSelected : ''}`}
              onClick={() => handleUpdateResponseValue(step.id, false)}
            >
              <AlertTriangle size={18} />
              Atenção / Avaria
            </button>
          </div>
        );

      case 'SINGLE_CHOICE':
        return (
          <div className={styles.choiceGrid}>
            {step.options?.map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  id={`btn-single-choice-${step.id}-${opt.replace(/\s+/g, '-')}`}
                  className={`${styles.choiceBtn} ${isSelected ? styles.choiceBtnSelected : ''}`}
                  onClick={() => handleUpdateResponseValue(step.id, opt)}
                >
                  <span>{opt}</span>
                  {isSelected && <Check size={16} color="#0f172a" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        );

      case 'MULTIPLE_CHOICE': {
        const selectedList: string[] = Array.isArray(value) ? value : [];
        const toggleOption = (opt: string) => {
          let updated: string[];
          if (selectedList.includes(opt)) {
            updated = selectedList.filter((item) => item !== opt);
          } else {
            updated = [...selectedList, opt];
          }
          handleUpdateResponseValue(step.id, updated);
        };

        return (
          <div className={styles.chipContainer}>
            {step.options?.map((opt) => {
              const isSelected = selectedList.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  id={`chip-${step.id}-${opt.replace(/\s+/g, '-')}`}
                  className={`${styles.chip} ${isSelected ? styles.chipSelected : ''}`}
                  onClick={() => toggleOption(opt)}
                >
                  {isSelected && <Check size={14} />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        );
      }

      case 'NUMBER':
        return (
          <div className={styles.numberInputWrapper}>
            <input
              type="number"
              id={`input-number-${step.id}`}
              className={`${styles.inputField} ${styles.inputFieldNumber}`}
              placeholder={step.placeholder || '0'}
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleUpdateResponseValue(step.id, e.target.value)}
            />
            {step.unit && <span className={styles.numberUnitSuffix}>{step.unit}</span>}
          </div>
        );

      case 'TEXT':
      default:
        return (
          <input
            type="text"
            id={`input-text-${step.id}`}
            className={styles.inputField}
            placeholder={step.placeholder || 'Digite a informação...'}
            value={value !== null && value !== undefined ? String(value) : ''}
            onChange={(e) => handleUpdateResponseValue(step.id, e.target.value)}
          />
        );
    }
  };

  return (
    <div className={styles.inspectionContainer} id="inspection-checklist-screen">
      {/* Input de arquivo invisível para fotos reais da câmera/galeria */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
        id="camera-file-input"
      />

      {/* Header Compacto Operacional */}
      <header className={styles.topNav} id="inspection-header">
        <div className={styles.topNavContent}>
          <div className={styles.brandGroup}>
            <span className={styles.brandBadge}>SURVEY</span>
            <div className={styles.vehicleSummary}>
              <span className={styles.vehiclePlate}>{inspection.vehicle.plate}</span>
              <span className={styles.vehicleModel} title={`${inspection.vehicle.brand} ${inspection.vehicle.model}`}>
                {inspection.vehicle.brand} {inspection.vehicle.model}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle variant="icon-only" id="checklist-header-theme-toggle" />
            {inspection.status === 'COMPLETED' && (
              <>
                <button
                  type="button"
                  id="btn-header-download-pdf"
                  className={styles.navActionBtn}
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    borderColor: '#bfdbfe',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                  }}
                  onClick={handleDownloadDirectPDF}
                  title="Salvar laudo em PDF"
                >
                  <Download size={13} />
                  <span>PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-header-send-pdf"
                  className={styles.navActionBtn}
                  style={{
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    borderColor: '#bbf7d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                  }}
                  onClick={() => setIsSendPdfModalOpen(true)}
                  title="Enviar laudo em PDF pelo WhatsApp"
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </button>
              </>
            )}

            {onChangeTemplate && (
              <button
                type="button"
                className={styles.navActionBtn}
                onClick={onChangeTemplate}
                id="btn-change-template"
                title="Trocar modelo de vistoria"
              >
                Modelo
              </button>
            )}
            {onBackToLanding && (
              <button
                type="button"
                className={styles.navActionBtn}
                onClick={onBackToLanding}
                id="btn-exit-to-landing"
                title="Sair para o início"
              >
                Início
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Faixa Informativa do Estado Único de Testes (Degustação de 1 Ciclo) */}
      {isTestMode && (
        <div
          id="checklist-test-mode-banner"
          style={{
            backgroundColor: '#fffbeb',
            borderBottom: '1px solid #fcd34d',
            padding: '7px 16px',
            fontSize: '12px',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#d97706" />
            <span>
              <strong>Ambiente de Testes Sandbox:</strong> Vistoria experimental de 1 ciclo único (sem impacto em dados reais).
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: '#fef3c7',
              color: '#b45309',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid #fde68a',
            }}
          >
            {testCycleCompleted ? 'Ciclo 1 de 1 Finalizado' : 'Ciclo 1 de 1 em Andamento'}
          </span>
        </div>
      )}

      {/* Barra de Progresso Sticky no Topo */}
      <div className={styles.progressStickyBar} id="sticky-progress-bar">
        <div className={styles.progressWrapper}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>
              {completedCount} de {totalCount} etapas concluídas
            </span>
            <span className={styles.progressPercent}>{progressPercentage}%</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progressPercentage}%` }}
              id="progress-bar-fill"
            />
          </div>
        </div>
      </div>

      {/* Feedback de Operação RPC Supabase */}
      {supabaseFeedback && (
        <div
          id="supabase-rpc-feedback"
          style={{
            maxWidth: '680px',
            margin: '12px auto 0',
            padding: '10px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '13px',
            lineHeight: 1.4,
            backgroundColor: supabaseFeedback.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${supabaseFeedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            color: supabaseFeedback.type === 'error' ? '#991b1b' : '#166534',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {supabaseFeedback.type === 'error' ? (
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
            ) : (
              <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
            )}
            <span>{supabaseFeedback.message}</span>
          </div>
          <button
            type="button"
            id="btn-close-rpc-feedback"
            onClick={() => setSupabaseFeedback(null)}
            aria-label="Fechar notificação"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              fontWeight: 700,
              fontSize: '14px',
              padding: '2px 6px',
              borderRadius: '4px',
              opacity: 0.8,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Lista Vertical de Cards de Etapas */}
      <main className={styles.checklistContent} id="checklist-content">
        <div className={styles.listHeader}>
          <div>
            <span className={styles.listTitle}>Itens da Vistoria</span>
            <span className={styles.listSubtitle}>{inspection.templateName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} color="#2563eb" />
              {timing.date}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color="#64748b" />
              Início: {timing.startTime}
            </span>
            {inspection.status === 'COMPLETED' && (
              <>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 600 }}>
                  <Check size={13} />
                  Conclusão: {timing.endTime} ({timing.duration})
                </span>
              </>
            )}
          </div>
        </div>

        <div className={styles.stepsList} id="checklist-steps-list">
          {steps.map((step, index) => {
            const status: ChecklistStepStatus = inspection.stepStatuses[step.id] || 'PENDING';
            const response = inspection.responses[step.id];
            const isExpanded = activeStepId === step.id;
            const isCompleted = status === 'COMPLETED';
            const photosCount = response?.photos?.length || 0;

            return (
              <div
                key={step.id}
                id={`step-card-${step.id}`}
                className={`
                  ${styles.stepCard} 
                  ${isExpanded ? styles.stepCardActive : ''} 
                  ${isCompleted ? styles.stepCardCompleted : ''}
                `}
              >
                {/* Botão de Cabeçalho do Card (Toque no Mobile) */}
                <button
                  type="button"
                  id={`btn-step-toggle-${step.id}`}
                  className={styles.cardHeaderBtn}
                  onClick={() => toggleStepExpansion(step.id)}
                  aria-expanded={isExpanded}
                >
                  <div className={styles.headerLeft}>
                    <span
                      className={`
                        ${styles.stepNumber} 
                        ${isCompleted ? styles.stepNumberCompleted : ''} 
                        ${isExpanded && !isCompleted ? styles.stepNumberActive : ''}
                      `}
                    >
                      {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
                    </span>

                    <div className={styles.headerTextGroup}>
                      <span className={styles.stepTitle}>
                        {step.title} {step.required && <span style={{ color: '#dc2626' }}>*</span>}
                      </span>
                      <span className={styles.stepSummarySnippet}>
                        {getStepSummarySnippet(step, response)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.headerRight}>
                    {/* Badge de Status */}
                    {isCompleted ? (
                      <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                        Concluído
                      </span>
                    ) : response?.value !== null && response?.value !== undefined ? (
                      <span className={`${styles.statusBadge} ${styles.statusWarning}`}>
                        Em andamento
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                        Pendente
                      </span>
                    )}

                    <ChevronDown
                      size={18}
                      className={`
                        ${styles.chevronIcon} 
                        ${isExpanded ? styles.chevronRotated : ''}
                      `}
                    />
                  </div>
                </button>

                {/* Conteúdo Expandido da Etapa (Apenas quando isExpanded for true) */}
                {isExpanded && (
                  <div className={styles.cardBody} id={`step-expanded-body-${step.id}`}>
                    {step.description && (
                      <p className={styles.stepDescription}>{step.description}</p>
                    )}

                    {/* Controles de Condição / Resposta Conforme Tipo */}
                    <div className={styles.controlGroup}>
                      <span className={styles.controlLabel}>Condição / Registro</span>
                      {renderResponseControls(step, response)}
                    </div>

                    {/* Área de Registro Fotográfico local */}
                    <div className={styles.photoSection}>
                      <span className={styles.controlLabel}>
                        Evidências Fotográficas
                      </span>
                      {response?.photos && response.photos.length > 0 && (
                        <div className={styles.photoGallery} aria-label={`Fotos do item ${step.title}`}>
                          {response.photos.map((photo) => (
                            <div className={styles.photoItem} key={photo.id}>
                              <img
                                className={styles.photoImg}
                                src={photo.url}
                                alt={photo.caption || `Foto do item ${step.title}`}
                              />
                              <button
                                type="button"
                                className={styles.removePhotoBtn}
                                onClick={(event) => handleRemovePhoto(step.id, photo.id, event)}
                                aria-label={`Remover ${photo.caption || `foto do item ${step.title}`}`}
                              >
                                <Trash2 size={13} aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.photoAddBtn}
                        onClick={() => handleTriggerAddPhoto(step.id)}
                        aria-label={`Adicionar foto ao item ${step.title}`}
                      >
                        <Camera size={18} aria-hidden="true" />
                        Adicionar foto
                      </button>
                    </div>

                    {/* Campo de Observações Curtas */}
                    <div className={styles.controlGroup}>
                      <span className={styles.controlLabel}>Observações (opcional)</span>
                      <textarea
                        id={`textarea-notes-${step.id}`}
                        className={styles.notesArea}
                        rows={2}
                        placeholder="Ex: pequenos riscos no canto esquerdo, lâmpada substituída..."
                        value={response?.notes || ''}
                        onChange={(e) => handleUpdateNotes(step.id, e.target.value)}
                      />
                    </div>

                    {/* Botão de Conclusão da Etapa */}
                    <button
                      type="button"
                      id={`btn-complete-step-${step.id}`}
                      className={styles.stepCompleteBtn}
                      onClick={() => handleCompleteStep(step.id)}
                    >
                      <Check size={18} strokeWidth={2.5} />
                      Concluir etapa
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Barra Fixa no Rodapé com Ação Principal de Conclusão */}
      <footer className={styles.bottomFixedBar} id="bottom-fixed-bar">
        <div className={styles.bottomFixedContent}>
          <div className={styles.bottomProgressInfo}>
            <span className={styles.bottomStepsCount}>
              {inspection.status === 'COMPLETED' ? 'Vistoria Concluída' : `${completedCount} / ${totalCount} concluídas`}
            </span>
            <span className={styles.bottomStepsHint}>
              {inspection.status === 'COMPLETED'
                ? 'Laudo técnico em PDF pronto para salvar ou enviar'
                : allRequiredCompleted
                ? 'Pronto para finalizar'
                : 'Etapas obrigatórias pendentes'}
            </span>
          </div>

          {inspection.status === 'COMPLETED' ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                id="btn-footer-download-pdf"
                onClick={handleDownloadDirectPDF}
                disabled={isDownloadingPdf}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                }}
              >
                <Download size={14} />
                {isDownloadingPdf ? 'Baixando...' : 'Salvar PDF'}
              </button>

              <button
                type="button"
                id="btn-footer-send-pdf"
                onClick={() => setIsSendPdfModalOpen(true)}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)',
                }}
              >
                <MessageSquare size={14} />
                WhatsApp (PDF)
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="btn-finalize-inspection"
              className={styles.primaryFinishBtn}
              disabled={!allRequiredCompleted}
              onClick={handleFinalizeInspection}
            >
              <FileCheck size={18} />
              Concluir vistoria
            </button>
          )}
        </div>
      </footer>

      {/* Modal / Tela de Estado Final Simples da Vistoria */}
      {isCompletedModalOpen && (
        <div className={styles.completedModalOverlay} id="completed-modal">
          <div className={styles.completedCard}>
            <div className={styles.successIconCircle}>
              <CheckCircle2 size={32} />
            </div>

            <h2 className={styles.completedTitle}>Vistoria Concluída</h2>
            <p className={styles.completedSubtitle}>
              Todos os itens operacionais foram verificados e registrados com sucesso.
            </p>

            <div className={styles.summarySection}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Veículo:</span>
                <span className={styles.summaryValue}>
                  {inspection.vehicle.brand} {inspection.vehicle.model} ({inspection.vehicle.plate})
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Modelo de vistoria:</span>
                <span className={styles.summaryValue}>{inspection.templateName}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Operador responsável:</span>
                <span className={styles.summaryValue}>{inspection.operatorName}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Data da vistoria:</span>
                <span className={styles.summaryValue} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#2563eb" />
                  {timing.date}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Horário de início:</span>
                <span className={styles.summaryValue} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="#64748b" />
                  {timing.startTime}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Horário de conclusão:</span>
                <span className={styles.summaryValue} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="#16a34a" />
                  {timing.endTime}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Duração total:</span>
                <span className={styles.summaryValue}>{timing.duration}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Etapas registradas:</span>
                <span className={styles.summaryValue}>
                  {completedCount} de {totalCount} ({progressPercentage}%)
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total de fotos anexadas:</span>
                <span className={styles.summaryValue}>
                  {(Object.values(inspection.responses) as ChecklistResponse[]).reduce(
                    (acc, curr) => acc + (curr.photos?.length || 0),
                    0
                  )}{' '}
                  fotos
                </span>
              </div>
            </div>

            {/* SEÇÃO EM DESTAQUE: SALVAR EM PDF E ENVIAR PDF */}
            <div
              id="modal-pdf-actions-box"
              style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '16px',
                marginBottom: '16px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      Laudo Técnico de Vistoria (PDF)
                    </h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      Documento oficial formatado com todos os itens, fotos e assinaturas
                    </p>
                  </div>
                </div>

                {pdfSuccessMessage && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#166534',
                      fontWeight: 600,
                      backgroundColor: '#f0fdf4',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    ✓ {pdfSuccessMessage}
                  </span>
                )}
              </div>

              {/* Botões Principais: Salvar em PDF e Enviar PDF */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  id="btn-modal-save-pdf"
                  onClick={handleDownloadDirectPDF}
                  disabled={isDownloadingPdf}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                    transition: 'transform 0.1s, background-color 0.15s',
                  }}
                >
                  <Download size={16} />
                  {isDownloadingPdf ? 'Gerando Laudo...' : 'Salvar em PDF'}
                </button>

                <button
                  type="button"
                  id="btn-modal-send-pdf"
                  onClick={() => setIsSendPdfModalOpen(true)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                    transition: 'transform 0.1s, background-color 0.15s',
                  }}
                >
                  <MessageSquare size={16} />
                  Enviar no WhatsApp (PDF)
                </button>
              </div>
            </div>

            {/* Aviso de Conclusão do Ciclo Único no Modo de Teste */}
            {isTestMode && (
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fcd34d',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginTop: '16px',
                  marginBottom: '16px',
                  textAlign: 'left',
                }}
                id="test-completion-summary-box"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Sparkles size={16} color="#d97706" />
                  <strong style={{ fontSize: '13px', color: '#92400e' }}>
                    Ciclo de Teste Concluído com Sucesso (1 de 1)
                  </strong>
                </div>
                <p style={{ fontSize: '12px', color: '#b45309', margin: 0, lineHeight: 1.4 }}>
                  Você utilizou a sua permissão de 1 ciclo único de vistoria experimental. 
                  O laudo técnico foi estruturado em ambiente isolado. Para continuar emitindo vistorias ilimitadas com múltiplos operadores na sua frota, crie seu cadastro corporativo.
                </p>
              </div>
            )}

            <div className={styles.modalActionButtons}>
              <button
                type="button"
                id="btn-modal-close"
                className={styles.stepCompleteBtn}
                onClick={() => setIsCompletedModalOpen(false)}
              >
                Visualizar checklist preenchido
              </button>

              {isTestMode ? (
                onGoToRegister && (
                  <button
                    type="button"
                    id="btn-modal-test-register"
                    className={styles.secondaryBtn}
                    style={{
                      borderColor: '#f59e0b',
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      fontWeight: 700,
                    }}
                    onClick={() => {
                      setIsCompletedModalOpen(false);
                      onGoToRegister();
                    }}
                  >
                    <CheckCircle2 size={16} color="#b45309" />
                    Finalizar Teste & Criar Cadastro Regular
                  </button>
                )
              ) : (
                onChangeTemplate && (
                  <button
                    type="button"
                    id="btn-modal-new-inspection"
                    className={styles.secondaryBtn}
                    onClick={() => {
                      setIsCompletedModalOpen(false);
                      onChangeTemplate();
                    }}
                  >
                    <RotateCcw size={16} />
                    Iniciar nova vistoria
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Dedicado para Enviar / Compartilhar o PDF */}
      <SendPdfModal
        isOpen={isSendPdfModalOpen}
        onClose={() => setIsSendPdfModalOpen(false)}
        inspection={inspection}
        steps={steps}
        timing={timing}
      />
    </div>
  );
};
