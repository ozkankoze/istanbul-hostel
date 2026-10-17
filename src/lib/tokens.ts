import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function newToken() {
  return randomBytes(32).toString("base64url");
}

/** Tokens are stored hashed so a database leak doesn't expose live sessions. */
export function hashToken(token: string) {
  const secret = process.env.SESSION_SECRET ?? "";
  return createHash("sha256").update(`${secret}:${token}`).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
