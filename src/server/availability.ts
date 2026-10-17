import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { nightsBetween } from "@/lib/dates";

type Tx = Prisma.TransactionClient;

export type StayQuery = { checkIn: Date; checkOut: Date; guests: number };

export type RoomTypeAvailability = {
  roomTypeId: string;
  slug: string;
  kind: "DORM" | "PRIVATE";
  /** Free sellable units for the whole stay (beds for dorms, rooms for private) */
  freeUnits: number;
  totalUnits: number;
  /** Units needed for the requested number of guests */
  unitsNeeded: number;
  fits: boolean;
  nightlyPrice: number;
  nights: number;
  total: number;
};

/**
 * Units needed for N guests. Dorms sell individual beds; private rooms are
 * sold whole, and a group larger than one room's capacity takes several rooms.
 */
export function unitsFor(kind: "DORM" | "PRIVATE", capacity: number, guests: number) {
  return kind === "DORM" ? guests : Math.ceil(guests / capacity);
}

/**
 * Inventory that is free for every night of [checkIn, checkOut).
 * A room is unavailable if it is inactive or blocked on any night.
 * A bed is taken if a confirmed allocation overlaps the stay.
 * Overlap rule: existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
 */
export async function freeInventory(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  client: Tx | typeof db = db,
) {
  const rooms = await client.room.findMany({
    where: {
      roomTypeId,
      isActive: true,
      blockedDates: { none: { startDate: { lt: checkOut }, endDate: { gte: checkIn } } },
    },
    select: {
      id: true,
      number: true,
      beds: { where: { isActive: true }, select: { id: true, label: true }, orderBy: { label: "asc" } },
      allocations: {
        where: {
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
          reservation: { status: { in: ["CONFIRMED"] } },
        },
        select: { bedId: true },
      },
    },
    orderBy: { number: "asc" },
  });

  return rooms.map((room) => {
    const takenBeds = new Set(room.allocations.map((a) => a.bedId).filter(Boolean) as string[]);
    const roomTaken = room.allocations.length > 0;
    return {
      roomId: room.id,
      number: room.number,
      roomTaken,
      freeBeds: room.beds.filter((b) => !takenBeds.has(b.id)),
    };
  });
}

export async function searchAvailability(q: StayQuery): Promise<RoomTypeAvailability[]> {
  const nights = nightsBetween(q.checkIn, q.checkOut);
  const types = await db.roomType.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  return Promise.all(
    types.map(async (t) => {
      const inv = await freeInventory(t.id, q.checkIn, q.checkOut);
      const totalUnits = await db.room.count({ where: { roomTypeId: t.id, isActive: true } }).then(async (rooms) =>
        t.kind === "DORM"
          ? db.bed.count({ where: { isActive: true, room: { roomTypeId: t.id, isActive: true } } })
          : rooms,
      );
      const freeUnits =
        t.kind === "DORM"
          ? inv.reduce((n, r) => n + r.freeBeds.length, 0)
          : inv.filter((r) => !r.roomTaken).length;
      const unitsNeeded = unitsFor(t.kind, t.capacity, q.guests);
      const nightlyPrice = Number(t.basePrice);
      return {
        roomTypeId: t.id,
        slug: t.slug,
        kind: t.kind,
        freeUnits,
        totalUnits,
        unitsNeeded,
        fits: freeUnits >= unitsNeeded,
        nightlyPrice,
        nights,
        total: nightlyPrice * unitsNeeded * nights,
      };
    }),
  );
}

export class AvailabilityError extends Error {}

/**
 * Assign concrete beds/rooms to a reservation and mark it confirmed.
 * Runs inside a SERIALIZABLE transaction so two concurrent confirmations
 * can't both take the last bed.
 */
export async function confirmReservation(reservationId: string, userId: string | null) {
  return db.$transaction(
    async (tx) => {
      const r = await tx.reservation.findUniqueOrThrow({
        where: { id: reservationId },
        include: { roomType: true },
      });
      if (r.status === "CONFIRMED") return r;
      if (r.status !== "PENDING") throw new AvailabilityError(`Only pending reservations can be confirmed (current: ${r.status}).`);

      const inv = await freeInventory(r.roomTypeId, r.checkIn, r.checkOut, tx);
      const allocations: { roomId: string; bedId: string | null }[] = [];

      if (r.roomType.kind === "DORM") {
        // Prefer keeping a group together in the same room.
        const sorted = [...inv].sort((a, b) => b.freeBeds.length - a.freeBeds.length);
        const together = sorted.find((room) => room.freeBeds.length >= r.units);
        const pool = together ? [together] : sorted;
        for (const room of pool) {
          for (const bed of room.freeBeds) {
            if (allocations.length >= r.units) break;
            allocations.push({ roomId: room.roomId, bedId: bed.id });
          }
        }
      } else {
        for (const room of inv.filter((x) => !x.roomTaken)) {
          if (allocations.length >= r.units) break;
          allocations.push({ roomId: room.roomId, bedId: room.freeBeds[0]?.id ?? null });
        }
      }

      if (allocations.length < r.units) {
        throw new AvailabilityError("Not enough free inventory for these dates — it may have been taken by another confirmed booking.");
      }

      await tx.allocation.createMany({
        data: allocations.map((a) => ({ ...a, reservationId: r.id, checkIn: r.checkIn, checkOut: r.checkOut })),
      });
      const updated = await tx.reservation.update({
        where: { id: r.id },
        data: { status: "CONFIRMED", confirmedAt: new Date(), statusReason: null },
      });
      await tx.auditLog.create({
        data: { userId, action: "confirm", entity: "Reservation", entityId: r.id, summary: `Confirmed ${r.reference}` },
      });
      return updated;
    },
    { isolationLevel: "Serializable" },
  );
}
