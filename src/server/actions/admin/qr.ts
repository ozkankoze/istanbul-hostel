"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission, audit } from "@/server/auth";
import { getProperty } from "@/server/queries";
import { guard, str } from "../guard";

export async function createQr(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("qr");
    const property = await getProperty();
    const roomId = str(fd, "roomId");
    let label = str(fd, "label");
    let path = str(fd, "path") || "/guest";
    if (roomId) {
      const room = await db.room.findUniqueOrThrow({ where: { id: roomId } });
      label ||= `Room ${room.number}`;
      path = `/guest?room=${encodeURIComponent(room.number)}`;
    }
    label = z.string().trim().min(1, "Give the code a label.").max(60).parse(label);
    // Only internal paths — a QR code must never point guests to another site.
    if (!/^\/[\w\-/?=&%.]*$/.test(path) || path.startsWith("//")) return { ok: false, error: "Use a path on this website, e.g. /guest or /en/experiences." };
    const qr = await db.qrCode.create({ data: { propertyId: property.id, label, roomId: roomId || null, path } });
    await audit(user.id, "create", "QrCode", qr.id, `Created QR code "${label}" → ${path}`);
    revalidatePath("/admin/qr");
    return { ok: true, data: undefined };
  });
}

export async function createMissingRoomQrs() {
  return guard<{ created: number }>(async () => {
    const user = await assertPermission("qr");
    const property = await getProperty();
    const rooms = await db.room.findMany({ where: { propertyId: property.id, isActive: true, qrCodes: { none: {} } } });
    for (const r of rooms) {
      await db.qrCode.create({ data: { propertyId: property.id, label: `Room ${r.number}`, roomId: r.id, path: `/guest?room=${encodeURIComponent(r.number)}` } });
    }
    if (rooms.length) await audit(user.id, "create", "QrCode", null, `Generated ${rooms.length} room QR codes`);
    revalidatePath("/admin/qr");
    return { ok: true, data: { created: rooms.length } };
  });
}

export async function deleteQr(id: string) {
  return guard(async () => {
    const user = await assertPermission("qr");
    const qr = await db.qrCode.delete({ where: { id } });
    await audit(user.id, "delete", "QrCode", id, `Deleted QR code "${qr.label}"`);
    revalidatePath("/admin/qr");
    return { ok: true, data: undefined };
  });
}
