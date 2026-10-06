import { getSupabase } from "../db/supabase.js";

export type ClinicalEventInsert = {
  patientId: string;
  encounterId: string;
  eventType: string;
  entity: string;
  value: Record<string, unknown>;
  status: string;
  confidence: number | null;
  occurredAt: string;
  evidenceText: string;
  evidenceSourceId: string;
};

export type ClinicalEventRecord = {
  id: string;
  patientId: string;
  encounterId: string;
  eventType: string;
  entity: string;
  value: Record<string, unknown>;
  status: string;
  confidence: number | null;
  occurredAt: string;
  evidence: {
    id: string;
    sourceText: string;
  };
};

export const eventRepository = {
  async deleteByEncounterId(encounterId: string): Promise<void> {
    const { error } = await getSupabase()
      .from("clinical_events")
      .delete()
      .eq("encounter_id", encounterId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async createWithEvidence(
    input: ClinicalEventInsert,
  ): Promise<ClinicalEventRecord> {
    const { data: event, error: eventError } = await getSupabase()
      .from("clinical_events")
      .insert({
        patient_id: input.patientId,
        encounter_id: input.encounterId,
        event_type: input.eventType,
        entity: input.entity,
        value: input.value,
        status: input.status,
        confidence: input.confidence,
        occurred_at: input.occurredAt,
      })
      .select("*")
      .single();

    if (eventError || !event) {
      throw new Error(eventError?.message ?? "Failed to insert clinical event");
    }

    const { data: evidence, error: evidenceError } = await getSupabase()
      .from("event_evidence")
      .insert({
        event_id: event.id,
        source_type: "encounter",
        source_id: input.evidenceSourceId,
        source_text: input.evidenceText,
      })
      .select("*")
      .single();

    if (evidenceError || !evidence) {
      throw new Error(evidenceError?.message ?? "Failed to insert evidence");
    }

    return {
      id: event.id as string,
      patientId: event.patient_id as string,
      encounterId: event.encounter_id as string,
      eventType: event.event_type as string,
      entity: event.entity as string,
      value: event.value as Record<string, unknown>,
      status: event.status as string,
      confidence: (event.confidence as number | null) ?? null,
      occurredAt: event.occurred_at as string,
      evidence: {
        id: evidence.id as string,
        sourceText: evidence.source_text as string,
      },
    };
  },

  async countPatientState(patientId: string): Promise<number> {
    const { count, error } = await getSupabase()
      .from("patient_state")
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patientId);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  },
};
