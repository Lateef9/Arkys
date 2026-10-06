import {
  extractionOutputSchema,
  type ExtractionOutput,
} from "../schemas/extraction.schema.js";
import { completeExtractionJson } from "./client.js";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "./prompts.js";

export async function extractFromText(rawText: string): Promise<ExtractionOutput> {
  const raw = await completeExtractionJson(
    [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: buildExtractionUserPrompt(rawText) },
    ],
    rawText,
  );

  return extractionOutputSchema.parse(raw);
}
