import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { fontVariables } from "@/lib/fonts";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import "../globals.css";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: { default: t.meta.title, template: "%s · Istanbul Hostel" },
    description: t.meta.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: "website",
      siteName: "Istanbul Hostel",
      title: t.meta.title,
      description: t.meta.description,
      images: ["/images/hero-istanbul.jpg"],
      locale,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1f3c7a",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <html lang={locale} className={fontVariables}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
        <Toaster position="top-center" toastOptions={{ className: "font-sans" }} />
      </body>
    </html>
  );
}
