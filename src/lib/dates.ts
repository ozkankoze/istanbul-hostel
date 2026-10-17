/**
 * Stay dates are calendar dates (no time). We represent them as UTC-midnight Date
 * objects, which map 1:1 to Postgres DATE columns.
 */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseISODate(value: string | null | undefined): Date | null {
  if (!value || !ISO_DATE.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

export function nightsBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Today's calendar date at the property (Istanbul), as UTC midnight. */
export function propertyToday(timeZone = "Europe/Istanbul") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${parts}T00:00:00.000Z`);
}
