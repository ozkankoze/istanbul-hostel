"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { addDays, propertyToday } from "@/lib/dates";
import { rateLimit } from "@/lib/rate-limit";
import { hashToken, newToken } from "@/lib/tokens";
import { generateReference } from "@/lib/utils";
import { getDictionary } from "@/i18n";
import { isLocale, type Locale } from "@/i18n/config";
import { GUEST_COOKIE, getGuestSession } from "@/server/guest-session";
import { getProperty } from "@/server/queries";
import type { ActionResult } from "./types";

function dict(l: string) {
  const locale: Locale = isLocale(l) ? l : "en";
  return { locale, t: getDictionary(locale) };
}

const verifySchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => (v.startsWith("IH-") ? v : `IH-${v.replace(/^IH/, "")}`))
    .pipe(z.string().regex(/^IH-[A-Z0-9]{6}$/)),
  lastName: z.string().trim().min(1).max(80),
});

/**
 * Room numbers are printed on public QR codes, so they never grant access.
 * A guest proves their stay with reservation reference + last name.
 */
export async function verifyStay(localeIn: string, input: unknown): Promise<ActionResult> {
  const { t } = dict(localeIn);
  if (!(await rateLimit("guest-verify", 6, 10 * 60_000))) return { ok: false, error: t.validation.tooMany };
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t.validation.verify };

  const today = propertyToday();
  const res = await db.reservation.findFirst({
    where: {
      reference: parsed.data.reference,
      status: "CONFIRMED",
      guest: { lastName: { equals: parsed.data.lastName, mode: "insensitive" } },
      // Current stays, plus guests arriving tomorrow
      checkIn: { lte: addDays(today, 1) },
      checkOut: { gte: today },
    },
  });
  if (!res) return { ok: false, error: t.validation.verify };

  const token = newToken();
  // Valid until noon after check-out day (Istanbul, UTC+3 → 09:00 UTC)
  const expiresAt = new Date(res.checkOut.getTime() + 9 * 3_600_000);
  await db.guestAccess.create({ data: { tokenHash: hashToken(token), reservationId: res.id, expiresAt } });
  (await cookies()).set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  revalidatePath("/[locale]/guest", "layout");
  return { ok: true, data: undefined };
}

export async function signOutGuest() {
  const jar = await cookies();
  const token = jar.get(GUEST_COOKIE)?.value;
  if (token) await db.guestAccess.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(GUEST_COOKIE);
  revalidatePath("/[locale]/guest", "layout");
}

const requestSchema = z.object({
  type: z.enum(["TOWELS", "CLEANING", "MAINTENANCE", "AMENITIES", "RECEPTION", "OTHER"]),
  roomId: z.string().optional(),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function createServiceRequest(localeIn: string, input: unknown): Promise<ActionResult<{ reference: string }>> {
  const { t } = dict(localeIn);
  const stay = await getGuestSession();
  if (!stay) return { ok: false, error: t.validation.verify };
  if (!(await rateLimit("guest-request", 10, 10 * 60_000))) return { ok: false, error: t.validation.tooMany };
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t.validation.required, fieldErrors: { type: t.validation.required } };
  const d = parsed.data;
  if ((d.type === "MAINTENANCE" || d.type === "OTHER") && (d.message?.length ?? 0) < 3)
    return { ok: false, error: t.validation.message, fieldErrors: { message: t.validation.message } };

  // Only rooms actually allocated to this reservation are allowed.
  const rooms = stay.allocations.map((a) => a.room.id);
  const roomId = d.roomId && rooms.includes(d.roomId) ? d.roomId : rooms[0] ?? null;

  const property = await getProperty();
  const reference = generateReference("SR");
  await db.serviceRequest.create({
    data: {
      reference,
      propertyId: property.id,
      roomId,
      reservationId: stay.id,
      type: d.type,
      message: d.message || t.guest.requestTypes[d.type],
    },
  });

  // Maintenance requests also become a task for the team.
  if (d.type === "MAINTENANCE" || d.type === "CLEANING") {
    await db.task.create({
      data: {
        propertyId: property.id,
        roomId,
        title: d.type === "MAINTENANCE" ? `Guest report: ${(d.message ?? "").slice(0, 60)}` : "Guest requested room cleaning",
        description: `${d.message ?? ""}\n(Service request ${reference})`.trim(),
        type: d.type === "MAINTENANCE" ? "MAINTENANCE" : "CLEANING",
        priority: d.type === "MAINTENANCE" ? "HIGH" : "NORMAL",
        events: { create: { kind: "created", message: `Created from guest request ${reference}` } },
      },
    });
  }
  revalidatePath("/[locale]/guest/requests", "page");
  return { ok: true, data: { reference } };
}

const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().min(3).max(2000),
  name: z.string().trim().max(80).optional().or(z.literal("")),
  roomNumber: z.string().trim().max(10).optional().or(z.literal("")),
  website: z.string().max(0).optional(),
});

export async function submitFeedback(localeIn: string, input: unknown): Promise<ActionResult> {
  const { t } = dict(localeIn);
  if (!(await rateLimit("feedback", 4, 10 * 60_000))) return { ok: false, error: t.validation.tooMany };
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0]);
      fe[k] ??= k === "rating" ? t.validation.rating : t.validation.message;
    }
    return { ok: false, error: t.validation.generic, fieldErrors: fe };
  }
  const property = await getProperty();
  const { website: _hp, ...d } = parsed.data;
  await db.feedback.create({
    data: { propertyId: property.id, rating: d.rating, message: d.message, name: d.name || null, roomNumber: d.roomNumber || null },
  });
  return { ok: true, data: undefined };
}
