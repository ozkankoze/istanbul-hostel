"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission, audit } from "@/server/auth";
import { getProperty } from "@/server/queries";
import { guard, localized, str } from "../guard";

function refresh() {
  revalidatePath("/", "layout");
}

export async function saveHero(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("content");
    const property = await getProperty();
    const title = localized(fd, "title");
    if (!title.en) return { ok: false, error: "The English headline is required." };
    const value = { title, subtitle: localized(fd, "subtitle"), image: fd.getAll("image").map(String)[0] || "/images/hero-istanbul.jpg" };
    await db.contentBlock.upsert({
      where: { propertyId_key: { propertyId: property.id, key: "home.hero" } },
      update: { value },
      create: { propertyId: property.id, key: "home.hero", value },
    });
    await audit(user.id, "update", "ContentBlock", "home.hero", "Updated homepage hero");
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function saveFaq(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("content");
    const id = str(fd, "id");
    const question = localized(fd, "question");
    if (!question.en) return { ok: false, error: "The English question is required." };
    const data = { question, answer: localized(fd, "answer"), sortOrder: Number(str(fd, "sortOrder")) || 0, isActive: fd.get("isActive") === "on" };
    if (id) await db.faq.update({ where: { id }, data });
    else await db.faq.create({ data: { ...data, propertyId: (await getProperty()).id } });
    await audit(user.id, id ? "update" : "create", "Faq", id || null, `${id ? "Updated" : "Added"} FAQ "${question.en}"`);
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function deleteFaq(id: string) {
  return guard(async () => {
    const user = await assertPermission("content");
    await db.faq.delete({ where: { id } });
    await audit(user.id, "delete", "Faq", id, "Deleted FAQ");
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function saveTestimonial(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("content");
    const id = str(fd, "id");
    const quote = localized(fd, "quote");
    if (!quote.en) return { ok: false, error: "The English quote is required." };
    const data = {
      name: z.string().trim().min(1, "Enter a name.").max(80).parse(str(fd, "name")),
      origin: str(fd, "origin").slice(0, 80),
      quote,
      isSample: fd.get("isSample") === "on",
      isActive: fd.get("isActive") === "on",
      sortOrder: Number(str(fd, "sortOrder")) || 0,
    };
    if (id) await db.testimonial.update({ where: { id }, data });
    else await db.testimonial.create({ data: { ...data, propertyId: (await getProperty()).id } });
    await audit(user.id, id ? "update" : "create", "Testimonial", id || null, `${id ? "Updated" : "Added"} review from ${data.name}`);
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function deleteTestimonial(id: string) {
  return guard(async () => {
    const user = await assertPermission("content");
    await db.testimonial.delete({ where: { id } });
    await audit(user.id, "delete", "Testimonial", id, "Deleted review");
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function setMessageHandled(id: string, handled: boolean) {
  return guard(async () => {
    await assertPermission("content");
    await db.contactMessage.update({ where: { id }, data: { handled } });
    revalidatePath("/admin/content");
    return { ok: true, data: undefined };
  });
}

export async function saveSettings(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("settings");
    const property = await getProperty();
    const phone = z.string().trim().min(5, "Enter a phone number.").max(40);
    const p = {
      name: z.string().trim().min(2, "Enter the property name.").max(100).parse(str(fd, "name")),
      tagline: localized(fd, "tagline"),
      addressLine: z.string().trim().min(3, "Enter the address.").max(200).parse(str(fd, "addressLine")),
      city: str(fd, "city") || "Istanbul",
      country: str(fd, "country") || "Türkiye",
      phone: phone.parse(str(fd, "phone")),
      whatsapp: phone.parse(str(fd, "whatsapp")),
      email: z.email("Enter a valid email.").parse(str(fd, "email")),
      mapQuery: str(fd, "mapQuery") || str(fd, "addressLine"),
      reviewUrl: str(fd, "reviewUrl") ? z.url("Enter a full review URL starting with https://").parse(str(fd, "reviewUrl")) : null,
      isDemo: fd.get("isDemo") === "on",
    };
    const settings: Record<string, number> = {
      "booking.maxNights": z.coerce.number().int().min(1).max(365).parse(str(fd, "maxNights")),
      "booking.maxGuests": z.coerce.number().int().min(1).max(30).parse(str(fd, "maxGuests")),
      "transfer.priceIST": z.coerce.number().min(0).max(1000).parse(str(fd, "priceIST")),
      "transfer.priceSAW": z.coerce.number().min(0).max(1000).parse(str(fd, "priceSAW")),
    };
    await db.property.update({ where: { id: property.id }, data: p });
    for (const [key, value] of Object.entries(settings)) {
      await db.setting.upsert({
        where: { propertyId_key: { propertyId: property.id, key } },
        update: { value },
        create: { propertyId: property.id, key, value },
      });
    }
    await audit(user.id, "update", "Property", property.id, "Updated property settings");
    refresh();
    return { ok: true, data: undefined };
  });
}
