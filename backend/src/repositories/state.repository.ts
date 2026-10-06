import { getSupabase } from "../db/supabase.js";
import type { DerivedPatientState } from "../services/patient-state.service.js";

export type PatientStateRow = {
  id: string;
  patientId: string;
  entityType: string;
  entity: string;
  currentValue: Record<string, unknown>;
  status: string;
  sourceEventId: string | null;
  validFrom: string;
  validUntil: string | null;
  confidence: number | null;
  updatedAt: string;
};

function mapRow(row: Record<string, unknown>): PatientStateRow {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    entityType: row.entity_type as string,
    entity: row.entity as string,
    currentValue: (row.current_value as Record<string, unknown>) ?? {},
    status: row.status as string,
    sourceEventId: (row.source_event_id as string | null) ?? null,
    validFrom: row.valid_from as string,
    validUntil: (row.valid_until as string | null) ?? null,
    confidence: (row.confidence as number | null) ?? null,
    updatedAt: row.updated_at as string,
  };
}

export const stateRepository = {
  async replaceForPatient(
    patientId: string,
    states: DerivedPatientState[],
  ): Promise<PatientStateRow[]> {
    const { error: deleteError } = await getSupabase()
      .from("patient_state")
      .delete()
      .eq("patient_id", patientId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (states.length === 0) {
      return [];
    }

    const { data, error } = await getSupabase()
      .from("patient_state")
      .insert(
        states.map((s) => ({
          patient_id: s.patientId,
          entity_type: s.entityType,
          entity: s.entity,
          current_value: s.currentValue,
          status: s.status,
          source_event_id: s.sourceEventId,
          valid_from: s.validFrom,
          valid_until: s.validUntil,
          confidence: s.confidence,
          updated_at: new Date().toISOString(),
        })),
      )
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
  },

  async listByPatientId(patientId: string): Promise<PatientStateRow[]> {
    const { data, error } = await getSupabase()
      .from("patient_state")
      .select("*")
      .eq("patient_id", patientId)
      .order("entity", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
  },
};
