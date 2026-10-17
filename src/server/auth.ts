import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { hashToken, newToken } from "@/lib/tokens";

export const SESSION_COOKIE = "ih_session";
const SESSION_DAYS = 7;

export type SessionUser = { id: string; name: string; email: string; role: Role };

/** What each role may open in the dashboard. Checked on the server for every page and action. */
export const PERMISSIONS = {
  overview: ["ADMIN", "MANAGER", "RECEPTION"],
  reservations: ["ADMIN", "MANAGER", "RECEPTION"],
  rooms: ["ADMIN", "MANAGER"],
  guests: ["ADMIN", "MANAGER", "RECEPTION"],
  housekeeping: ["ADMIN", "MANAGER", "RECEPTION", "HOUSEKEEPING"],
  tasks: ["ADMIN", "MANAGER", "RECEPTION"],
  experiences: ["ADMIN", "MANAGER", "RECEPTION"],
  guide: ["ADMIN", "MANAGER", "RECEPTION"],
  qr: ["ADMIN", "MANAGER", "RECEPTION"],
  content: ["ADMIN", "MANAGER"],
  staff: ["ADMIN"],
  settings: ["ADMIN"],
  staffApp: ["ADMIN", "MANAGER", "RECEPTION", "HOUSEKEEPING"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission) {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export async function createSession(userId: string) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const ua = (await headers()).get("user-agent")?.slice(0, 200) ?? null;
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt, userAgent: ua } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  const { isActive: _a, ...user } = session.user;
  return user;
});

/** For pages: redirect to login (or the user's home) when not allowed. */
export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!can(user.role, permission)) redirect(user.role === "HOUSEKEEPING" ? "/staff" : "/admin");
  return user;
}

export class AuthError extends Error {}

/** For server actions: throw instead of redirecting. */
export async function assertPermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Your session has expired. Please sign in again.");
  if (!can(user.role, permission)) throw new AuthError("You don't have permission to do that.");
  return user;
}

export async function audit(userId: string | null, action: string, entity: string, entityId: string | null, summary: string) {
  await db.auditLog.create({ data: { userId, action, entity, entityId, summary } });
}
