import type { CardFormState, CardTemplate } from "../types/trivia";
import { CARD_TEMPLATES } from "./cardTemplates";

export function emptyForm(): CardFormState {
  return {
    promptLabel: "",
    promptValue: "",
    answerLabel: "",
    answerValue: "",
    tags: "",
  };
}

export function formFromTemplate(template: CardTemplate): CardFormState {
  return {
    promptLabel: template.promptLabel,
    promptValue: "",
    answerLabel: template.answerLabel,
    answerValue: "",
    tags: template.tags,
  };
}

export function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function fieldPlaceholdersForTemplate(templateId: string): Record<keyof CardFormState, string> {
  const template = CARD_TEMPLATES.find((entry) => entry.id === templateId);
  return {
    promptLabel: template?.promptLabel ?? "Country",
    promptValue: template?.promptPlaceholder ?? "France",
    answerLabel: template?.answerLabel ?? "Capital",
    answerValue: template?.answerPlaceholder ?? "Paris",
    tags: template?.tags ?? "geography,europe",
  };
}
