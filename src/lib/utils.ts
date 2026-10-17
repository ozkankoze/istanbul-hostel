import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Uppercase alphanumerics without ambiguous characters (0/O, 1/I/L). */
const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateReference(prefix: string, length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `${prefix}-${out}`;
}

export function formatMoney(value: number | string, currency = "EUR", locale = "en") {
  const n = typeof value === "string" ? Number(value) : value;
  // Bosnian number data is incomplete in some browsers; Croatian uses the same conventions.
  const tag = locale === "tr" ? "tr-TR" : locale === "bs" ? "hr-HR" : "en-GB";
  return new Intl.NumberFormat(tag, {
    style: "currency",
    currency,
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

export function intlLocale(locale: string) {
  return locale === "tr" ? "tr-TR" : locale === "bs" ? "bs-BA" : "en-GB";
}

const DAYS: Record<string, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  tr: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
  bs: ["ned", "pon", "uto", "sri", "čet", "pet", "sub"],
};
const MONTHS: Record<string, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  enLong: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  trLong: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  bs: ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
  bsLong: ["januar", "februar", "mart", "april", "maj", "juni", "juli", "august", "septembar", "oktobar", "novembar", "decembar"],
};

/**
 * Deterministic date formatting. Browser and Node ICU data differ slightly
 * (and Bosnian is incomplete in some browsers), which would cause hydration
 * mismatches, so we build the strings ourselves.
 */
export function formatDateParts(
  date: Date | string,
  locale: string,
  opts: Intl.DateTimeFormatOptions,
  timeZone = "UTC",
) {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const loc = locale === "tr" || locale === "bs" ? locale : "en";
  const day = Number(get("day"));
  const month = Number(get("month")) - 1;
  const year = get("year");
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const time = `${get("hour")}:${get("minute")}`;
  const longMonth = opts.month === "long";
  const monthName = (MONTHS[longMonth ? `${loc}Long` : loc] ?? MONTHS.en!)[month]!;
  const weekday = opts.weekday ? DAYS[loc]![wd] : null;
  const withYear = opts.year !== undefined;
  const withMonth = opts.month !== undefined;

  let out: string;
  if (loc === "bs") {
    out = withMonth && longMonth ? `${day}. ${monthName}` : `${day}. ${month + 1}.`;
    if (withYear) out += ` ${year}.`;
  } else if (loc === "tr") {
    out = withMonth ? `${day} ${monthName}` : `${day}`;
    if (withYear) out += ` ${year}`;
  } else {
    out = withMonth ? `${day} ${monthName}` : `${day}`;
    if (withYear) out += ` ${year}`;
  }
  if (weekday) out = `${weekday}, ${out}`;
  if (opts.hour) out += `, ${time}`;
  return out;
}

export function formatDate(date: Date | string, locale = "en", opts?: Intl.DateTimeFormatOptions) {
  return formatDateParts(date, locale, { day: "numeric", month: "short", year: "numeric", ...opts });
}

export function formatDateTime(date: Date | string, locale = "en") {
  return formatDateParts(
    date,
    locale,
    { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
    "Europe/Istanbul",
  );
}

export function timeAgo(date: Date) {
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} d ago`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
