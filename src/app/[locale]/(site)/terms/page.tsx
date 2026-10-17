import { notFound } from "next/navigation";
import { LegalPage } from "@/components/site/legal-page";
import { terms } from "@/content/legal";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).legal.termsTitle };
}

export default async function Page({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return <LegalPage title={t.legal.termsTitle} doc={terms[locale]} t={t} locale={locale} />;
}
