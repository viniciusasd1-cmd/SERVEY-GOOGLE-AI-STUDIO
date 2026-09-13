import { supabase } from './supabase';

export type OwnerInspectionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OwnerInspectionListItem {
  inspectionId: string;
  organizationId: string;
  branchId: string;
  vehicleId: string;
  branchName: string;
  branchCode: string;
  plate: string | null;
  make: string | null;
  model: string | null;
  version: string | null;
  manufactureYear: number | null;
  modelYear: number | null;
  color: string | null;
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

export interface OwnerInspectionBranchOption {
  id: string;
  name: string;
  code: string;
}

export interface OwnerInspectionVehicleOption {
  id: string;
  organizationId: string | null;
  make: string | null;
  model: string | null;
  version: string | null;
  modelYear: number | null;
  color: string | null;
  currentPlate: string | null;
  hasAmbiguousCurrentPlate: boolean;
}

export type OwnerVehiclePlateType =
  | 'BRAZIL_MERCOSUL'
  | 'BRAZIL_OLD'
  | 'FOREIGN'
  | 'OTHER';

export interface CreateOwnerVehicleResult {
  vehicleId: string;
  plateNumber: string;
  plateType: OwnerVehiclePlateType;
}

export interface CreateOwnerInspectionResult {
  inspectionId: string;
  status: 'DRAFT';
  assignedUserId: string | null;
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

function firstRelation(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    if (value.length > 1) {
      throw new Error('Relação histórica ambígua na leitura de inspeções.');
    }
    return value.length === 1 ? asRecord(value[0]) : null;
  }

  return value && typeof value === 'object' ? asRecord(value) : null;
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || !value) {
    throw new Error(`Campo obrigatório ausente na leitura de inspeções: ${key}`);
  }
  return value;
}

