"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { useI18n } from "@/i18n/client";
import { href } from "@/lib/links";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";

export function SiteHeader() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const isHome = pathname === `/${locale}`;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overlay = isHome && !scrolled;
  const links = [
    { path: "/", label: dict.nav.home },
    { path: "/rooms", label: dict.nav.rooms },
    { path: "/experiences", label: dict.nav.experiences },
    { path: "/explore", label: dict.nav.explore },
    { path: "/about", label: dict.nav.about },
    { path: "/contact", label: dict.nav.contact },
  ];
  const isActive = (path: string) =>
    path === "/" ? pathname === `/${locale}` : pathname.startsWith(href(locale, path));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,color] duration-300",
        isHome && "-mb-[72px]",
        overlay
          ? "border-b border-transparent bg-transparent text-paper"
          : "border-b border-line-soft bg-limestone/92 text-ink backdrop-blur-md supports-[backdrop-filter]:bg-limestone/80",
      )}
    >
      <div className="container-page flex h-[72px] items-center justify-between gap-6">
        <Link href={href(locale)} aria-label="Istanbul Hostel — home" className="shrink-0">
          <Logo tone={overlay ? "light" : "ink"} />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {links.slice(1).map((l) => (
              <li key={l.path}>
                <Link
                  href={href(locale, l.path)}
                  aria-current={isActive(l.path) ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-[14.5px] font-medium transition-colors",
                    overlay ? "text-paper/85 hover:text-paper" : "text-ink-soft hover:text-ink",
                    "aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-0.5 aria-[current=page]:after:h-px aria-[current=page]:after:bg-current",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <LanguageSwitcher tone={overlay ? "light" : "ink"} className="hidden sm:flex" />
          </Suspense>
          <Button asChild variant={overlay ? "light" : "primary"} size="md" className="hidden sm:inline-flex">
            <Link href={href(locale, "/book")}>{dict.common.bookYourStay}</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("lg:hidden", overlay && "text-paper hover:bg-paper/10")}>
                <Menu className="size-5" />
                <span className="sr-only">{dict.common.menu}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-6">
              <SheetTitle className="sr-only">{dict.common.menu}</SheetTitle>
              <SheetDescription className="sr-only">Istanbul Hostel</SheetDescription>
              <Logo />
              <nav aria-label="Mobile" className="mt-10 flex-1">
                <ul className="space-y-1">
                  {links.map((l) => (
                    <li key={l.path}>
                      <Link
                        href={href(locale, l.path)}
                        aria-current={isActive(l.path) ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className="block rounded-md py-2.5 font-display text-[26px] leading-tight text-ink aria-[current=page]:text-cobalt"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-4">
                    <Link href={href(locale, "/guest")} onClick={() => setOpen(false)} className="block py-2 text-[15px] text-slate hover:text-ink">
                      {dict.nav.guestGuide}
                    </Link>
                  </li>
                </ul>
              </nav>
              <div className="space-y-5 border-t border-line pt-5">
                <Suspense fallback={null}>
                  <LanguageSwitcher />
                </Suspense>
                <Button asChild size="lg" className="w-full">
                  <Link href={href(locale, "/book")} onClick={() => setOpen(false)}>
                    {dict.common.bookYourStay}
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
