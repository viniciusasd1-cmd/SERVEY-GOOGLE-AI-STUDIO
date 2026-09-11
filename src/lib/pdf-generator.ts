import { jsPDF } from 'jspdf';
import { Inspection, ChecklistStep, ChecklistResponse } from '../../lib/inspection-types';

export interface InspectionTiming {
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
}

export function generateInspectionPDF(
  inspection: Inspection,
  steps: ChecklistStep[],
  timing?: InspectionTiming
): { doc: jsPDF; filename: string; blob: Blob } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  const now = new Date();
  const currentDateStr = timing?.date || now.toLocaleDateString('pt-BR');
  const currentStartTime = timing?.startTime || inspection.startedAt || 'Não registrado';
  const currentEndTime = timing?.endTime || (inspection.completedAt || now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const durationStr = timing?.duration || '12 min';

  // --- CABEÇALHO PRINCIPAL ---
  // Barra superior colorida
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Marca / Logo SURVEY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('SURVEY', margin, y + 4);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('SISTEMA DE GESTÃO E VISTORIA DE FROTAS', margin, y + 9);

  // Selo de Status à direita
  doc.setFillColor(240, 253, 244); // Green 50
  doc.setDrawColor(34, 197, 94); // Green 500
  doc.roundedRect(pageWidth - margin - 58, y - 2, 58, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52); // Green 800
  doc.text('● VISTORIA CONCLUÍDA', pageWidth - margin - 54, y + 4);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(21, 128, 61);
  doc.text(`ID: ${inspection.id.slice(0, 18)}`, pageWidth - margin - 54, y + 9);

  y += 18;

  // Título do Laudo
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('LAUDO TÉCNICO DE VISTORIA VEICULAR', margin, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Emitido eletronicamente em ${currentDateStr} às ${currentEndTime}`, pageWidth - margin - 75, y);

  y += 8;

  // --- CARDS DE INFORMAÇÕES GERAIS (VEÍCULO E OPERAÇÃO) ---
  const boxHeight = 44;
  const colWidth = (contentWidth - 6) / 2;

  // Coluna 1: Dados do Veículo
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(margin, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DADOS DO VEÍCULO', margin + 6, y + 7);

  doc.setFontSize(8.5);
  const vRows = [
    { label: 'Placa:', value: inspection.vehicle.plate },
    { label: 'Modelo/Marca:', value: `${inspection.vehicle.brand} ${inspection.vehicle.model}` },
    { label: 'Ano / Cor:', value: `${inspection.vehicle.year} • ${inspection.vehicle.color}` },
    { label: 'Empresa / Frota:', value: inspection.vehicle.companyName || 'Não informada' },
  ];

  let vY = y + 14;
  vRows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(row.label, margin + 6, vY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row.value, margin + 35, vY);
    vY += 6.5;
  });

  // Coluna 2: Dados da Inspeção & Operador
  const col2X = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(col2X, y, colWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DADOS DA OPERAÇÃO', col2X + 6, y + 7);

  const oRows = [
    { label: 'Modelo Vistoria:', value: inspection.templateName },
    { label: 'Vistoriador:', value: inspection.operatorName || 'Operador SURVEY' },
    { label: 'Data & Início:', value: `${currentDateStr} às ${currentStartTime}` },
    { label: 'Conclusão & Tempo:', value: `${currentEndTime} (${durationStr})` },
  ];

  let oY = y + 14;
  oRows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(row.label, col2X + 6, oY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    // Truncate if too long
    const val = row.value.length > 28 ? row.value.slice(0, 26) + '...' : row.value;
    doc.text(val, col2X + 38, oY);
    oY += 6.5;
  });

  y += boxHeight + 8;

  // --- RESUMO ESTATÍSTICO DOS ITENS ---
  const totalSteps = steps.length;
  const responses = inspection.responses || {};
  let conformsCount = 0;
  let nonConformsCount = 0;
  let otherCount = 0;
  let totalPhotos = 0;

  steps.forEach((st) => {
    const resp = responses[st.id];
    if (resp?.photos) {
      totalPhotos += resp.photos.length;
    }
    if (st.responseType === 'BOOLEAN') {
      if (resp?.value === true) conformsCount++;
      else if (resp?.value === false) nonConformsCount++;
    } else if (resp?.value !== null && resp?.value !== undefined && resp?.value !== '') {
      otherCount++;
    }
  });

  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(margin, y, contentWidth, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const statText1 = `Total de Itens: ${totalSteps}`;
  const statText2 = `Conformes: ${conformsCount}`;
  const statText3 = `Não Conformes / Alertas: ${nonConformsCount}`;
  const statText4 = `Fotos Anexadas: ${totalPhotos}`;

  doc.text(statText1, margin + 8, y + 7.5);
  doc.text(statText2, margin + 48, y + 7.5);
  doc.text(statText3, margin + 90, y + 7.5);
  doc.text(statText4, margin + 148, y + 7.5);

  y += 18;

  // --- TABELA DE ITENS INSPECIONADOS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ITENS INSPECIONADOS & RESULTADOS', margin, y);
  y += 5;

  // Cabeçalho da Tabela
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(margin, y, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Nº', margin + 3, y + 4.8);
  doc.text('ITEM / COMPONENTE', margin + 12, y + 4.8);
  doc.text('STATUS / VALOR', margin + 90, y + 4.8);
  doc.text('OBSERVAÇÕES REGISTRADAS', margin + 130, y + 4.8);

  y += 7;

  // Linhas da Tabela
  steps.forEach((step, idx) => {
    // Verifica se precisa de nova página
    if (y > 260) {
      doc.addPage();
      y = 16;
      // Repete cabeçalho simples da tabela na nova página
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('Nº', margin + 3, y + 4.8);
      doc.text('ITEM / COMPONENTE', margin + 12, y + 4.8);
      doc.text('STATUS / VALOR', margin + 90, y + 4.8);
      doc.text('OBSERVAÇÕES REGISTRADAS', margin + 130, y + 4.8);
      y += 7;
    }

    const resp: ChecklistResponse | undefined = responses[step.id];
    const isEven = idx % 2 === 0;

    // Fundo zebra
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 10, 'F');
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 10, 'F');
    }

    // Linha divisória fina
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 10, margin + contentWidth, y + 10);

    // Número
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(String(idx + 1).padStart(2, '0'), margin + 3, y + 6.5);

    // Título do Item
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const itemTitle = step.title.length > 42 ? step.title.slice(0, 40) + '...' : step.title;
    doc.text(itemTitle, margin + 12, y + 6.5);

    // Status / Resposta
    let statusText = 'Não avaliado';
    let statusColor: [number, number, number] = [100, 116, 139];

    if (step.responseType === 'BOOLEAN') {
      if (resp?.value === true) {
        statusText = 'CONFORME';
        statusColor = [22, 101, 52]; // Green
      } else if (resp?.value === false) {
        statusText = 'NÃO CONFORME';
        statusColor = [185, 28, 28]; // Red
      }
    } else if (resp?.value !== null && resp?.value !== undefined && resp?.value !== '') {
      if (Array.isArray(resp.value)) {
        statusText = resp.value.join(', ');
      } else {
        statusText = String(resp.value);
        if (step.unit) statusText += ` ${step.unit}`;
      }
      statusColor = [30, 58, 138]; // Blue
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    const cleanStatus = statusText.length > 22 ? statusText.slice(0, 20) + '...' : statusText;
    doc.text(cleanStatus, margin + 90, y + 6.5);

    // Observações & Fotos
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    const notes = resp?.notes?.trim();
    const photoCount = resp?.photos?.length || 0;
    let noteDesc = notes || 'Sem anotações';
    if (photoCount > 0) {
      noteDesc += ` [${photoCount} foto(s)]`;
    }
    const cleanNotes = noteDesc.length > 32 ? noteDesc.slice(0, 30) + '...' : noteDesc;
    doc.text(cleanNotes, margin + 130, y + 6.5);

    y += 10;
  });

  // --- SEÇÃO DE ASSINATURAS ---
  if (y > 235) {
    doc.addPage();
    y = 20;
  } else {
    y += 12;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('TERMO DE RESPONSABILIDADE & ASSINATURAS', margin, y);
  y += 15;

  const signWidth = (contentWidth - 20) / 2;

  // Assinatura Vistoriador
  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.line(margin, y, margin + signWidth, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(inspection.operatorName || 'Operador Responsável', margin, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Vistoriador Credenciado SURVEY', margin, y + 8);

  // Assinatura Recebedor / Condutor
  const sign2X = margin + signWidth + 20;
  doc.line(sign2X, y, sign2X + signWidth, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Condutor / Responsável pela Frota', sign2X, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Assinatura do Recebedor', sign2X, y + 8);

  // Rodapé Oficial em todas as páginas
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 285, pageWidth - margin, 285);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Documento gerado eletronicamente pela plataforma SURVEY. Válido para controle interno e auditoria de frotas.',
      margin,
      290
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, 290);
  }

  const cleanPlate = inspection.vehicle.plate.replace(/[^a-zA-Z0-9]/g, '');
  const cleanDate = currentDateStr.replace(/\//g, '-');
  const filename = `Laudo_Vistoria_${cleanPlate}_${cleanDate}.pdf`;
  const blob = doc.output('blob');

  return { doc, filename, blob };
}
