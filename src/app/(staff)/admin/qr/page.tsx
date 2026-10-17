import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { DeleteQr, GenerateRoomQrsButton, NewQrButton } from "@/components/admin/qr-tools";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { getProperty } from "@/server/queries";
import { qrSvg, qrTargetUrl } from "@/server/qr";

export const metadata = { title: "QR Code Generator" };

export default async function QrPage() {
  await requirePermission("qr");
  const property = await getProperty();
  const [codes, rooms] = await Promise.all([
    db.qrCode.findMany({ where: { propertyId: property.id }, orderBy: [{ roomId: { sort: "asc", nulls: "first" } }, { label: "asc" }], include: { room: { select: { number: true } } } }),
    db.room.findMany({ where: { propertyId: property.id }, orderBy: { number: "asc" }, select: { id: true, number: true } }),
  ]);
  const svgs = await Promise.all(codes.map((c) => qrSvg(qrTargetUrl(c.path))));

  return (
    <>
      <AdminHeader
        title="QR Code Generator"
        description="Print a code for every room and the reception desk. Scanning opens the guest guide in the guest's language."
        actions={
          <>
            <GenerateRoomQrsButton />
            <Button asChild variant="secondary">
              <Link href="/admin/qr/print" target="_blank">
                <Printer aria-hidden /> Print sheet
              </Link>
            </Button>
            <NewQrButton rooms={rooms} />
          </>
        }
      />
      <p className="mb-4 text-[13px] text-slate">
        Codes point to <span className="font-mono">{qrTargetUrl("/guest").replace("?src=qr", "")}</span>. Set <span className="font-mono">APP_URL</span> to your public domain before printing.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {codes.map((c, i) => (
          <Panel key={c.id} bodyClassName="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[15px] font-semibold">{c.label}</p>
                <p className="font-mono text-[12px] text-slate">{c.path}</p>
              </div>
              <DeleteQr id={c.id} label={c.label} />
            </div>
            <div className="mx-auto my-3 w-40 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svgs[i]! }} />
            <p className="text-center text-[12px] text-mist">
              {c.scans} scan{c.scans === 1 ? "" : "s"}
              {c.lastScanAt ? ` · last ${formatDateTime(c.lastScanAt)}` : ""}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href={`/api/admin/qr/${c.id}?format=png&download`} download>
                  <Download aria-hidden /> PNG
                </a>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <a href={`/api/admin/qr/${c.id}?format=svg&download`} download>
                  <Download aria-hidden /> SVG
                </a>
              </Button>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
