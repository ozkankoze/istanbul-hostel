"use server";

import { cookies } from "next/headers";
import { isStaffLang, STAFF_LANG_COOKIE } from "@/components/staff/staff-text";

export async function setStaffLang(lang: string) {
  if (!isStaffLang(lang)) return;
  (await cookies()).set(STAFF_LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
