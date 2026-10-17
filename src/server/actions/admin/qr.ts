"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission, audit } from "@/server/auth";
import { getProperty } from "@/server/queries";
import { guard, str } from "../guard";

/**
 * One reception QR code opens the shared guest guide. Extra codes are optional
 * custom links (e.g. a breakfast-table card pointing to /en/experiences).
 */
export async function createQr(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("qr");
    const property = await getProperty();
    const label = z.string().trim().min(1, "Give the code a label.").max(60).parse(str(fd, "label"));
    const path = str(fd, "path") || "/guest";
    // Only internal paths — a QR code must never point guests to another site.
    if (!/^\/[\w\-/?=&%.]*$/.test(path) || path.startsWith("//")) return { ok: false, error: "Use a path on this website, e.g. /guest or /en/experiences." };
    const qr = await db.qrCode.create({ data: { propertyId: property.id, label, path } });
    await audit(user.id, "create", "QrCode", qr.id, `Created QR code "${label}" → ${path}`);
    revalidatePath("/admin/qr");
    return { ok: true, data: undefined };
  });
}

export async function deleteQr(id: string) {
  return guard(async () => {
    const user = await assertPermission("qr");
    const qr = await db.qrCode.findUniqueOrThrow({ where: { id } });
    if (qr.path === "/guest" && !qr.roomId) return { ok: false, error: "The reception code can't be deleted — guests rely on it." };
    await db.qrCode.delete({ where: { id } });
    await audit(user.id, "delete", "QrCode", id, `Deleted QR code "${qr.label}"`);
    revalidatePath("/admin/qr");
    return { ok: true, data: undefined };
  });
}
