import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "@/components/admin/print-button";
import { requirePermission } from "@/server/auth";
import { getGuide, getProperty } from "@/server/queries";
import { qrSvg, qrTargetUrl } from "@/server/qr";
import { getReceptionQr } from "@/server/qr-codes";

export const metadata = { title: "Reception poster" };

export default async function PrintPoster() {
  await requirePermission("qr");
  const property = await getProperty();
  const [qr, guide] = await Promise.all([getReceptionQr(property.id), getGuide()]);
  const svg = await qrSvg(qrTargetUrl(qr.path));

  return (
    <div className="min-h-dvh bg-limestone py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <p className="text-[14px] text-slate">A4 poster for the reception desk or a table stand.</p>
        <PrintButton />
      </div>
      <article className="mx-auto flex h-[297mm] w-[210mm] flex-col items-center bg-white px-[18mm] py-[20mm] text-center shadow-raise print:shadow-none">
        <div className="flex items-center gap-3 text-cobalt">
          <LogoMark className="size-11" />
          <span className="font-display text-[34px] text-ink">{property.name}</span>
        </div>
        <h1 className="mt-[14mm] font-display text-[46px] leading-[1.08]">Welcome!</h1>
        <p className="mt-3 text-[22px] leading-snug text-ink-soft">
          Scan for Wi-Fi, breakfast, check-out, tours &amp; help
        </p>
        <div className="mt-[12mm] w-[110mm] rounded-2xl border-[3px] border-ink p-[7mm] [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="mt-[12mm] space-y-1.5 text-[17px] text-slate">
          <p>Dobrodošli! Skenirajte za Wi-Fi, doručak i pomoć.</p>
        </div>
        {guide.config ? (
          <p className="mt-auto rounded-full bg-limestone px-6 py-2.5 text-[16px]">
            Wi-Fi: <span className="font-semibold">{guide.config.wifiNetwork}</span>
          </p>
        ) : null}
      </article>
    </div>
  );
}
