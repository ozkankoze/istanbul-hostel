import { DemoBanner } from "@/components/site/demo-banner";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { getProperty } from "@/server/queries";

export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const property = await getProperty();
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-paper focus:px-4 focus:py-2 focus:text-ink focus:shadow-raise"
      >
        {t.common.skipToContent}
      </a>
      {property.isDemo ? <DemoBanner text={t.common.demoBanner} /> : null}
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
