import { supabase } from './supabase';

export type OwnerInspectionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OwnerInspectionListItem {
  inspectionId: string;
  organizationId: string;
  branchId: string;
  vehicleId: string;
  branchName: string;
  branchCode: string;
  plate: string;
  make: string;
  model: string;
  version: string;
  manufactureYear: number | null;
  modelYear: number | null;
  color: string;
  assignedUserId: string | null;
  status: OwnerInspectionStatus;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListOwnerInspectionsOptions {
  limit?: number;
}

const OWNER_INSPECTION_STATUSES: readonly OwnerInspectionStatus[] = [
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

function isOwnerInspectionStatus(value: unknown): value is OwnerInspectionStatus {
  return typeof value === 'string' && OWNER_INSPECTION_STATUSES.includes(value as OwnerInspectionStatus);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function firstRelation(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return asRecord(value[0]);
  return asRecord(value);
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || !value) {
    throw new Error(`Campo obrigatório ausente na leitura de inspeções: ${key}`);
  }
  return value;
}

function nullableString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value ? value : null;
}

function nullableNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === 'number' ? value : null;
}

function normalizeOwnerInspectionRow(value: unknown): OwnerInspectionListItem {
  const row = asRecord(value);
  const snapshot = firstRelation(row.inspection_vehicle_snapshots);
  const branch = firstRelation(row.branches);
  const status = row.status;

  if (!isOwnerInspectionStatus(status)) {
    throw new Error('Status inesperado na leitura de inspeções.');
  }

  return {
    inspectionId: requiredString(row, 'id'),
    organizationId: requiredString(row, 'organization_id'),
    branchId: requiredString(row, 'branch_id'),
    vehicleId: requiredString(row, 'vehicle_id'),
    branchName: typeof branch.name === 'string' ? branch.name : '—',
    branchCode: typeof branch.code === 'string' ? branch.code : '—',
    plate: requiredString(snapshot, 'plate_number'),
    make: requiredString(snapshot, 'make'),
    model: requiredString(snapshot, 'model'),
    version: requiredString(snapshot, 'version'),
    manufactureYear: nullableNumber(snapshot, 'manufacture_year'),
    modelYear: nullableNumber(snapshot, 'model_year'),
    color: requiredString(snapshot, 'color'),
    assignedUserId: nullableString(row, 'assigned_user_id'),
    status,
    startedAt: nullableString(row, 'started_at'),
    completedAt: nullableString(row, 'completed_at'),
    cancelledAt: nullableString(row, 'cancelled_at'),
    createdAt: requiredString(row, 'created_at'),
    updatedAt: requiredString(row, 'updated_at'),
  };
}

export async function listOwnerInspections(
  options: ListOwnerInspectionsOptions = {},
): Promise<OwnerInspectionListItem[]> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 25);
  const { data, error } = await supabase
    .from('inspections')
    .select(`
      id,
      organization_id,
      branch_id,
      vehicle_id,
      assigned_user_id,
      status,
      started_at,
      completed_at,
      cancelled_at,
      created_at,
      updated_at,
      inspection_vehicle_snapshots!inner(
        plate_number,
        make,
        model,
        version,
        manufacture_year,
        model_year,
        color
      ),
      branches!inner(
        id,
        name,
        code
      )
    `)
    .order('updated_at', { ascending: false })
    .order('id', { ascending: false })
    .range(0, limit - 1);

  if (error) throw error;

  return ((data ?? []) as unknown[]).map(normalizeOwnerInspectionRow);
}

export type InspectionResponseType =
  | 'BOOLEAN'
  | 'TEXT'
  | 'NUMBER'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE';

export type InspectionResponseMutation =
  | { type: 'BOOLEAN'; value: boolean }
  | { type: 'TEXT'; value: string }
  | { type: 'NUMBER'; value: number }
  | { type: 'SINGLE_CHOICE'; selectedOptionIds: [string] }
  | { type: 'MULTIPLE_CHOICE'; selectedOptionIds: string[] };

export async function listAvailableInspectionTemplateVersions(
  inspectionId: string,
) {
  const { data, error } = await supabase.rpc(
    'list_available_inspection_template_versions',
    {
      target_inspection_id: inspectionId,
    },
  );

  if (error) throw error;
  return data;
}

export async function setInspectionTemplate(
  inspectionId: string,
  templateVersionId: string,
) {
  const { data, error } = await supabase.rpc('set_inspection_template', {
    target_inspection_id: inspectionId,
    target_template_version_id: templateVersionId,
  });

  if (error) throw error;
  return data;
}

export async function startInspection(inspectionId: string) {
  const { data, error } = await supabase.rpc('start_inspection', {
    target_inspection_id: inspectionId,
  });

  if (error) throw error;
  return data;
}

export async function completeInspection(inspectionId: string) {
  const { data, error } = await supabase.rpc('complete_inspection', {
    target_inspection_id: inspectionId,
  });

  if (error) throw error;
  return data;
}

export async function recordInspectionResponse(
  checklistItemId: string,
  mutation: InspectionResponseMutation,
) {
  const { data, error } = await supabase.rpc('record_inspection_response', {
    target_checklist_item_id: checklistItemId,
    target_boolean_value:
      mutation.type === 'BOOLEAN' ? mutation.value : null,
    target_text_value:
      mutation.type === 'TEXT' ? mutation.value : null,
    target_number_value:
      mutation.type === 'NUMBER' ? mutation.value : null,
    target_selected_option_ids:
      mutation.type === 'SINGLE_CHOICE' || mutation.type === 'MULTIPLE_CHOICE'
        ? mutation.selectedOptionIds
        : null,
  });

  if (error) throw error;
  return data;
}

export async function clearInspectionResponse(checklistItemId: string) {
  const { error } = await supabase.rpc('clear_inspection_response', {
    target_checklist_item_id: checklistItemId,
  });

  if (error) throw error;
}

export async function listAvailableInspectionAssignees(inspectionId: string) {
  const { data, error } = await supabase.rpc(
    'list_available_inspection_assignees',
    {
      target_inspection_id: inspectionId,
    },
  );

  if (error) throw error;
  return data;
}
