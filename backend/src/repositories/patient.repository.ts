import { getSupabase } from "../db/supabase.js";
import { mapPatient, type Patient, type PatientRow } from "../types/clinical.js";

export const patientRepository = {
  async create(input: {
    name: string;
    dateOfBirth?: string | null;
    gender?: string | null;
  }): Promise<Patient> {
    const { data, error } = await getSupabase()
      .from("patients")
      .insert({
        name: input.name,
        date_of_birth: input.dateOfBirth ?? null,
        gender: input.gender ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to create patient");
    }

    return mapPatient(data as PatientRow);
  },

  async list(): Promise<Patient[]> {
    const { data, error } = await getSupabase()
      .from("patients")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as PatientRow[]).map(mapPatient);
  },

  async findById(id: string): Promise<Patient | null> {
    const { data, error } = await getSupabase()
      .from("patients")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapPatient(data as PatientRow) : null;
  },
};
