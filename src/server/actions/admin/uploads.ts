"use server";

import { assertPermission } from "@/server/auth";
import { saveImage } from "@/server/uploads";
import { guard } from "../guard";

export async function uploadImage(fd: FormData) {
  return guard<{ url: string }>(async () => {
    await assertPermission("guide");
    const file = fd.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Choose an image first." };
    const res = await saveImage(file);
    if ("error" in res) return { ok: false, error: res.error };
    return { ok: true, data: res };
  });
}
