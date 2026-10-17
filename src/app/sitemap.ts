import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { locales } from "@/i18n/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [rooms, experiences] = await Promise.all([
    db.roomType.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.experience.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  const paths = [
    "",
    "/rooms",
    "/experiences",
    "/explore",
    "/about",
    "/contact",
    "/book",
    "/privacy",
    "/terms",
    ...rooms.map((r) => `/rooms/${r.slug}`),
    ...experiences.map((e) => `/experiences/${e.slug}`),
  ];
  return paths.map((p) => ({
    url: `${base}/en${p}`,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${p}`])) },
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
