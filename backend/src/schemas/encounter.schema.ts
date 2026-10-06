import { z } from "zod";

export const encounterTypeSchema = z.enum([
  "CONSULTATION",
  "LAB_REPORT",
  "FOLLOW_UP",
  "OTHER",
]);

export const createEncounterSchema = z.object({
  type: encounterTypeSchema,
  occurredAt: z.string().datetime({ offset: true }).or(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "occurredAt must be ISO date or datetime"),
  ),
  language: z.string().trim().min(1).nullable().optional(),
  source: z.string().trim().min(1).optional().default("api"),
  rawText: z.string().trim().min(1, "rawText is required"),
});

export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
