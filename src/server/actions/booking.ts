"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { generateReference } from "@/lib/utils";
import { toISODate } from "@/lib/dates";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { searchAvailability } from "@/server/availability";
import { validateStay } from "@/server/booking";
import { getProperty, getSetting } from "@/server/queries";
import type { ActionResult } from "./types";

const schema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int(),
  roomTypeId: z.string().min(1),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  phone: z.string().trim().min(6).max(40).regex(/^[+\d][\d\s()-]{5,}$/),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  arrivalTime: z.string().trim().max(20).optional().or(z.literal("")),
  specialRequests: z.string().trim().max(1500).optional().or(z.literal("")),
  acceptTerms: z.literal(true),
  femaleConfirm: z.boolean().optional(),
  website: z.string().max(0).optional(), // honeypot
});

export type ReservationReceipt = {
  reference: string;
  firstName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  total: number;
};

export async function createReservationRequest(
  localeIn: string,
  input: unknown,
): Promise<ActionResult<ReservationReceipt>> {
  const locale: Locale = isLocale(localeIn) ? localeIn : "en";
  const t = getDictionary(locale);
  if (!(await rateLimit("reservation", 5))) return { ok: false, error: t.validation.tooMany };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0]);
      if (fieldErrors[k]) continue;
      fieldErrors[k] =
        k === "email" ? t.validation.email : k === "phone" ? t.validation.phone : k === "acceptTerms" ? t.validation.terms : t.validation.required;
    }
    return { ok: false, error: t.validation.generic, fieldErrors };
  }
  const d = parsed.data;

  const [maxNights, maxGuests] = await Promise.all([
    getSetting<number>("booking.maxNights", 30),
    getSetting<number>("booking.maxGuests", 8),
  ]);
  const stay = validateStay(d, t, { maxNights, maxGuests });
  if (!stay.ok) return { ok: false, error: stay.message, fieldErrors: { [stay.field]: stay.message } };

  const roomType = await db.roomType.findFirst({ where: { id: d.roomTypeId, isActive: true } });
  if (!roomType) return { ok: false, error: t.validation.unavailable };
  if (roomType.genderPolicy === "FEMALE" && !d.femaleConfirm)
    return { ok: false, error: t.validation.female, fieldErrors: { femaleConfirm: t.validation.female } };

  // Re-check availability at submission time with the server's own price.
  const options = await searchAvailability(stay);
  const option = options.find((o) => o.roomTypeId === roomType.id);
  if (!option || !option.fits) return { ok: false, error: t.validation.unavailable };

  const property = await getProperty();
  const email = d.email.toLowerCase();
  const existing = await db.guest.findFirst({
    where: { email, lastName: { equals: d.lastName, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });
  const guest = existing
    ? await db.guest.update({
        where: { id: existing.id },
        data: { firstName: d.firstName, phone: d.phone, country: d.country || existing.country },
      })
    : await db.guest.create({
        data: { firstName: d.firstName, lastName: d.lastName, email, phone: d.phone, country: d.country || null },
      });

  const notes = [
    d.arrivalTime ? `Arrival: ${d.arrivalTime}` : null,
    d.specialRequests || null,
  ]
    .filter(Boolean)
    .join("\n");

  let reference = generateReference("IH");
  for (let attempt = 0; attempt < 3; attempt++) {
    const clash = await db.reservation.findUnique({ where: { reference } });
    if (!clash) break;
    reference = generateReference("IH");
  }

  await db.reservation.create({
    data: {
      reference,
      propertyId: property.id,
      roomTypeId: roomType.id,
      guestId: guest.id,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      guests: stay.guests,
      units: option.unitsNeeded,
      nightlyPrice: option.nightlyPrice,
      totalPrice: option.total,
      status: "PENDING",
      specialRequests: notes || null,
      source: "WEBSITE",
      locale,
    },
  });

  return {
    ok: true,
    data: {
      reference,
      firstName: guest.firstName,
      email,
      checkIn: toISODate(stay.checkIn),
      checkOut: toISODate(stay.checkOut),
      total: option.total,
    },
  };
}