function nullableString(record: Record<string, unknown> | null, key: string): string | null {
  if (!record) return null;
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
  const branch = firstRelation(row.branches) ?? {};
  const status = row.status;

  if (!isOwnerInspectionStatus(status)) {
    throw new Error('Status inesperado na leitura de inspeções.');
  }

  if ((status === 'IN_PROGRESS' || status === 'COMPLETED') && !snapshot) {
    throw new Error('Snapshot histórico ausente para inspeção iniciada.');
  }

  return {
    inspectionId: requiredString(row, 'id'),
    organizationId: requiredString(row, 'organization_id'),
    branchId: requiredString(row, 'branch_id'),
    vehicleId: requiredString(row, 'vehicle_id'),
    branchName: typeof branch.name === 'string' ? branch.name : '—',
    branchCode: typeof branch.code === 'string' ? branch.code : '—',
    plate: nullableString(snapshot, 'plate_number'),
    make: nullableString(snapshot, 'make'),
    model: nullableString(snapshot, 'model'),
    version: nullableString(snapshot, 'version'),
    manufactureYear: nullableNumber(snapshot, 'manufacture_year'),
    modelYear: nullableNumber(snapshot, 'model_year'),
    color: nullableString(snapshot, 'color'),
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
      inspection_vehicle_snapshots(
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

export async function listAvailableOwnerBranches(targetBranchId?: string): Promise<OwnerInspectionBranchOption[]> {
  let query = supabase
    .from('branches')
    .select('id, name, code, status')
    .eq('status', 'ACTIVE');

  if (targetBranchId) {
    query = query.eq('id', targetBranchId);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown[]).map((value) => {
    const row = asRecord(value);
    if (row.status !== 'ACTIVE') {
      throw new Error('Unidade não está ativa.');
    }

    return {
      id: requiredString(row, 'id'),
      name: requiredString(row, 'name'),
      code: nullableString(row, 'code') ?? '—',
    };
  });
}

export function normalizeOwnerVehiclePlate(value: string): string {
  return value.toUpperCase().replace(/[\s-]/g, '');
}

export function isSupportedOwnerVehiclePlate(value: string): boolean {
  return /^[A-Z]{3}[0-9]{4}$/.test(value) || /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(value);
}

export type OwnerVehicleLookupResult =
  | { status: 'FOUND'; vehicle: OwnerInspectionVehicleOption }
  | { status: 'NOT_FOUND' }
  | { status: 'AMBIGUOUS' };

export async function findOwnerVehicleByPlate(plate: string): Promise<OwnerVehicleLookupResult> {
  const normalizedPlate = normalizeOwnerVehiclePlate(plate);
  if (!isSupportedOwnerVehiclePlate(normalizedPlate)) return { status: 'NOT_FOUND' };

  const { data: plateData, error: plateError } = await supabase
    .from('vehicle_plates')
    .select('vehicle_id, organization_id, plate_number, plate_type, status')
    .eq('plate_number', normalizedPlate)
    .eq('status', 'CURRENT')
    .limit(2);

  if (plateError) throw plateError;

  const plateRows = (plateData ?? []) as unknown[];
  if (plateRows.length === 0) return { status: 'NOT_FOUND' };
  if (plateRows.length > 1) return { status: 'AMBIGUOUS' };

  const plateRow = asRecord(plateRows[0]);
  if (plateRow.status !== 'CURRENT') return { status: 'NOT_FOUND' };

  const vehicleId = requiredString(plateRow, 'vehicle_id');
  const organizationId = requiredString(plateRow, 'organization_id');
  const { data: vehicleData, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, make, model, version, model_year, color, status')
    .eq('id', vehicleId)
    .eq('status', 'ACTIVE')
    .limit(2);

  if (vehicleError) throw vehicleError;

  const vehicleRows = (vehicleData ?? []) as unknown[];
  if (vehicleRows.length === 0) return { status: 'NOT_FOUND' };
  if (vehicleRows.length > 1) return { status: 'AMBIGUOUS' };

  const vehicleRow = asRecord(vehicleRows[0]);
  if (vehicleRow.status !== 'ACTIVE') return { status: 'NOT_FOUND' };

  return {
    status: 'FOUND',
    vehicle: {
      id: requiredString(vehicleRow, 'id'),
      organizationId,
      make: nullableString(vehicleRow, 'make'),
      model: nullableString(vehicleRow, 'model'),
      version: nullableString(vehicleRow, 'version'),
      modelYear: nullableNumber(vehicleRow, 'model_year'),
      color: nullableString(vehicleRow, 'color'),
      currentPlate: normalizedPlate,
      hasAmbiguousCurrentPlate: false,
    },
  };
}

function isOwnerVehiclePlateType(value: unknown): value is OwnerVehiclePlateType {
  return value === 'BRAZIL_MERCOSUL'
    || value === 'BRAZIL_OLD'
    || value === 'FOREIGN'
    || value === 'OTHER';
}

function toCreateVehicleError(error: unknown): Error {
  switch (getSupabaseErrorCode(error)) {
    case '23505':
      return new Error('Esta placa já está cadastrada.');
    default:
      return new Error('Não foi possível cadastrar o veículo.');
  }
}

export async function createOwnerVehicleWithPlate({
  make,
  model,
  plateNumber,
  plateType,
}: {
  make: string;
  model: string;
  plateNumber: string;
  plateType: OwnerVehiclePlateType;
}): Promise<CreateOwnerVehicleResult> {
  const normalizedPlate = normalizeOwnerVehiclePlate(plateNumber);
  if (!make.trim() || !model.trim() || !normalizedPlate || !isOwnerVehiclePlateType(plateType)) {
    throw new Error('Informe a placa, a marca, o modelo e o tipo da placa.');
  }

  const { data, error } = await supabase.rpc('create_vehicle_with_plate', {
    new_make: make.trim(),
    new_model: model.trim(),
    new_plate_number: normalizedPlate,
    new_plate_type: plateType,
    new_version: null,
    new_manufacture_year: null,
    new_model_year: null,
    new_color: null,
    new_vin_chassis: null,
  });

  if (error) throw toCreateVehicleError(error);

  const result = firstRelation(data);
  if (
    !result
    || typeof result.vehicle_id !== 'string'
    || !result.vehicle_id
    || typeof result.plate_number !== 'string'
    || !result.plate_number
  ) {
    throw new Error('Não foi possível confirmar o cadastro do veículo.');
  }

  const returnedPlate = normalizeOwnerVehiclePlate(result.plate_number);
  if (returnedPlate !== normalizedPlate) {
    throw new Error('Não foi possível confirmar o cadastro do veículo.');
  }

  return {
    vehicleId: result.vehicle_id,
    plateNumber: returnedPlate,
    plateType,
  };
}

function getSupabaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

function toCreateInspectionError(error: unknown): Error {
  switch (getSupabaseErrorCode(error)) {
    case '23505':
      return new Error('Este veículo já possui uma vistoria aberta.');
    case '42501':
      return new Error('Você não tem permissão para criar uma vistoria nesta unidade.');
    case '23514':
      return new Error('Não foi possível criar a vistoria com os dados selecionados.');
    default:
      return new Error('Não foi possível criar a vistoria.');
  }
}

export async function createOwnerInspection({
  branchId,
  vehicleId,
  assignedUserId = null,
}: {
  branchId: string;
  vehicleId: string;
  assignedUserId?: string | null;
}): Promise<CreateOwnerInspectionResult> {
  const { data, error } = await supabase.rpc('create_inspection', {
    target_branch_id: branchId,
    target_vehicle_id: vehicleId,
    target_assigned_user_id: assignedUserId,
  });

  if (error) throw toCreateInspectionError(error);

  const result = firstRelation(data);
  if (
    !result ||
    typeof result.inspection_id !== 'string' ||
    !result.inspection_id ||
    result.status !== 'DRAFT' ||
    result.assigned_user_id !== assignedUserId
  ) {
    throw new Error('Não foi possível confirmar a criação da vistoria.');
  }

  return {
    inspectionId: result.inspection_id,
    status: 'DRAFT',
    assignedUserId,
  };
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
