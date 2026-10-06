import { getSupabase } from "../db/supabase.js";
import type { DerivedConflict } from "../services/conflict-engine.service.js";

export type ConflictRow = {
  id: string;
  patientId: string;
  entity: string;
  existingEventId: string;
  newEventId: string;
  conflictType: string;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): ConflictRow {
  return {
    id: row.id as string,
    patientId: row.patient_id as string,
    entity: row.entity as string,
    existingEventId: row.existing_event_id as string,
    newEventId: row.new_event_id as string,
    conflictType: row.conflict_type as string,
    resolution: (row.resolution as string | null) ?? null,
    resolvedBy: (row.resolved_by as string | null) ?? null,
    resolvedAt: (row.resolved_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export const conflictRepository = {
  async replaceForPatient(
    patientId: string,
    conflicts: DerivedConflict[],
  ): Promise<ConflictRow[]> {
    const { error: deleteError } = await getSupabase()
      .from("conflicts")
      .delete()
      .eq("patient_id", patientId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (conflicts.length === 0) {
      return [];
    }

    const { data, error } = await getSupabase()
      .from("conflicts")
      .insert(
        conflicts.map((c) => ({
          patient_id: c.patientId,
          entity: c.entity,
          existing_event_id: c.existingEventId,
          new_event_id: c.newEventId,
          conflict_type: c.conflictType,
          resolution: c.resolution,
        })),
      )
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
  },

  async listByPatientId(patientId: string): Promise<ConflictRow[]> {
    const { data, error } = await getSupabase()
      .from("conflicts")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
  },
};
