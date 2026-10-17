import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

const SESSION_COOKIE = "ih_session";

/** Paths that are not localized (staff tools, API, auth, media). */
const UNLOCALIZED = ["/admin", "/staff", "/login", "/api", "/media"];

function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: (tag ?? "").toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    // Bosnian, Croatian, Serbian and Montenegrin speakers read Bosnian comfortably.
    if (base === "bs" || base === "hr" || base === "sr" || base === "sh" || base === "cnr") return "bs";
    if (base === "tr") return "tr";
    if (base === "en") return "en";
  }
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

