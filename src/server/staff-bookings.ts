import "server-only";
import { db } from "@/lib/db";
import { addDays, nightsBetween, propertyToday } from "@/lib/dates";
import { pick } from "@/i18n/config";

const include = {
  guest: { select: { firstName: true, lastName: true, phone: true, country: true } },
  roomType: { select: { name: true } },
  allocations: { select: { room: { select: { number: true } } } },
} as const;

export type BookingCard = {
  id: string;
  reference: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";
  guestName: string;
  country: string | null;
  phone: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  units: number;
  roomType: string;
  rooms: string[];
  total: string;
  specialRequests: string | null;
  isDemo: boolean;
};

type Row = Awaited<ReturnType<typeof db.reservation.findMany<{ include: typeof include }>>>[number];

function toCard(r: Row): BookingCard {
  return {
    id: r.id,
    reference: r.reference,
    status: r.status,
    guestName: `${r.guest.firstName} ${r.guest.lastName}`,
    country: r.guest.country,
    phone: r.guest.phone,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nights: nightsBetween(r.checkIn, r.checkOut),
    guests: r.guests,
    units: r.units,
    roomType: pick(r.roomType.name, "en"),
    rooms: [...new Set(r.allocations.map((a) => a.room.number))].sort(),
    total: r.totalPrice.toString(),
    specialRequests: r.specialRequests,
    isDemo: r.isDemo,
  };
}

/** Front-desk view for the phone app: what needs a decision or a person at the desk today. */
export async function getStaffBookings() {
  const today = propertyToday();
  const [pending, arrivals, departures, inHouse, upcoming] = await Promise.all([
    db.reservation.findMany({ where: { status: "PENDING", checkOut: { gt: today } }, orderBy: { checkIn: "asc" }, include }),
    db.reservation.findMany({ where: { status: "CONFIRMED", checkIn: today }, orderBy: { createdAt: "asc" }, include }),
    db.reservation.findMany({ where: { status: "CONFIRMED", checkOut: today }, orderBy: { createdAt: "asc" }, include }),
    db.reservation.count({ where: { status: "CONFIRMED", checkIn: { lt: today }, checkOut: { gt: today } } }),
    db.reservation.findMany({
      where: { status: "CONFIRMED", checkIn: { gt: today, lte: addDays(today, 3) } },
      orderBy: { checkIn: "asc" },
      include,
      take: 10,
    }),
  ]);
  return {
    pending: pending.map(toCard),
    arrivals: arrivals.map(toCard),
    departures: departures.map(toCard),
    upcoming: upcoming.map(toCard),
    inHouse: inHouse + arrivals.length,
  };
}

export async function countBookingAttention() {
  const today = propertyToday();
  return db.reservation.count({
    where: { OR: [{ status: "PENDING", checkOut: { gt: today } }, { status: "CONFIRMED", checkIn: today }] },
  });
}
