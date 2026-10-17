import "server-only";
import { db } from "@/lib/db";
import { addDays, propertyToday } from "@/lib/dates";
import { getProperty } from "@/server/queries";

export type Occupancy = "VACANT" | "OCCUPIED" | "PARTIAL" | "ARRIVING" | "DEPARTING" | "BLOCKED";

/**
 * Occupancy comes from confirmed reservations (allocations) and is kept
 * separate from housekeeping status: an occupied room can still be dirty.
 */
export async function getRoomBoard() {
  const property = await getProperty();
  const today = propertyToday();
  const tomorrow = addDays(today, 1);

  const rooms = await db.room.findMany({
    where: { propertyId: property.id },
    orderBy: { number: "asc" },
    include: {
      roomType: { select: { name: true, kind: true, slug: true } },
      assignedTo: { select: { id: true, name: true } },
      beds: { where: { isActive: true }, select: { id: true } },
      blockedDates: { where: { startDate: { lte: today }, endDate: { gte: today } }, select: { reason: true } },
      allocations: {
        where: {
          reservation: { status: "CONFIRMED" },
          checkIn: { lte: tomorrow },
          checkOut: { gte: today },
        },
        select: {
          bedId: true,
          checkIn: true,
          checkOut: true,
          reservation: { select: { reference: true, guest: { select: { firstName: true, lastName: true } } } },
        },
      },
      tasks: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, select: { id: true, type: true, priority: true } },
    },
  });

  return rooms.map((r) => {
    const t = today.getTime();
    const inHouse = r.allocations.filter((a) => a.checkIn.getTime() <= t && a.checkOut.getTime() > t);
    const arriving = r.allocations.filter((a) => a.checkIn.getTime() === t);
    const departing = r.allocations.filter((a) => a.checkOut.getTime() === t);
    const capacity = r.roomType.kind === "DORM" ? r.beds.length : 1;
    const occupiedUnits = r.roomType.kind === "DORM" ? new Set(inHouse.map((a) => a.bedId)).size : inHouse.length ? 1 : 0;

    let occupancy: Occupancy = "VACANT";
    if (r.blockedDates.length || !r.isActive) occupancy = "BLOCKED";
    else if (occupiedUnits >= capacity) occupancy = "OCCUPIED";
    else if (occupiedUnits > 0) occupancy = "PARTIAL";
    else if (arriving.length) occupancy = "ARRIVING";
    if (departing.length && occupancy === "VACANT") occupancy = "DEPARTING";

    return {
      id: r.id,
      number: r.number,
      floor: r.floor,
      isActive: r.isActive,
      typeName: r.roomType.name,
      kind: r.roomType.kind,
      status: r.housekeepingStatus,
      note: r.housekeepingNote,
      statusUpdatedAt: r.statusUpdatedAt,
      assignedTo: r.assignedTo,
      capacity,
      occupiedUnits,
      occupancy,
      arrivingToday: arriving.length,
      departingToday: departing.length,
      guests: [...new Set(inHouse.map((a) => `${a.reservation.guest.firstName} ${a.reservation.guest.lastName[0]}.`))],
      blockedReason: r.blockedDates[0]?.reason ?? null,
      openTasks: r.tasks.length,
      urgentTasks: r.tasks.filter((x) => x.priority === "URGENT" || x.priority === "HIGH").length,
    };
  });
}

export type RoomBoardItem = Awaited<ReturnType<typeof getRoomBoard>>[number];
