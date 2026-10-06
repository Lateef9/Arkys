export type EventType =
  | "SYMPTOM"
  | "DIAGNOSIS"
  | "MEDICATION"
  | "LAB_RESULT"
  | "OBSERVATION"
  | "ALLERGY"
  | "PROCEDURE";

export type EventStatus = "ACTIVE" | "INACTIVE" | "RESOLVED" | "UNKNOWN";

export type EncounterType =
  | "CONSULTATION"
  | "LAB_REPORT"
  | "FOLLOW_UP"
  | "OTHER";

export type PatientRow = {
  id: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
};

export type EncounterRow = {
  id: string;
  patient_id: string;
  type: string;
  occurred_at: string;
  language: string | null;
  source: string;
  raw_text: string;
  created_at: string;
  updated_at: string;
};

export type Patient = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  gender: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Encounter = {
  id: string;
  patientId: string;
  type: string;
  occurredAt: string;
  language: string | null;
  source: string;
  rawText: string;
  createdAt: string;
  updatedAt: string;
};

export function mapPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    name: row.name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEncounter(row: EncounterRow): Encounter {
  return {
    id: row.id,
    patientId: row.patient_id,
    type: row.type,
    occurredAt: row.occurred_at,
    language: row.language,
    source: row.source,
    rawText: row.raw_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
