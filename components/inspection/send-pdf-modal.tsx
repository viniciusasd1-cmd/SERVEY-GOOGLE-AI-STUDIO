import React, { useState, useEffect } from 'react';
import {
  Share2,
  Download,
  Mail,
  MessageSquare,
  Copy,
  Check,
  X,
  FileText,
  Send,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Eye,
  Paperclip,
  CheckCheck
} from 'lucide-react';
import { Inspection, ChecklistStep } from '../../lib/inspection-types';
import { generateInspectionPDF, InspectionTiming } from '../../src/lib/pdf-generator';

interface SendPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: Inspection;
  steps: ChecklistStep[];
  timing?: InspectionTiming;
}

export const SendPdfModal: React.FC<SendPdfModalProps> = ({
  isOpen,
  onClose,
  inspection,
  steps,
  timing,
}) => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email' | 'direct'>('whatsapp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState<boolean>(false);
  const [whatsappSentHelp, setWhatsappSentHelp] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Detecta se o dispositivo suporta compartilhamento de arquivos reais (celulares/tablets e navegadores modernos)
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof window !== 'undefined') {
      try {
        if (navigator.share && navigator.canShare) {
          const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
          setCanShareFiles(navigator.canShare({ files: [testFile] }));
        } else {
          setCanShareFiles(false);
        }
      } catch {
        setCanShareFiles(false);
      }
    }
  }, []);

  if (!isOpen) return null;

  const vehicleDesc = `${inspection.vehicle.brand} ${inspection.vehicle.model} (${inspection.vehicle.plate})`;
  const dateStr = timing?.date || new Date().toLocaleDateString('pt-BR');
  const timeStr = timing?.endTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const operatorStr = inspection.operatorName || 'Operador SURVEY';

  // Texto formatado para acompanhamento
  const reportSummaryText = `📋 *LAUDO DE VISTORIA VEICULAR - SURVEY*
🚗 *Veículo:* ${vehicleDesc}
🏢 *Empresa / Frota:* ${inspection.vehicle.companyName || 'Não informada'}
👨‍🔧 *Vistoriador:* ${operatorStr}
📅 *Data & Horário:* ${dateStr} às ${timeStr}
⏱️ *Duração da Inspeção:* ${timing?.duration || '12 min'}
📋 *Modelo Aplicado:* ${inspection.templateName}
✅ *Status:* Vistoria Finalizada e Homologada

📎 *Segue em anexo o Laudo Técnico de Vistoria em PDF com todas as verificações, fotos e termos assinados.*`;

  // Função para Baixar PDF diretamente
  const handleDownloadPDF = () => {
    try {
      setIsGenerating(true);
      const { doc, filename } = generateInspectionPDF(inspection, steps, timing);
      doc.save(filename);
      setFeedbackMsg({
        type: 'success',
        text: `Arquivo "${filename}" baixado com sucesso!`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Função para Visualizar PDF em nova aba
  const handlePreviewPDF = () => {
    try {
      setIsGenerating(true);
      const { blob } = generateInspectionPDF(inspection, steps, timing);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setFeedbackMsg({
        type: 'success',
        text: 'Laudo aberto em nova guia para visualização!',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Erro ao visualizar PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Enviar PDF pelo WhatsApp usando Compartilhamento Nativo com o Arquivo PDF Anexado
  const handleSendWhatsAppWithDirectPdf = async () => {
    try {
      setIsGenerating(true);
      const { blob, filename } = generateInspectionPDF(inspection, steps, timing);
      const file = new File([blob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Laudo de Vistoria - ${inspection.vehicle.plate}`,
          text: reportSummaryText,
        });
        setFeedbackMsg({
          type: 'success',
          text: 'PDF anexado e enviado via aplicativo do WhatsApp!',
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Laudo de Vistoria - ${inspection.vehicle.plate}`,
          text: reportSummaryText,
        });
        handleDownloadPDF();
        setFeedbackMsg({
          type: 'info',
          text: 'O WhatsApp foi aberto e o PDF foi baixado para anexar na conversa!',
        });
      } else {
        handleSendWhatsAppWeb();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao compartilhar PDF:', err);
        handleSendWhatsAppWeb();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Enviar por WhatsApp Web (Computador / Fallback)
  const handleSendWhatsAppWeb = () => {
    handleDownloadPDF();

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const encodedText = encodeURIComponent(reportSummaryText);
    let url = '';
    if (cleanNumber.length >= 10) {
      const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
      url = `https://api.whatsapp.com/send?phone=${fullNumber}&text=${encodedText}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodedText}`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setWhatsappSentHelp(true);
    setFeedbackMsg({
      type: 'success',
      text: 'O PDF foi baixado no seu computador e a conversa do WhatsApp foi aberta!',
    });
  };

  // Compartilhamento Nativo Geral
  const handleNativeShare = async () => {
    try {
      setIsGenerating(true);
      const { blob, filename } = generateInspectionPDF(inspection, steps, timing);
      const file = new File([blob], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Laudo de Vistoria - ${inspection.vehicle.plate}`,
          text: reportSummaryText,
        });
        setFeedbackMsg({ type: 'success', text: 'Compartilhado com sucesso via aplicativo nativo!' });
      } else if (navigator.share) {
        await navigator.share({
          title: `Laudo de Vistoria - ${inspection.vehicle.plate}`,
          text: reportSummaryText,
        });
        setFeedbackMsg({ type: 'success', text: 'Resumo compartilhado com sucesso!' });
      } else {
        handleDownloadPDF();
        setFeedbackMsg({
          type: 'info',
          text: 'Seu navegador não suporta compartilhamento direto de arquivos. O PDF foi baixado.',
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err);
        handleDownloadPDF();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Enviar por E-mail
  const handleSendEmail = () => {
    handleDownloadPDF();

    const subject = encodeURIComponent(`Laudo de Vistoria Veicular - Placa ${inspection.vehicle.plate} - ${dateStr}`);
    const emailBody = encodeURIComponent(
      `Prezados,\n\nSegue o laudo técnico da vistoria veicular realizada:\n\n` +
      `Veículo: ${vehicleDesc}\n` +
      `Empresa/Frota: ${inspection.vehicle.companyName || 'Não informada'}\n` +
      `Operador Responsável: ${operatorStr}\n` +
      `Data/Horário: ${dateStr} às ${timeStr}\n` +
      `Modelo: ${inspection.templateName}\n` +
      `Status: Concluída com sucesso\n\n` +
      `* O arquivo oficial em PDF foi baixado no dispositivo para envio em anexo.\n\n` +
      `Atenciosamente,\nEquipe SURVEY`
    );

    const mailtoUrl = `mailto:${emailTo.trim()}?subject=${subject}&body=${emailBody}`;
    window.location.href = mailtoUrl;
    setFeedbackMsg({
      type: 'success',
      text: 'Cliente de e-mail aberto! O PDF foi baixado para você anexar à mensagem.',
    });
  };

  // Copiar resumo
  const handleCopyText = () => {
    navigator.clipboard.writeText(reportSummaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const expectedFilename = `Laudo_Vistoria_${inspection.vehicle.plate.toUpperCase().replace(/[^A-Z0-9]/g, '')}_${(timing?.date || new Date().toLocaleDateString('pt-BR')).replace(/\//g, '-')}.pdf`;

  return (
    <div
      id="send-pdf-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        id="send-pdf-modal-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '540px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Botão Fechar no Topo */}
        <button
          type="button"
          onClick={onClose}
          id="btn-close-send-modal"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
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
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid #bbf7d0',
            }}
          >
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Enviar Laudo em PDF
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              {inspection.vehicle.brand} {inspection.vehicle.model} • Placa{' '}
              <strong style={{ color: '#0f172a' }}>{inspection.vehicle.plate}</strong>
            </p>
          </div>
        </div>

        {/* Cartão de Identificação do Arquivo PDF */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '12px 14px',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 700,
                fontSize: '11px',
              }}
            >
              PDF
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '280px',
                }}
                title={expectedFilename}
              >
                {expectedFilename}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Laudo Oficial SURVEY • Formato A4 • Assinaturas e Fotos
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              id="btn-preview-pdf-inline"
              onClick={handlePreviewPDF}
              disabled={isGenerating}
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Abrir laudo em PDF para conferência"
            >
              <Eye size={13} />
              Ver
            </button>

            <button
              type="button"
              id="btn-download-pdf-inline"
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              style={{
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Baixar arquivo PDF no dispositivo"
            >
              <Download size={13} />
              Baixar
            </button>
          </div>
        </div>

        {/* Mensagem de Feedback */}
        {feedbackMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: feedbackMsg.type === 'success' ? '#f0fdf4' : '#eff6ff',
              color: feedbackMsg.type === 'success' ? '#166534' : '#1e40af',
              border: `1px solid ${feedbackMsg.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Seleção de Canais de Envio */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Selecione o canal de envio:
          </span>

          <div
            style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              padding: '3px',
              gap: '4px',
            }}
          >
            <button
              type="button"
              id="tab-whatsapp"
              onClick={() => setActiveTab('whatsapp')}
              style={{
                flex: 1,
                padding: '8px 10px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'whatsapp' ? '#ffffff' : 'transparent',
                color: activeTab === 'whatsapp' ? '#16a34a' : '#64748b',
                boxShadow: activeTab === 'whatsapp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <MessageSquare size={14} />
              WhatsApp
            </button>

            <button
              type="button"
              id="tab-email"
              onClick={() => setActiveTab('email')}
              style={{
                flex: 1,
                padding: '8px 10px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'email' ? '#ffffff' : 'transparent',
                color: activeTab === 'email' ? '#2563eb' : '#64748b',
                boxShadow: activeTab === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Mail size={14} />
              E-mail
            </button>

            <button
              type="button"
              id="tab-direct"
              onClick={() => setActiveTab('direct')}
              style={{
                flex: 1,
                padding: '8px 10px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: activeTab === 'direct' ? '#ffffff' : 'transparent',
                color: activeTab === 'direct' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'direct' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Smartphone size={14} />
              Compartilhar Geral
            </button>
          </div>
        </div>

        {/* Conteúdo da Aba Ativa: WHATSAPP COM PDF */}
        {activeTab === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Opção 1: Anexo Direto do PDF pelo WhatsApp (Celular / App Nativo) */}
            <div
              style={{
                border: '1.5px solid #86efac',
                backgroundColor: '#f0fdf4',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                      Anexar e Enviar Arquivo PDF no WhatsApp
                    </h4>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {canShareFiles ? 'RECOMENDADO' : 'CELULAR / APP'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#15803d', lineHeight: 1.4 }}>
                    Abre o aplicativo com o <strong>documento PDF anexado diretamente</strong> na conversa com o contato ou grupo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-send-whatsapp-direct-pdf"
                onClick={handleSendWhatsAppWithDirectPdf}
                disabled={isGenerating}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                  transition: 'background-color 0.15s',
                }}
              >
                <Paperclip size={16} />
                <span>{isGenerating ? 'Preparando Laudo...' : 'Enviar Arquivo PDF pelo WhatsApp'}</span>
                <ExternalLink size={14} />
              </button>
            </div>

            {/* Opção 2: Envio para número específico ou WhatsApp Web no Computador */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div>
                <label
                  htmlFor="input-whatsapp-num"
                  style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}
                >
                  Ou informe o número do destinatário (WhatsApp Web / PC):
                </label>
                <input
                  id="input-whatsapp-num"
                  type="tel"
                  placeholder="Ex: (11) 98765-4321 ou deixe em branco"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="button"
                id="btn-send-whatsapp-web"
                onClick={handleSendWhatsAppWeb}
                disabled={isGenerating}
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#166534',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Download size={14} />
                <span>Abrir no WhatsApp Web + Baixar PDF</span>
                <ExternalLink size={13} />
              </button>

              {/* Guia de 2 Passos para WhatsApp Web no PC */}
              {whatsappSentHelp && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '11.5px',
                    color: '#166534',
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Como anexar o PDF no WhatsApp Web:</strong>
                  <div style={{ marginTop: '4px' }}>
                    1. O arquivo <u>{expectedFilename}</u> já foi baixado no seu computador.<br />
                    2. Na janela que abriu no WhatsApp, basta <strong>arrastar o arquivo baixado para a conversa</strong> ou clicar no ícone de clipe 📎 &gt; Documento.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo da Aba: E-MAIL */}
        {activeTab === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label
                htmlFor="input-email-dest"
                style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}
              >
                E-mail do Destinatário / Gestor de Frota:
              </label>
              <input
                id="input-email-dest"
                type="email"
                placeholder="gestor@empresa.com.br, cliente@exemplo.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                Abre seu aplicativo padrão de e-mail com o laudo técnico preenchido. O arquivo PDF é baixado automaticamente para anexo.
              </span>
            </div>

            <button
              type="button"
              id="btn-send-email-action"
              onClick={handleSendEmail}
              disabled={isGenerating}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '11px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Mail size={16} />
              Enviar Laudo por E-mail
              <Send size={14} />
            </button>
          </div>
        )}

        {/* Conteúdo da Aba: COMPARTILHAMENTO GERAL */}
        {activeTab === 'direct' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.4 }}>
              Utilize o menu nativo do seu dispositivo móvel ou sistema operacional para enviar o PDF diretamente para qualquer aplicativo instalado (WhatsApp, Telegram, Gmail, AirDrop, Google Drive).
            </p>

            <button
              type="button"
              id="btn-native-share-action"
              onClick={handleNativeShare}
              disabled={isGenerating}
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '11px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.25)',
              }}
            >
              <Share2 size={16} />
              {isGenerating ? 'Preparando arquivo...' : 'Abrir Menu de Compartilhamento do Sistema'}
            </button>
          </div>
        )}

        {/* Seção de Copiar Texto Rápido */}
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Deseja apenas o resumo em texto?
          </span>
          <button
            type="button"
            id="btn-copy-summary-text"
            onClick={handleCopyText}
            style={{
              backgroundColor: copied ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${copied ? '#86efac' : '#cbd5e1'}`,
              color: copied ? '#166534' : '#334155',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {copied ? (
              <>
                <Check size={13} color="#16a34a" />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={13} />
                Copiar resumo da vistoria
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
