"use client";

import { usePathname } from "next/navigation";
import { Compass, ConciergeBell, House, Ticket } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { GuestLink } from "./guest-link";

export function GuestBottomNav() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const items = [
    { path: "/", label: dict.guest.title, icon: House },
    { path: "/requests", label: dict.guest.sections.requests, icon: ConciergeBell },
    { path: "/tours", label: dict.nav.experiences, icon: Ticket },
    { path: "/explore", label: dict.guest.sections.explore, icon: Compass },
  ];
  return (
    <nav
      aria-label={dict.guest.title}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map((it) => {
          const full = `/${locale}/guest${it.path === "/" ? "" : it.path}`;
          const active = it.path === "/" ? pathname === full : pathname.startsWith(full);
          return (
            <li key={it.path}>
              <GuestLink
                path={it.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] font-medium leading-tight transition-colors",
                  active ? "text-cobalt" : "text-slate hover:text-ink",
                )}
              >
                <it.icon aria-hidden className="size-[22px]" strokeWidth={active ? 2 : 1.6} />
                <span className="line-clamp-1 text-center">{it.label}</span>
              </GuestLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
