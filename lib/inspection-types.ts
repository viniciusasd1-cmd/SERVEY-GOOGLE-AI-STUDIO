/**
 * SURVEY - Sistema Multiempresa de Vistoria de Veículos
 * Tipos TypeScript para Vistorias, Templates e Respostas
 */

export type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ChecklistStepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type ResponseType = 
  | 'BOOLEAN' 
  | 'TEXT' 
  | 'NUMBER' 
  | 'SINGLE_CHOICE' 
  | 'MULTIPLE_CHOICE';

export interface MockPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  timestamp: string;
  isPlaceholder?: boolean;
}

export interface ChecklistStep {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  requiresPhoto: boolean;
  responseType: ResponseType;
  options?: string[];
  placeholder?: string;
  unit?: string;
  category?: string;
}

export interface ChecklistResponse {
  stepId: string;
  value: boolean | string | number | string[] | null;
  notes: string;
  photos: MockPhoto[];
  completedAt?: string;
}

export interface InspectionTemplate {
  id: string;
  name: string;
  description: string;
  stepsCount: number;
  estimatedMinutes: number;
  category: string;
  iconName?: string;
  steps: ChecklistStep[];
}

export interface VehicleInfo {
  plate: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  chassis?: string;
  mileage?: number;
  customerName?: string;
  companyName: string;
}

export interface Inspection {
  id: string;
  vehicle: VehicleInfo;
  templateId: string;
  templateName: string;
  status: InspectionStatus;
  startedAt: string;
  completedAt?: string;
  operatorName: string;
  responses: Record<string, ChecklistResponse>;
  stepStatuses: Record<string, ChecklistStepStatus>;
}
