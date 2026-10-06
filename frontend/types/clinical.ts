export type EventType =
  | "SYMPTOM"
  | "DIAGNOSIS"
  | "MEDICATION"
  | "LAB_RESULT"
  | "OBSERVATION"
  | "ALLERGY"
  | "PROCEDURE";

export type EventStatus = "ACTIVE" | "INACTIVE" | "RESOLVED" | "UNKNOWN";
