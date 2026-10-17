"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission, audit } from "@/server/auth";
import { guard, str } from "../guard";

const ROLES = ["ADMIN", "MANAGER", "RECEPTION", "HOUSEKEEPING"] as const;

const password = z
  .string()
  .min(10, "Passwords need at least 10 characters.")
  .max(200)
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export async function saveStaff(_: unknown, fd: FormData) {
  return guard(async () => {
    const admin = await assertPermission("staff");
    const id = str(fd, "id");
    const base = z
      .object({
        name: z.string().trim().min(2, "Enter a name.").max(100),
        email: z.email("Enter a valid email.").max(200),
        role: z.enum(ROLES),
        phone: z.string().trim().max(40).optional(),
        isActive: z.boolean(),
      })
      .parse({ name: str(fd, "name"), email: str(fd, "email").toLowerCase(), role: str(fd, "role"), phone: str(fd, "phone") || undefined, isActive: fd.get("isActive") === "on" });
    const pw = str(fd, "password");

    if (id) {
      if (id === admin.id && (base.role !== "ADMIN" || !base.isActive))
        return { ok: false, error: "You can't remove your own admin access or deactivate yourself." };
      const data: Record<string, unknown> = { ...base, phone: base.phone ?? null };
      if (pw) data.passwordHash = await bcrypt.hash(password.parse(pw), 12);
      await db.user.update({ where: { id }, data });
      if (!base.isActive || pw) await db.session.deleteMany({ where: { userId: id } });
      await audit(admin.id, "update", "User", id, `Updated staff account ${base.email}${pw ? " (password reset)" : ""}`);
    } else {
      const hash = await bcrypt.hash(password.parse(pw), 12);
      const u = await db.user.create({ data: { ...base, phone: base.phone ?? null, passwordHash: hash } });
      await audit(admin.id, "create", "User", u.id, `Created staff account ${base.email} (${base.role})`);
    }
    revalidatePath("/admin", "layout");
    return { ok: true, data: undefined };
  });
}

export async function updateGuestNotes(input: { id: string; notes: string }) {
  return guard(async () => {
    const user = await assertPermission("guests");
    const d = z.object({ id: z.string(), notes: z.string().max(2000) }).parse(input);
    await db.guest.update({ where: { id: d.id }, data: { notes: d.notes || null } });
    await audit(user.id, "update", "Guest", d.id, "Guest notes updated");
    revalidatePath("/admin/guests", "layout");
    return { ok: true, data: undefined };
  });
}
