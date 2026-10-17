"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateReference } from "@/lib/utils";
import { getDictionary } from "@/i18n";
import { assertPermission, audit } from "@/server/auth";
import { confirmReservation, searchAvailability } from "@/server/availability";
import { validateStay } from "@/server/booking";
import { getProperty, getSetting } from "@/server/queries";
import { guard } from "../guard";

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/staff", "layout");
}

export async function confirmReservationAction(id: string) {
  return guard(async () => {
    const user = await assertPermission("reservations");
    await confirmReservation(id, user.id);
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function setReservationStatus(input: { id: string; status: "DECLINED" | "CANCELLED" | "COMPLETED"; reason?: string }) {
  return guard(async () => {
    const user = await assertPermission("reservations");
    const d = z
      .object({ id: z.string(), status: z.enum(["DECLINED", "CANCELLED", "COMPLETED"]), reason: z.string().trim().max(300).optional() })
      .parse(input);
    const r = await db.reservation.findUniqueOrThrow({ where: { id: d.id } });
    const allowed: Record<string, string[]> = {
      DECLINED: ["PENDING"],
      CANCELLED: ["PENDING", "CONFIRMED"],
      COMPLETED: ["CONFIRMED"],
    };
    if (!allowed[d.status]!.includes(r.status))
      return { ok: false, error: `A ${r.status.toLowerCase()} reservation can't be ${d.status.toLowerCase()}.` };

    await db.$transaction(async (tx) => {
      // Cancelled/declined stays release their beds; completed stays keep history.
      if (d.status !== "COMPLETED") await tx.allocation.deleteMany({ where: { reservationId: r.id } });
      await tx.reservation.update({ where: { id: r.id }, data: { status: d.status, statusReason: d.reason || null } });
      await tx.auditLog.create({
        data: { userId: user.id, action: d.status.toLowerCase(), entity: "Reservation", entityId: r.id, summary: `${d.status[0]}${d.status.slice(1).toLowerCase()} ${r.reference}${d.reason ? ` — ${d.reason}` : ""}` },
      });
    });
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function updateReservationNote(input: { id: string; note: string }) {
  return guard(async () => {
    const user = await assertPermission("reservations");
    const d = z.object({ id: z.string(), note: z.string().max(2000) }).parse(input);
    await db.reservation.update({ where: { id: d.id }, data: { internalNote: d.note || null } });
    await audit(user.id, "note", "Reservation", d.id, "Internal note updated");
    refresh();
    return { ok: true, data: undefined };
  });
}

const manualSchema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.coerce.number().int().min(1),
  roomTypeId: z.string().min(1, "Choose a room type."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.email("Enter a valid email."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(1500).optional().or(z.literal("")),
  confirmNow: z.string().optional(),
});

/** Walk-ins, phone and email bookings entered by reception. */
export async function createManualReservation(_: unknown, fd: FormData) {
  return guard<{ id: string; reference: string }>(async () => {
    const user = await assertPermission("reservations");
    const d = manualSchema.parse(Object.fromEntries(fd));
    const t = getDictionary("en");
    const stay = validateStay(d, t, {
      maxNights: await getSetting<number>("booking.maxNights", 30),
      maxGuests: 20,
    });
    if (!stay.ok) return { ok: false, error: stay.message };
    const option = (await searchAvailability(stay)).find((o) => o.roomTypeId === d.roomTypeId);
    if (!option) return { ok: false, error: "Room type not found." };
    if (!option.fits) return { ok: false, error: `Only ${option.freeUnits} unit(s) free for these dates; ${option.unitsNeeded} needed.` };

    const property = await getProperty();
    const guest = await db.guest.create({
      data: { firstName: d.firstName, lastName: d.lastName, email: d.email.toLowerCase(), phone: d.phone || null, country: d.country || null },
    });
    const res = await db.reservation.create({
      data: {
        reference: generateReference("IH"),
        propertyId: property.id,
        roomTypeId: d.roomTypeId,
        guestId: guest.id,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guests: stay.guests,
        units: option.unitsNeeded,
        nightlyPrice: option.nightlyPrice,
        totalPrice: option.total,
        specialRequests: d.notes || null,
        source: "ADMIN",
      },
    });
    await audit(user.id, "create", "Reservation", res.id, `Created ${res.reference} for ${d.firstName} ${d.lastName}`);
    if (d.confirmNow === "on") await confirmReservation(res.id, user.id);
    refresh();
    return { ok: true, data: { id: res.id, reference: res.reference } };
  });
}
