import "server-only";
import { db } from "@/lib/db";
import { getProperty } from "@/server/queries";

/** Look up the room from a QR code parameter. Purely informational — never authorization. */
export async function resolveRoom(param: string | string[] | undefined, src?: string | string[]) {
  if (typeof param !== "string") return { param: null, room: null };
  const number = param.trim().slice(0, 10);
  if (!/^[\w-]{1,10}$/.test(number)) return { param: null, room: null };
  const property = await getProperty();
  const room = await db.room.findFirst({
    where: { propertyId: property.id, number, isActive: true },
    select: { id: true, number: true, roomType: { select: { name: true } } },
  });
  if (room && src === "qr") {
    await db.qrCode
      .updateMany({ where: { roomId: room.id }, data: { scans: { increment: 1 }, lastScanAt: new Date() } })
      .catch(() => {});
  }
  return { param: number, room };
}

export async function countReceptionScan(src?: string | string[]) {
  if (src !== "qr") return;
  const property = await getProperty();
  await db.qrCode
    .updateMany({ where: { propertyId: property.id, roomId: null, path: "/guest" }, data: { scans: { increment: 1 }, lastScanAt: new Date() } })
    .catch(() => {});
}
