import { notFound } from "next/navigation";
import { LegalPage } from "@/components/site/legal-page";
import { privacy } from "@/content/legal";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).legal.privacyTitle };
}

export default async function Page({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return <LegalPage title={t.legal.privacyTitle} doc={privacy[locale]} t={t} locale={locale} />;
}
