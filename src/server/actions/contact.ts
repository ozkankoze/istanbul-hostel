"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getProperty } from "@/server/queries";
import type { ActionResult } from "./types";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(3000),
  website: z.string().max(0).optional(), // honeypot
});

export async function submitContact(locale: string, input: unknown): Promise<ActionResult> {
  const t = getDictionary(isLocale(locale) ? locale : "en");
  if (!(await rateLimit("contact", 5))) return { ok: false, error: t.validation.tooMany };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0]);
      fieldErrors[k] ??= k === "email" ? t.validation.email : k === "message" ? t.validation.message : t.validation.required;
    }
    return { ok: false, error: t.validation.generic, fieldErrors };
  }
  const { website: _hp, ...data } = parsed.data;
  const p = await getProperty();
  await db.contactMessage.create({ data: { ...data, propertyId: p.id } });
  return { ok: true, data: undefined };
}
