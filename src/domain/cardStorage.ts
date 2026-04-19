import type { TriviaCard } from "../types/trivia";

export const CARDS_STORAGE_KEY = "trivia-hub-cards";

export function loadCards(): TriviaCard[] {
  const raw = localStorage.getItem(CARDS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TriviaCard[];
  } catch {
    return [];
  }
}
