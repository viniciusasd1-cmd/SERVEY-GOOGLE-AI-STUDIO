import { supabase } from './supabase';

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
