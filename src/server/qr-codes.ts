import "server-only";
import { db } from "@/lib/db";

/** The single reception code that opens the shared guest guide. Created on first use. */
export async function getReceptionQr(propertyId: string) {
  const existing = await db.qrCode.findFirst({ where: { propertyId, roomId: null, path: "/guest" }, orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  return db.qrCode.create({ data: { propertyId, label: "Reception", path: "/guest" } });
}
