import { z } from "zod";

export const extractedEventSchema = z.object({
  eventType: z.enum([
    "SYMPTOM",
    "DIAGNOSIS",
    "MEDICATION",
    "LAB_RESULT",
    "OBSERVATION",
    "ALLERGY",
    "PROCEDURE",
  ]),
  entity: z.string().trim().min(1),
  value: z.record(z.unknown()).default({}),
  status: z.enum(["ACTIVE", "INACTIVE", "RESOLVED", "UNKNOWN"]),
  confidence: z.number().min(0).max(1).nullable().optional(),
  evidenceText: z.string().trim().min(1),
});

export const extractionOutputSchema = z.object({
  events: z.array(extractedEventSchema).min(1),
});

export type ExtractedEvent = z.infer<typeof extractedEventSchema>;
export type ExtractionOutput = z.infer<typeof extractionOutputSchema>;

export const encounterIdParamSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});
