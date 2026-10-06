import { getSupabase } from "../db/supabase.js";
import {
  mapEncounter,
  type Encounter,
  type EncounterRow,
} from "../types/clinical.js";

function toOccurredAt(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T09:00:00.000Z`;
  }
  return value;
}

export const encounterRepository = {
  async findById(id: string): Promise<Encounter | null> {
    const { data, error } = await getSupabase()
      .from("encounters")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapEncounter(data as EncounterRow) : null;
  },

  async create(
    patientId: string,
    input: {
      type: string;
      occurredAt: string;
      language?: string | null;
      source?: string;
      rawText: string;
    },
  ): Promise<Encounter> {
    const { data, error } = await getSupabase()
      .from("encounters")
      .insert({
        patient_id: patientId,
        type: input.type,
        occurred_at: toOccurredAt(input.occurredAt),
        language: input.language ?? null,
        source: input.source ?? "api",
        raw_text: input.rawText,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create encounter");
    }

    return mapEncounter(data as EncounterRow);
  },

  async listByPatientId(patientId: string): Promise<Encounter[]> {
    const { data, error } = await getSupabase()
      .from("encounters")
      .select("*")
      .eq("patient_id", patientId)
      .order("occurred_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as EncounterRow[]).map(mapEncounter);
  },
};
