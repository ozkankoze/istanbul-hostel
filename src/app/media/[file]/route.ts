import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/server/uploads";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

export async function GET(_req: Request, ctx: RouteContext<"/media/[file]">) {
  const { file } = await ctx.params;
  // Only our own generated file names: no paths, no dots beyond the extension.
  if (!/^[a-z0-9]+-[a-f0-9]{12}\.(jpg|png|webp|avif)$/.test(file)) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[file.split(".").pop()!]!,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
