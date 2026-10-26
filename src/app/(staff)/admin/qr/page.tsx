import Link from "next/link";
import { Download, ExternalLink, Printer } from "lucide-react";
import { DeleteQr, NewQrButton } from "@/components/admin/qr-tools";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { getProperty } from "@/server/queries";
import { qrSvg, qrTargetUrl } from "@/server/qr";
import { getReceptionQr } from "@/server/qr-codes";

export const metadata = { title: "QR Code" };

export default async function QrPage() {
  await requirePermission("qr");
  const property = await getProperty();
  const reception = await getReceptionQr(property.id);
  const extras = await db.qrCode.findMany({
    where: { propertyId: property.id, roomId: null, id: { not: reception.id } },
    orderBy: { createdAt: "asc" },
  });
  const [mainSvg, ...extraSvgs] = await Promise.all([reception, ...extras].map((c) => qrSvg(qrTargetUrl(c.path))));
  const target = qrTargetUrl("/guest").replace("?src=qr", "");
  const staffUrl = qrTargetUrl("/staff").replace("?src=qr", "");
  const staffSvg = await qrSvg(staffUrl);

  return (
    <>
      <AdminHeader
        title="QR Code"
        description="One code at reception opens the guest guide: Wi-Fi, breakfast, check-out, house rules, tours and room services — in the guest's language."
      />
      <Panel bodyClassName="p-0">
        <div className="grid gap-8 p-6 md:grid-cols-[280px_1fr] md:p-8">
          <div className="mx-auto w-full max-w-[280px] rounded-lg border border-line bg-white p-5 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: mainSvg! }} />
          <div className="flex flex-col">
            <h2 className="text-[20px] font-semibold">Reception code</h2>
            <p className="mt-1 text-[14px] text-slate">
              Opens <span className="font-mono">{target}</span>
            </p>
            <p className="mt-4 text-[14px] text-slate">
              {reception.scans} scan{reception.scans === 1 ? "" : "s"}
              {reception.lastScanAt ? ` · last ${formatDateTime(reception.lastScanAt)}` : ""}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/admin/qr/print" target="_blank">
                  <Printer aria-hidden /> Print reception poster
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <a href={`/api/admin/qr/${reception.id}?format=png&download`} download>
                  <Download aria-hidden /> PNG
                </a>
              </Button>
              <Button asChild variant="secondary">
                <a href={`/api/admin/qr/${reception.id}?format=svg&download`} download>
                  <Download aria-hidden /> SVG
                </a>
              </Button>
              <Button asChild variant="ghost">
                <a href="/guest" target="_blank">
                  Preview guide <ExternalLink aria-hidden />
                </a>
              </Button>
            </div>
            <p className="mt-auto pt-6 text-[12.5px] text-mist">
              The code contains your <span className="font-mono">APP_URL</span>. Set it to your public domain before printing.
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="mt-6" title="Staff app" description="For your team only. Scanning this does not give access: everyone signs in with their own account. Housekeepers see rooms and tasks; reception also sees bookings.">
        <div className="grid gap-6 md:grid-cols-[160px_1fr]">
          <div className="mx-auto w-full max-w-[160px] rounded-lg border border-line bg-white p-3 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: staffSvg }} />
          <div className="text-[14px]">
            <p className="text-slate">
              Opens <span className="font-mono">{staffUrl}</span>. Show this code to a new team member on their first day.
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5">
              <li>Scan the code with the phone camera and sign in.</li>
              <li>
                Tap <strong>Install</strong> on the banner, or open the browser menu (⋮) and choose <strong>Install app</strong> / <strong>Add to Home screen</strong>.
              </li>
              <li>The app icon appears on the home screen and opens full screen, like any other app.</li>
            </ol>
            <p className="mt-3 text-[12.5px] text-mist">No app store needed. Updates arrive automatically; nothing to reinstall.</p>
          </div>
        </div>
      </Panel>

      <Panel className="mt-6" title="Extra codes" description="Optional links for other spots, such as a tours card on the breakfast table." actions={<NewQrButton />}>
        {extras.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {extras.map((c, i) => (
              <div key={c.id} className="rounded-lg border border-line-soft p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-semibold">{c.label}</p>
                    <p className="font-mono text-[12px] text-slate">{c.path}</p>
                  </div>
                  <DeleteQr id={c.id} label={c.label} />
                </div>
                <div className="mx-auto my-3 w-32 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: extraSvgs[i]! }} />
                <div className="grid grid-cols-2 gap-2">
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
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-slate">No extra codes. Most hostels only need the reception code.</p>
        )}
      </Panel>
    </>
  );
}
