import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

const SESSION_COOKIE = "ih_session";

/** Paths that are not localized (staff tools, API, auth, media). */
const UNLOCALIZED = ["/admin", "/staff", "/login", "/api", "/media"];

/** Countries whose visitors get Bosnian automatically (BCMS-speaking). */
const BOSNIAN_COUNTRIES = new Set(["BA", "HR", "RS", "ME"]);
const BOSNIAN_LANGS = new Set(["bs", "hr", "sr", "sh", "cnr"]);

/**
 * Language for a first visit:
 * 1. a language the visitor chose before (cookie)
 * 2. their country (Vercel / Cloudflare geo headers) — BA, HR, RS, ME → Bosnian
 * 3. a Bosnian-family browser language (for visitors abroad or hosts without geo headers)
 * 4. English for everyone else.
 * Turkish is never picked automatically — guests can still choose it in the language menu.
 */
function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const country = (request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? "").toUpperCase();
  if (BOSNIAN_COUNTRIES.has(country)) return "bs";

  const header = request.headers.get("accept-language") ?? "";
  const first = header.split(",")[0]?.trim().split(";")[0]?.toLowerCase().split("-")[0] ?? "";
  if (BOSNIAN_LANGS.has(first)) return "bs";

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic gate for staff areas. Real authorization happens on the server
  // in every page, layout and action.
  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) {
    if (!request.cookies.get(SESSION_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (UNLOCALIZED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const segment = pathname.split("/")[1];
  if (isLocale(segment)) {
    // Remember an explicit choice so un-prefixed links (e.g. QR codes) keep it.
    const res = NextResponse.next();
    if (request.cookies.get(LOCALE_COOKIE)?.value !== segment) {
      res.cookies.set(LOCALE_COOKIE, segment, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return res;
  }

  const locale = preferredLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/|images/|uploads/|favicon|icon|apple-icon|robots.txt|sitemap.xml|manifest.webmanifest).*)"],
};

