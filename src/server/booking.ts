import "server-only";
import { addDays, nightsBetween, parseISODate, propertyToday } from "@/lib/dates";
import type { Dictionary } from "@/i18n";
import { format } from "@/i18n/config";

export type StayValidation =
  | { ok: true; checkIn: Date; checkOut: Date; guests: number; nights: number }
  | { ok: false; field: "checkIn" | "checkOut" | "guests"; message: string };

/** Shared validation for the search step and the final submission. */
export function validateStay(
  input: { checkIn?: string | null; checkOut?: string | null; guests?: number | string | null },
  t: Dictionary,
  limits: { maxNights: number; maxGuests: number },
): StayValidation {
  const checkIn = parseISODate(input.checkIn);
  const checkOut = parseISODate(input.checkOut);
  const guests = Number(input.guests);
  if (!checkIn) return { ok: false, field: "checkIn", message: t.validation.date };
  if (!checkOut) return { ok: false, field: "checkOut", message: t.validation.date };
  const today = propertyToday();
  if (checkIn < today) return { ok: false, field: "checkIn", message: t.validation.pastDate };
  if (checkIn > addDays(today, 540)) return { ok: false, field: "checkIn", message: t.validation.date };
  if (checkOut <= checkIn) return { ok: false, field: "checkOut", message: t.validation.order };
  const nights = nightsBetween(checkIn, checkOut);
  if (nights > limits.maxNights)
    return { ok: false, field: "checkOut", message: format(t.validation.maxNights, { max: limits.maxNights }) };
  if (!Number.isInteger(guests) || guests < 1 || guests > limits.maxGuests)
    return { ok: false, field: "guests", message: format(t.validation.guests, { max: limits.maxGuests }) };
  return { ok: true, checkIn, checkOut, guests, nights };
}
