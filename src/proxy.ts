import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

const SESSION_COOKIE = "ih_session";

/** Paths that are not localized (staff tools, API, auth, media). */
const UNLOCALIZED = ["/admin", "/staff", "/login", "/api", "/media"];

/** Countries whose visitors get Serbian automatically (BCMS-speaking). */
const SERBIAN_COUNTRIES = new Set(["RS", "BA", "ME", "HR"]);
const SERBIAN_LANGS = new Set(["sr", "bs", "hr", "sh", "cnr"]);

/**
 * Language for a first visit:
 * 1. a language the visitor chose before (cookie)
 * 2. their country (Vercel / Cloudflare geo headers) — BA, HR, ME, HR → Serbian
 * 3. a Serbian-family browser language (for visitors abroad or hosts without geo headers)
 * 4. English for everyone else.
 */
function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  const country = (request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? "").toUpperCase();
  if (SERBIAN_COUNTRIES.has(country)) return "sr";

  const header = request.headers.get("accept-language") ?? "";
  const first = header.split(",")[0]?.trim().split(";")[0]?.toLowerCase().split("-")[0] ?? "";
  if (SERBIAN_LANGS.has(first)) return "sr";

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
  // Bosnian became Serbian: keep old /bs links working.
  if (segment === "bs") {
    const url = request.nextUrl.clone();
    url.pathname = `/sr${pathname.slice(3)}`;
    const res = NextResponse.redirect(url, 308);
    res.cookies.set(LOCALE_COOKIE, "sr", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  // Turkish was retired: send old /tr links (and saved cookies) to English.
  if (segment === "tr") {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname.slice(3)}`;
    const res = NextResponse.redirect(url, 308);
    res.cookies.set(LOCALE_COOKIE, "en", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
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
  matcher: ["/((?!_next/|hk/|hk-sw.js|images/|uploads/|favicon|icon|apple-icon|robots.txt|sitemap.xml|manifest.webmanifest).*)"],
};

