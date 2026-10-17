"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { addDays, parseISODate, propertyToday } from "@/lib/dates";
import { generateReference } from "@/lib/utils";
import { getDictionary } from "@/i18n";
import { format, isLocale, type Locale } from "@/i18n/config";
import { getProperty } from "@/server/queries";
import type { ActionResult } from "./types";

const contact = {
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+\d][\d\s()-]{5,}$/)
    .optional()
    .or(z.literal("")),
};

const bookingSchema = z.object({
  experienceId: z.string().min(1),
  date: z.string(),
  participants: z.coerce.number().int().min(1).max(50),
  ...contact,
  roomNumber: z.string().trim().max(10).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.enum(["WEBSITE", "GUEST_PORTAL"]).default("WEBSITE"),
});

function fieldErrorsFrom(issues: z.core.$ZodIssue[], t: ReturnType<typeof getDictionary>) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0]);
    if (out[k]) continue;
    out[k] = k === "email" ? t.validation.email : k === "phone" ? t.validation.phone : t.validation.required;
  }
  return out;
}

export async function requestExperience(
  localeIn: string,
  input: unknown,
): Promise<ActionResult<{ reference: string; total: number }>> {
  const locale: Locale = isLocale(localeIn) ? localeIn : "en";
  const t = getDictionary(locale);
  if (!(await rateLimit("experience", 6))) return { ok: false, error: t.validation.tooMany };

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t.validation.generic, fieldErrors: fieldErrorsFrom(parsed.error.issues, t) };
  const d = parsed.data;

  const exp = await db.experience.findFirst({ where: { id: d.experienceId, isActive: true } });
  if (!exp) return { ok: false, error: t.validation.generic };

  const date = parseISODate(d.date);
  const today = propertyToday();
  if (!date) return { ok: false, error: t.validation.date, fieldErrors: { date: t.validation.date } };
  if (date < today) return { ok: false, error: t.validation.pastDate, fieldErrors: { date: t.validation.pastDate } };
  if (date > addDays(today, 365)) return { ok: false, error: t.validation.date, fieldErrors: { date: t.validation.date } };
  if (!exp.availableDays.includes(date.getUTCDay()))
    return { ok: false, error: t.validation.dayUnavailable, fieldErrors: { date: t.validation.dayUnavailable } };

  const participantsMsg = format(t.validation.participants, { max: exp.maxParticipants });
  if (d.participants > exp.maxParticipants)
    return { ok: false, error: participantsMsg, fieldErrors: { participants: participantsMsg } };

  // Remaining seats on that date (group-priced items like transfers are per vehicle)
  if (exp.priceUnit === "PERSON") {
    const taken = await db.experienceBooking.aggregate({
      where: { experienceId: exp.id, date, status: { in: ["PENDING", "CONFIRMED"] } },
      _sum: { participants: true },
    });
    const left = exp.maxParticipants - (taken._sum.participants ?? 0);
    if (d.participants > left) {
      const msg = left > 0 ? format(t.validation.participants, { max: left }) : t.validation.dayUnavailable;
      return { ok: false, error: msg, fieldErrors: { participants: msg } };
    }
  }

  const total = exp.priceUnit === "GROUP" ? Number(exp.price) : Number(exp.price) * d.participants;
  const reference = generateReference("EX");
  await db.experienceBooking.create({
    data: {
      reference,
      experienceId: exp.id,
      date,
      participants: d.participants,
      totalPrice: total,
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      roomNumber: d.roomNumber || null,
      notes: d.notes || null,
      source: d.source,
      locale,
    },
  });
  return { ok: true, data: { reference, total } };
}

const transferSchema = z.object({
  airport: z.enum(["IST", "SAW"]),
  flightNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,3}\s?\d{1,5}[A-Z]?$/),
  arrivalDate: z.string(),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  passengers: z.coerce.number().int().min(1).max(8),
  name: contact.name,
  email: contact.email,
  phone: z.string().trim().min(6).max(40).regex(/^[+\d][\d\s()-]{5,}$/),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function requestTransfer(
  localeIn: string,
  input: unknown,
): Promise<ActionResult<{ reference: string }>> {
  const locale: Locale = isLocale(localeIn) ? localeIn : "en";
  const t = getDictionary(locale);
  if (!(await rateLimit("transfer", 5))) return { ok: false, error: t.validation.tooMany };

  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) {
    const fe = fieldErrorsFrom(parsed.error.issues, t);
    return { ok: false, error: t.validation.generic, fieldErrors: fe };
  }
  const d = parsed.data;
  const date = parseISODate(d.arrivalDate);
  if (!date) return { ok: false, error: t.validation.date, fieldErrors: { arrivalDate: t.validation.date } };
  // Arrival time is local Istanbul time (UTC+3, no DST)
  const arrivalAt = new Date(`${d.arrivalDate}T${d.arrivalTime}:00+03:00`);
  if (arrivalAt.getTime() < Date.now() - 3_600_000)
    return { ok: false, error: t.validation.pastDate, fieldErrors: { arrivalDate: t.validation.pastDate } };

  const p = await getProperty();
  const reference = generateReference("TR");
  await db.transferRequest.create({
    data: {
      reference,
      propertyId: p.id,
      airport: d.airport,
      flightNumber: d.flightNumber.replace(/\s/g, ""),
      arrivalAt,
      passengers: d.passengers,
      name: d.name,
      email: d.email,
      phone: d.phone,
      notes: d.notes || null,
      locale,
    },
  });
  return { ok: true, data: { reference } };
}
