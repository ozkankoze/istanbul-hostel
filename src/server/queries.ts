import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/** Single-property deployment: the first property is "the" hostel. */
export const getProperty = cache(async () => {
  const p = await db.property.findFirst({ orderBy: { createdAt: "asc" } });
  if (!p) throw new Error("No property found. Run `npm run db:seed`.");
  return p;
});

export const getSettings = cache(async () => {
  const p = await getProperty();
  const rows = await db.setting.findMany({ where: { propertyId: p.id } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
});

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const s = await getSettings();
  return (s[key] as T) ?? fallback;
}

export const getRoomTypes = cache(async () => {
  const p = await getProperty();
  return db.roomType.findMany({
    where: { propertyId: p.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
});

export const getRoomTypeBySlug = cache(async (slug: string) => {
  const p = await getProperty();
  return db.roomType.findFirst({ where: { propertyId: p.id, slug, isActive: true } });
});

export const getExperiences = cache(async () => {
  const p = await getProperty();
  return db.experience.findMany({
    where: { propertyId: p.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
});

export const getExperienceBySlug = cache(async (slug: string) => {
  const p = await getProperty();
  return db.experience.findFirst({ where: { propertyId: p.id, slug, isActive: true } });
});

export const getPlaces = cache(async () => {
  const p = await getProperty();
  return db.place.findMany({ where: { propertyId: p.id, isActive: true }, orderBy: { sortOrder: "asc" } });
});

export const getGuide = cache(async () => {
  const p = await getProperty();
  const [config, items] = await Promise.all([
    db.guideConfig.findUnique({ where: { propertyId: p.id } }),
    db.guideItem.findMany({ where: { propertyId: p.id, isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { config, items };
});

export const getFaqs = cache(async () => {
  const p = await getProperty();
  return db.faq.findMany({ where: { propertyId: p.id, isActive: true }, orderBy: { sortOrder: "asc" } });
});

export const getTestimonials = cache(async () => {
  const p = await getProperty();
  return db.testimonial.findMany({ where: { propertyId: p.id, isActive: true }, orderBy: { sortOrder: "asc" } });
});

export const getContentBlock = cache(async <T,>(key: string): Promise<T | null> => {
  const p = await getProperty();
  const b = await db.contentBlock.findUnique({ where: { propertyId_key: { propertyId: p.id, key } } });
  return (b?.value as T) ?? null;
});
