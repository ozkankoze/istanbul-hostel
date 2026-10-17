"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseISODate } from "@/lib/dates";
import { assertPermission, audit } from "@/server/auth";
import { getProperty } from "@/server/queries";
import { guard, localized, str } from "../guard";

function refresh() {
  revalidatePath("/", "layout");
}

const AMENITIES = ["wifi", "locker", "curtain", "readingLight", "outlet", "ac", "ensuite", "sharedBath", "towels", "desk", "view", "kettle", "balcony", "hairdryer", "mirror", "blackout"];

export async function saveRoomType(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("rooms");
    const id = str(fd, "id");
    const name = localized(fd, "name");
    if (!name.en) return { ok: false, error: "The English name is required." };
    const data = {
      name,
      summary: localized(fd, "summary"),
      description: localized(fd, "description"),
      bedSummary: localized(fd, "bedSummary"),
      basePrice: z.coerce.number({ message: "Enter a price." }).min(0).max(10000).parse(str(fd, "basePrice")),
      capacity: z.coerce.number().int().min(1, "Capacity must be at least 1.").max(30).parse(str(fd, "capacity")),
      sizeSqm: str(fd, "sizeSqm") ? z.coerce.number().int().min(1).max(500).parse(str(fd, "sizeSqm")) : null,
      amenities: fd.getAll("amenities").map(String).filter((a) => AMENITIES.includes(a)),
      images: fd.getAll("images").map(String).filter((s) => s.startsWith("/")),
      isActive: fd.get("isActive") === "on",
      kind: z.enum(["DORM", "PRIVATE"]).parse(str(fd, "kind")),
      genderPolicy: z.enum(["MIXED", "FEMALE"]).parse(str(fd, "genderPolicy") || "MIXED"),
    };
    if (id) {
      const before = await db.roomType.findUniqueOrThrow({ where: { id } });
      await db.roomType.update({ where: { id }, data });
      const priceNote = Number(before.basePrice) !== data.basePrice ? ` (price €${Number(before.basePrice)} → €${data.basePrice})` : "";
      await audit(user.id, "update", "RoomType", id, `Updated room type ${name.en}${priceNote}`);
    } else {
      const property = await getProperty();
      const slug = name.en.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const created = await db.roomType.create({ data: { ...data, slug: slug || `type-${Date.now()}`, propertyId: property.id, sortOrder: 99 } });
      await audit(user.id, "create", "RoomType", created.id, `Created room type ${name.en}`);
    }
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function saveRoom(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("rooms");
    const id = str(fd, "id");
    const d = z
      .object({
        number: z.string().trim().min(1, "Room number is required.").max(10).regex(/^[\w-]+$/, "Use letters, numbers or dashes."),
        floor: z.coerce.number().int().min(-2).max(50),
        roomTypeId: z.string().min(1, "Choose a room type."),
        beds: z.coerce.number().int().min(1).max(30),
        isActive: z.boolean(),
      })
      .parse({ number: str(fd, "number"), floor: str(fd, "floor") || "1", roomTypeId: str(fd, "roomTypeId"), beds: str(fd, "beds") || "1", isActive: fd.get("isActive") === "on" });
    const type = await db.roomType.findUniqueOrThrow({ where: { id: d.roomTypeId } });
    const bedCount = type.kind === "DORM" ? d.beds : 1;
    const property = await getProperty();

    await db.$transaction(async (tx) => {
      const room = id
        ? await tx.room.update({ where: { id }, data: { number: d.number, floor: d.floor, roomTypeId: d.roomTypeId, isActive: d.isActive } })
        : await tx.room.create({ data: { number: d.number, floor: d.floor, roomTypeId: d.roomTypeId, isActive: d.isActive, propertyId: property.id } });

      // Bring active beds in line with the configured count. Beds are deactivated, not deleted, to keep history.
      const beds = await tx.bed.findMany({ where: { roomId: room.id }, orderBy: { label: "asc" } });
      const labelFor = (i: number) => (type.kind === "DORM" ? `${String.fromCharCode(65 + Math.floor(i / 2))}${(i % 2) + 1}` : "Room");
      for (let i = 0; i < bedCount; i++) {
        const label = labelFor(i);
        const existing = beds.find((b) => b.label === label);
        if (existing) {
          if (!existing.isActive) await tx.bed.update({ where: { id: existing.id }, data: { isActive: true } });
        } else await tx.bed.create({ data: { roomId: room.id, label } });
      }
      const keep = new Set(Array.from({ length: bedCount }, (_, i) => labelFor(i)));
      await tx.bed.updateMany({ where: { roomId: room.id, label: { notIn: [...keep] } }, data: { isActive: false } });
      await tx.auditLog.create({
        data: { userId: user.id, action: id ? "update" : "create", entity: "Room", entityId: room.id, summary: `${id ? "Updated" : "Added"} room ${d.number} (${bedCount} bed${bedCount > 1 ? "s" : ""})` },
      });
    });
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function addBlockedDates(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("rooms");
    const roomId = str(fd, "roomId");
    const start = parseISODate(str(fd, "startDate"));
    const end = parseISODate(str(fd, "endDate"));
    const reason = str(fd, "reason") || "Unavailable";
    if (!roomId) return { ok: false, error: "Choose a room." };
    if (!start || !end) return { ok: false, error: "Choose a start and end date." };
    if (end < start) return { ok: false, error: "The end date must be on or after the start date." };
    const clash = await db.allocation.count({
      where: { roomId, checkIn: { lte: end }, checkOut: { gt: start }, reservation: { status: "CONFIRMED" } },
    });
    const room = await db.room.findUniqueOrThrow({ where: { id: roomId } });
    await db.blockedDate.create({ data: { roomId, startDate: start, endDate: end, reason: reason.slice(0, 200) } });
    await audit(user.id, "block", "Room", roomId, `Blocked room ${room.number} ${str(fd, "startDate")} → ${str(fd, "endDate")}: ${reason}`);
    refresh();
    return { ok: true, data: { warning: clash ? `Note: ${clash} confirmed booking(s) overlap these dates in room ${room.number}. Move them before the block starts.` : null } };
  });
}

export async function removeBlockedDates(id: string) {
  return guard(async () => {
    const user = await assertPermission("rooms");
    const b = await db.blockedDate.delete({ where: { id }, include: { room: true } });
    await audit(user.id, "unblock", "Room", b.roomId, `Removed block on room ${b.room.number}`);
    refresh();
    return { ok: true, data: undefined };
  });
}
