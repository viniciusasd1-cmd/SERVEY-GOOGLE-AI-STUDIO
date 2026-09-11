'use client';

import React from 'react';
import { TemplateSelector } from '../../../../../components/inspection/template-selector';

interface PageProps {
  params?: {
    inspectionId?: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function TemplateSelectionPage({ params }: PageProps) {
  const inspectionId = params?.inspectionId || 'insp_78942';

  const handleStartInspection = (templateId: string) => {
    // Redireciona para o checklist da vistoria selecionada
    window.location.href = `/app/inspections/${inspectionId}/checklist?template=${templateId}`;
  };

  const handleBackToLanding = () => {
    window.location.href = '/';
  };

  return (
    <TemplateSelector
      inspectionId={inspectionId}
      currentTemplateId="tpl-completa"
      onStartInspection={handleStartInspection}
      onBackToLanding={handleBackToLanding}
    />
  );
}
