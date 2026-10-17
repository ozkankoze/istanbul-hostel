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

export async function saveExperience(_: unknown, fd: FormData) {
  return guard<{ id: string }>(async () => {
    const user = await assertPermission("experiences");
    const id = str(fd, "id");
    const title = localized(fd, "title");
    if (!title.en) return { ok: false, error: "The English title is required." };
    const days = fd.getAll("availableDays").map(Number).filter((n) => n >= 0 && n <= 6);
    if (!days.length) return { ok: false, error: "Choose at least one day the experience runs." };
    const image = fd.getAll("image").map(String)[0];
    if (!image) return { ok: false, error: "Upload an image." };
    const data = {
      title,
      summary: localized(fd, "summary"),
      description: localized(fd, "description"),
      meetingPoint: localized(fd, "meetingPoint"),
      durationMinutes: z.coerce.number().int().min(10, "Duration must be at least 10 minutes.").max(1440).parse(str(fd, "durationMinutes")),
      price: z.coerce.number().min(0).max(10000).parse(str(fd, "price")),
      priceUnit: z.enum(["PERSON", "GROUP"]).parse(str(fd, "priceUnit")),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, "Enter a start time like 10:00.").parse(str(fd, "startTime")),
      maxParticipants: z.coerce.number().int().min(1).max(200).parse(str(fd, "maxParticipants")),
      availableDays: days.sort(),
      image,
      isActive: fd.get("isActive") === "on",
      isTransfer: fd.get("isTransfer") === "on",
    };
    let savedId = id;
    if (id) {
      await db.experience.update({ where: { id }, data });
      await audit(user.id, "update", "Experience", id, `Updated experience ${title.en} (€${data.price})`);
    } else {
      const property = await getProperty();
      const slug = title.en.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `experience-${Date.now()}`;
      const exists = await db.experience.findFirst({ where: { propertyId: property.id, slug } });
      const created = await db.experience.create({
        data: { ...data, propertyId: property.id, slug: exists ? `${slug}-${Date.now().toString(36)}` : slug, sortOrder: 50 },
      });
      savedId = created.id;
      await audit(user.id, "create", "Experience", created.id, `Created experience ${title.en}`);
    }
    refresh();
    return { ok: true, data: { id: savedId } };
  });
}

export async function toggleExperience(id: string, isActive: boolean) {
  return guard(async () => {
    const user = await assertPermission("experiences");
    const e = await db.experience.update({ where: { id }, data: { isActive } });
    await audit(user.id, isActive ? "enable" : "disable", "Experience", id, `${isActive ? "Enabled" : "Disabled"} ${(e.title as { en?: string }).en}`);
    refresh();
    return { ok: true, data: undefined };
  });
}

const REQ = ["CONFIRMED", "DECLINED", "CANCELLED", "COMPLETED"] as const;

export async function setExperienceBookingStatus(id: string, status: (typeof REQ)[number]) {
  return guard(async () => {
    const user = await assertPermission("experiences");
    z.enum(REQ).parse(status);
    const b = await db.experienceBooking.update({ where: { id }, data: { status } });
    await audit(user.id, status.toLowerCase(), "ExperienceBooking", id, `${status[0]}${status.slice(1).toLowerCase()} tour request ${b.reference}`);
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function setTransferStatus(id: string, status: (typeof REQ)[number]) {
  return guard(async () => {
    const user = await assertPermission("experiences");
    z.enum(REQ).parse(status);
    const t = await db.transferRequest.update({ where: { id }, data: { status } });
    await audit(user.id, status.toLowerCase(), "TransferRequest", id, `${status[0]}${status.slice(1).toLowerCase()} transfer ${t.reference}`);
    refresh();
    return { ok: true, data: undefined };
  });
}
