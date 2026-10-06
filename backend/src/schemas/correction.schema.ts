import { z } from "zod";

/**
 * Clinician correction body.
 * Does NOT delete or overwrite the original clinical_events row.
 * Edits are stored in clinician_edits and applied when deriving state.
 *
 * Supported fields:
 * - status
 * - entity
 * - dose          (writes value.dose)
 * - value         (replaces whole value object)
 * - value.<key>   (e.g. value.note)
 */
export const createCorrectionSchema = z.object({
  field: z
    .string()
    .trim()
    .min(1)
    .regex(
      /^(status|entity|dose|value(\.[A-Za-z0-9_]+)?)$/,
      "field must be status, entity, dose, value, or value.<key>",
    ),
  newValue: z.unknown(),
  reason: z.string().trim().min(1).optional(),
});

export type CreateCorrectionInput = z.infer<typeof createCorrectionSchema>;

export const eventIdParamSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});
