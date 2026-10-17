import { db } from "@/lib/db";
import { can, getCurrentUser } from "@/server/auth";
import { qrPng, qrSvg, qrTargetUrl } from "@/server/qr";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: RouteContext<"/api/admin/qr/[id]">) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "qr")) return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const qr = await db.qrCode.findUnique({ where: { id } });
  if (!qr) return new Response("Not found", { status: 404 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "png" ? "png" : "svg";
  const download = url.searchParams.has("download");
  const target = qrTargetUrl(qr.path);
  const file = `istanbul-hostel-qr-${qr.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format}`;
  const headers: Record<string, string> = { "Cache-Control": "private, no-store" };
  if (download) headers["Content-Disposition"] = `attachment; filename="${file}"`;

  if (format === "png") {
    const buf = await qrPng(target);
    return new Response(new Uint8Array(buf), { headers: { ...headers, "Content-Type": "image/png" } });
  }
  return new Response(await qrSvg(target), { headers: { ...headers, "Content-Type": "image/svg+xml" } });
}
