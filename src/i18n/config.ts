export const locales = ["en", "bs"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "ih_locale";

export const localeNames: Record<Locale, string> = {
  en: "English",
  bs: "Bosanski",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Localized JSON stored in the database: { en, bs } (older rows may also carry other keys) */
export type LocalizedText = Partial<Record<Locale, string>>;

export function pick(value: unknown, locale: Locale): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const v = value as LocalizedText;
  return v[locale] || v[defaultLocale] || Object.values(v).find(Boolean) || "";
}

/** Replace {name} placeholders. */
export function format(template: string, vars: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
