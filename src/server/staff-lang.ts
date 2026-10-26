import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE } from "@/i18n/config";
import { isStaffLang, STAFF_LANG_COOKIE, STAFF_TEXT, type StaffLang } from "@/components/staff/staff-text";

const SERBIAN_COUNTRIES = new Set(["RS", "BA", "ME", "HR"]);
const SERBIAN_LANGS = new Set(["sr", "bs", "hr", "sh", "cnr"]);

/** Staff app language: explicit choice → website language cookie → country → browser language → English. */
export async function getStaffLang(): Promise<StaffLang> {
  const jar = await cookies();
  const chosen = jar.get(STAFF_LANG_COOKIE)?.value;
  if (isStaffLang(chosen)) return chosen;
  if (jar.get(LOCALE_COOKIE)?.value === "sr") return "sr";
  const h = await headers();
  const country = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "").toUpperCase();
  if (SERBIAN_COUNTRIES.has(country)) return "sr";
  const first = (h.get("accept-language") ?? "").split(",")[0]?.trim().split(";")[0]?.toLowerCase().split("-")[0] ?? "";
  return SERBIAN_LANGS.has(first) ? "sr" : "en";
}

export async function getStaffText() {
  const lang = await getStaffLang();
  return { lang, t: STAFF_TEXT[lang] };
}
