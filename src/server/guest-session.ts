import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

export const GUEST_COOKIE = "ih_guest";

/** The verified stay for this browser, if any. */
export const getGuestSession = cache(async () => {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!token) return null;
  const access = await db.guestAccess.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      reservation: {
        include: {
          guest: { select: { firstName: true, lastName: true } },
          roomType: { select: { name: true } },
          allocations: { include: { room: { select: { id: true, number: true } }, bed: { select: { label: true } } } },
        },
      },
    },
  });
  if (!access || access.expiresAt < new Date()) return null;
  if (access.reservation.status !== "CONFIRMED") return null;
  return access.reservation;
});

export type GuestStay = NonNullable<Awaited<ReturnType<typeof getGuestSession>>>;
