'use client';

import React, { useState } from 'react';
import { ChecklistScreen } from '../../../../../components/inspection/checklist-screen';
import { INITIAL_INSPECTION_MOCK, MOCK_TEMPLATES } from '../../../../../lib/mock-inspection-data';
import { Inspection, InspectionTemplate } from '../../../../../lib/inspection-types';

interface ChecklistPageProps {
  params?: {
    inspectionId?: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function ChecklistPage({ params }: ChecklistPageProps) {
  const inspectionId = params?.inspectionId || 'insp_78942';

  // Template completo padrão ou baseado no mock
  const [currentTemplate] = useState<InspectionTemplate>(() => {
    return MOCK_TEMPLATES.find((t) => t.id === 'tpl-completa') || MOCK_TEMPLATES[0];
  });

  const [currentInspection] = useState<Inspection>(() => {
    return {
      ...INITIAL_INSPECTION_MOCK,
      id: inspectionId,
    };
  });

  const handleChangeTemplate = () => {
    window.location.href = `/app/inspections/${inspectionId}/template`;
  };

  const handleBackToLanding = () => {
    window.location.href = '/';
  };

  const handleFinishInspection = (finalInspection: Inspection) => {
    console.log('[SURVEY] Vistoria concluída com sucesso:', finalInspection);
  };

  return (
    <ChecklistScreen
      inspection={currentInspection}
      steps={currentTemplate.steps}
      onChangeTemplate={handleChangeTemplate}
      onBackToLanding={handleBackToLanding}
      onFinishInspection={handleFinishInspection}
    />
  );
}
