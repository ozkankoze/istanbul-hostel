import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Local-disk storage for admin uploads. On a single server this persists in
 * ./storage/uploads; swap this module for S3/R2 when deploying to serverless.
 */
export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024;

function sniff(buf: Buffer) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(4, 12).toString().startsWith("ftypavi")) return "image/avif";
  return null;
}

export async function saveImage(file: File): Promise<{ url: string } | { error: string }> {
  if (!file || file.size === 0) return { error: "Choose an image first." };
  if (file.size > MAX_BYTES) return { error: "Images must be 5 MB or smaller." };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) return { error: "Upload a JPEG, PNG, WebP or AVIF image." };
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${TYPES[type]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return { url: `/media/${name}` };
}
