import type { PluralForms } from "./dictionaries/en";
import { format, type Locale } from "./config";

/** CLDR-style plural category for our three languages. */
export function pluralCategory(locale: Locale, n: number): keyof PluralForms {
  if (locale === "bs") {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "one";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "few";
    return "other";
  }
  return n === 1 ? "one" : "other";
}

export function plural(locale: Locale, forms: PluralForms, count: number) {
  return format(forms[pluralCategory(locale, count)], { count });
}
