import { z } from "zod";

export const createPatientSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateOfBirth must be YYYY-MM-DD")
    .nullable()
    .optional(),
  gender: z.string().trim().min(1).nullable().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const patientIdParamSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});
