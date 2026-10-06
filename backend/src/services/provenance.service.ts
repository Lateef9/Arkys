import { AppError } from "../middleware/error.middleware.js";
import { eventRepository } from "../repositories/event.repository.js";

export const provenanceService = {
  async getEvent(eventId: string) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("EVENT_NOT_FOUND", "Event not found", 404);
    }
    return event;
  },

  async getEvidence(eventId: string) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw new AppError("EVENT_NOT_FOUND", "Event not found", 404);
    }

    const evidence = await eventRepository.listEvidenceByEventId(eventId);
    return {
      event,
      evidence,
    };
  },
};
