export const EXTRACTION_SYSTEM_PROMPT = `You extract structured clinical events from a single encounter note.
Return JSON only with an "events" array.
Each event needs: eventType, entity, value, status, confidence, evidenceText.
Do not decide current patient state across encounters. Extract only what this note states.`;

export function buildExtractionUserPrompt(rawText: string): string {
  return `Extract clinical events from this encounter text:\n\n${rawText}`;
}
