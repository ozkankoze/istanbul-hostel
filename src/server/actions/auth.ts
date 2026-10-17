"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";
import { audit, createSession, destroySession, getCurrentUser } from "@/server/auth";

const schema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

// Equalise timing when the account doesn't exist.
const DUMMY_HASH = "$2b$12$F4uzDpnS.R.GYC9nZWEj0.Hepepcgg6Qv2WgdhuMqJ8TTrw3xTEWO";

export async function login(_: unknown, formData: FormData): Promise<{ error: string } | undefined> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter your email and password." };
  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();

  const since = new Date(Date.now() - 15 * 60_000);
  const failures = await db.loginAttempt.count({ where: { email, success: false, createdAt: { gte: since } } });
  if (failures >= 5) return { error: "Too many failed attempts. Try again in 15 minutes." };

  const user = await db.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  await db.loginAttempt.create({ data: { email, ip, success: !!(ok && user?.isActive) } });
  if (!user || !ok || !user.isActive) return { error: "Email or password is incorrect." };

  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(user.id, "login", "User", user.id, `${user.name} signed in`);

  const next = parsed.data.next;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  if (user.role === "HOUSEKEEPING") redirect(safeNext?.startsWith("/staff") ? safeNext : "/staff");
  redirect(safeNext ?? "/admin");
}

export async function logout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit(user.id, "logout", "User", user.id, `${user.name} signed out`);
  redirect("/login");
}
