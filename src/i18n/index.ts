import "server-only";
import en, { type Dictionary, type PluralForms } from "./dictionaries/en";
import sr from "./dictionaries/sr";
import type { Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { en, sr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export { plural, pluralCategory } from "./plural";
export { format } from "./config";
export type { Dictionary, PluralForms };
