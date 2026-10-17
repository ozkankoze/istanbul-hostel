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

const time = (label: string) => z.string().regex(/^\d{2}:\d{2}$/, `${label}: use the format HH:MM.`);

export async function saveGuideConfig(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("guide");
    const property = await getProperty();
    const data = {
      welcomeNote: localized(fd, "welcomeNote"),
      wifiNetwork: z.string().trim().min(1, "Enter the Wi-Fi network name.").max(64).parse(str(fd, "wifiNetwork")),
      wifiPassword: z.string().trim().min(1, "Enter the Wi-Fi password.").max(128).parse(str(fd, "wifiPassword")),
      breakfastStart: time("Breakfast start").parse(str(fd, "breakfastStart")),
      breakfastEnd: time("Breakfast end").parse(str(fd, "breakfastEnd")),
      breakfastLocation: localized(fd, "breakfastLocation"),
      breakfastMenu: localized(fd, "breakfastMenu"),
      luggageInfo: localized(fd, "luggageInfo"),
      quietHoursStart: time("Quiet hours start").parse(str(fd, "quietHoursStart")),
      quietHoursEnd: time("Quiet hours end").parse(str(fd, "quietHoursEnd")),
      smokingPolicy: localized(fd, "smokingPolicy"),
      checkoutSteps: localized(fd, "checkoutSteps"),
      receptionHours: localized(fd, "receptionHours"),
    };
    await db.guideConfig.upsert({ where: { propertyId: property.id }, update: data, create: { ...data, propertyId: property.id } });
    const checkIn = str(fd, "checkInTime");
    const checkOut = str(fd, "checkOutTime");
    if (checkIn && checkOut) {
      await db.property.update({
        where: { id: property.id },
        data: { checkInTime: time("Check-in").parse(checkIn), checkOutTime: time("Check-out").parse(checkOut) },
      });
    }
    await audit(user.id, "update", "GuideConfig", property.id, "Updated guest guide essentials");
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function saveGuideItem(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("guide");
    const id = str(fd, "id");
    const title = localized(fd, "title");
    if (!title.en) return { ok: false, error: "The English title is required." };
    const data = {
      section: z.enum(["FACILITY", "RULE", "TRANSPORT"]).parse(str(fd, "section")),
      icon: str(fd, "icon") || "info",
      title,
      body: localized(fd, "body"),
      sortOrder: Number(str(fd, "sortOrder")) || 0,
      isActive: fd.get("isActive") === "on",
    };
    if (id) await db.guideItem.update({ where: { id }, data });
    else await db.guideItem.create({ data: { ...data, propertyId: (await getProperty()).id } });
    await audit(user.id, id ? "update" : "create", "GuideItem", id || null, `${id ? "Updated" : "Added"} guide item "${title.en}"`);
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function deleteGuideItem(id: string) {
  return guard(async () => {
    const user = await assertPermission("guide");
    const item = await db.guideItem.delete({ where: { id } });
    await audit(user.id, "delete", "GuideItem", id, `Deleted guide item "${(item.title as { en?: string }).en}"`);
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function savePlace(_: unknown, fd: FormData) {
  return guard(async () => {
    const user = await assertPermission("guide");
    const id = str(fd, "id");
    const name = z.string().trim().min(1, "Enter a name.").max(100).parse(str(fd, "name"));
    const transit = localized(fd, "transitNote");
    const data = {
      name,
      category: z.enum(["ATTRACTION", "RESTAURANT", "CAFE", "NEIGHBORHOOD", "NIGHTLIFE"]).parse(str(fd, "category")),
      area: str(fd, "area").slice(0, 60),
      description: localized(fd, "description"),
      walkingMinutes: str(fd, "walkingMinutes") ? z.coerce.number().int().min(1).max(240).parse(str(fd, "walkingMinutes")) : null,
      transitNote: transit.en || transit.bs || transit.tr ? transit : undefined,
      mapQuery: str(fd, "mapQuery") || `${name}, Istanbul`,
      image: fd.getAll("image").map(String)[0] ?? null,
      sortOrder: Number(str(fd, "sortOrder")) || 0,
      isActive: fd.get("isActive") === "on",
    };
    if (id) await db.place.update({ where: { id }, data });
    else await db.place.create({ data: { ...data, propertyId: (await getProperty()).id } });
    await audit(user.id, id ? "update" : "create", "Place", id || null, `${id ? "Updated" : "Added"} recommendation ${name}`);
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function deletePlace(id: string) {
  return guard(async () => {
    const user = await assertPermission("guide");
    const p = await db.place.delete({ where: { id } });
    await audit(user.id, "delete", "Place", id, `Deleted recommendation ${p.name}`);
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function setServiceRequestStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED") {
  return guard(async () => {
    const user = await assertPermission("guide");
    const r = await db.serviceRequest.update({ where: { id }, data: { status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).parse(status) } });
    await audit(user.id, "update", "ServiceRequest", id, `Guest request ${r.reference} → ${status.toLowerCase().replace("_", " ")}`);
    revalidatePath("/admin", "layout");
    revalidatePath("/[locale]/guest/requests", "page");
    return { ok: true, data: undefined };
  });
}
