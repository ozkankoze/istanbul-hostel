import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LogoMark } from "@/components/brand/logo";
import { GuestBottomNav } from "@/components/guest/bottom-nav";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { href } from "@/lib/links";

export async function generateMetadata({ params }: LayoutProps<"/[locale]/guest">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: t.guest.title,
    description: t.guest.welcomeSub,
    robots: { index: false },
    appleWebApp: { capable: true, title: "Istanbul Hostel", statusBarStyle: "default" },
    manifest: "/manifest.webmanifest",
  };
}

export default async function GuestLayout({ children, params }: LayoutProps<"/[locale]/guest">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <div className="min-h-dvh bg-limestone">
      <header className="sticky top-0 z-30 border-b border-line-soft bg-limestone/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href={href(locale)} className="flex items-center gap-2" aria-label={t.guest.openWebsite}>
            <LogoMark className="size-6 text-cobalt" />
            <span className="font-display text-[17px] leading-none">{t.guest.title}</span>
          </Link>
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 pb-28 pt-5">{children}</main>
      <Suspense fallback={null}>
        <GuestBottomNav />
      </Suspense>
    </div>
  );
}
