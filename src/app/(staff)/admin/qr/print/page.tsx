import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "@/components/admin/print-button";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { getGuide, getProperty } from "@/server/queries";
import { qrSvg, qrTargetUrl } from "@/server/qr";

export const metadata = { title: "Print QR codes" };

export default async function PrintQr() {
  await requirePermission("qr");
  const property = await getProperty();
  const [codes, guide] = await Promise.all([
    db.qrCode.findMany({ where: { propertyId: property.id }, orderBy: [{ roomId: { sort: "asc", nulls: "first" } }, { label: "asc" }] }),
    getGuide(),
  ]);
  const svgs = await Promise.all(codes.map((c) => qrSvg(qrTargetUrl(c.path))));
  return (
    <div className="bg-white p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-[14px] text-slate">A4, two cards per row. Cut along the light lines.</p>
        <PrintButton />
      </div>
      <div className="grid grid-cols-2 gap-0 print:gap-0">
        {codes.map((c, i) => (
          <div key={c.id} className="flex break-inside-avoid items-center gap-5 border border-dashed border-line p-6">
            <div className="w-36 shrink-0 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svgs[i]! }} />
            <div>
              <div className="flex items-center gap-2 text-cobalt">
                <LogoMark className="size-5" />
                <span className="font-display text-[16px] text-ink">{property.name}</span>
              </div>
              <p className="mt-3 font-display text-[24px] leading-tight">{c.label}</p>
              <p className="mt-2 text-[12.5px] leading-snug text-ink-soft">
                Scan for Wi-Fi, breakfast, tours & help
                <br />
                Wi-Fi · Doručak · Kahvaltı · Turlar
              </p>
              {guide.config ? <p className="mt-2 font-mono text-[11px] text-slate">Wi-Fi: {guide.config.wifiNetwork}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
