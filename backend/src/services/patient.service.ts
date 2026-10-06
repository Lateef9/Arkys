import { AppError } from "../middleware/error.middleware.js";
import { patientRepository } from "../repositories/patient.repository.js";
import type { CreatePatientInput } from "../schemas/patient.schema.js";

export const patientService = {
  create(input: CreatePatientInput) {
    return patientRepository.create({
      name: input.name,
      dateOfBirth: input.dateOfBirth ?? null,
      gender: input.gender ?? null,
    });
  },

  list() {
    return patientRepository.list();
  },

  async getById(id: string) {
    const patient = await patientRepository.findById(id);
    if (!patient) {
      throw new AppError("PATIENT_NOT_FOUND", "Patient not found", 404);
    }
    return patient;
  },
};
