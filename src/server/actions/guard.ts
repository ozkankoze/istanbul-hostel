import "server-only";
import { ZodError } from "zod";
import { AuthError } from "@/server/auth";
import { AvailabilityError } from "@/server/availability";
import type { ActionResult } from "./types";

/** Wrap admin actions so expected errors become friendly messages and nothing leaks. */
export async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError || e instanceof AvailabilityError) return { ok: false, error: e.message };
    if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "Check the form and try again." };
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002")
      return { ok: false, error: "That value is already in use." };
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2034")
      return { ok: false, error: "Someone else changed this at the same moment. Please try again." };
    console.error(e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export function localized(fd: FormData, name: string) {
  return {
    en: String(fd.get(`${name}.en`) ?? "").trim(),
    bs: String(fd.get(`${name}.bs`) ?? "").trim(),
    tr: String(fd.get(`${name}.tr`) ?? "").trim(),
  };
}

export function str(fd: FormData, name: string) {
  return String(fd.get(name) ?? "").trim();
}
