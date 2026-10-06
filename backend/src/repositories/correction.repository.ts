import { getSupabase } from "../db/supabase.js";

export type ClinicianEditRow = {
  id: string;
  eventId: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string | null;
  createdAt: string;
};

function mapRow(row: Record<string, unknown>): ClinicianEditRow {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    field: row.field as string,
    oldValue: row.old_value,
    newValue: row.new_value,
    reason: (row.reason as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export const correctionRepository = {
  async create(input: {
    eventId: string;
    field: string;
    oldValue: unknown;
    newValue: unknown;
    reason?: string | null;
  }): Promise<ClinicianEditRow> {
    const { data, error } = await getSupabase()
      .from("clinician_edits")
      .insert({
        event_id: input.eventId,
        field: input.field,
        old_value: input.oldValue ?? null,
        new_value: input.newValue ?? null,
        reason: input.reason ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create clinician edit");
    }

    return mapRow(data as Record<string, unknown>);
  },

  async listByPatientId(patientId: string): Promise<ClinicianEditRow[]> {
    const { data: events, error: eventsError } = await getSupabase()
      .from("clinical_events")
      .select("id")
      .eq("patient_id", patientId);

    if (eventsError) {
      throw new Error(eventsError.message);
    }

    const eventIds = ((events ?? []) as Array<{ id: string }>).map((e) => e.id);
    if (eventIds.length === 0) {
      return [];
    }

    const { data, error } = await getSupabase()
      .from("clinician_edits")
      .select("*")
      .in("event_id", eventIds)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
  },

  async listByEventId(eventId: string): Promise<ClinicianEditRow[]> {
    const { data, error } = await getSupabase()
      .from("clinician_edits")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
  },
};
