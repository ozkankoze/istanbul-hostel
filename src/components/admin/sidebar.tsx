"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn, initials } from "@/lib/utils";
import { logout } from "@/server/actions/auth";
import { ADMIN_NAV } from "./nav";

type Item = { href: string; label: string; badge?: number };

function NavList({ items, onNavigate }: { items: Item[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const meta = ADMIN_NAV.find((n) => n.href === item.href)!;
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-[14px] transition-colors",
                active ? "bg-paper/10 font-medium text-paper" : "text-paper/65 hover:bg-paper/5 hover:text-paper",
              )}
            >
              <meta.icon aria-hidden className="size-[18px] shrink-0" strokeWidth={1.7} />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-saffron px-1.5 text-[11px] font-semibold leading-5 text-ink">{item.badge}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarBody({ items, user, onNavigate }: { items: Item[]; user: { name: string; role: string }; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-ink px-3 py-4 text-paper">
      <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2" onClick={onNavigate}>
        <LogoMark className="size-7 text-paper" />
        <span className="leading-tight">
          <span className="block font-display text-[17px]">Istanbul Hostel</span>
          <span className="block text-[11.5px] text-paper/50">Management</span>
        </span>
      </Link>
      <nav aria-label="Admin" className="mt-6 flex-1 overflow-y-auto">
        <NavList items={items} onNavigate={onNavigate} />
      </nav>
      <div className="mt-4 space-y-1 border-t border-paper/10 pt-4">
        <Link href="/staff" className="flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] text-paper/65 hover:bg-paper/5 hover:text-paper">
          Housekeeping app
        </Link>
        <a href="/en" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] text-paper/65 hover:bg-paper/5 hover:text-paper">
          View website <ExternalLink aria-hidden className="size-3.5" />
        </a>
        <div className="flex items-center gap-3 px-3 pt-3">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-paper/10 text-[12px] font-semibold">
            {initials(user.name)}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13.5px] font-medium">{user.name}</span>
            <span className="block text-[11.5px] text-paper/50">{user.role}</span>
          </span>
          <form action={logout}>
            <button type="submit" aria-label="Sign out" className="rounded-md p-1.5 text-paper/60 hover:bg-paper/10 hover:text-paper cursor-pointer">
              <LogOut aria-hidden className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar({ items, user }: { items: Item[]; user: { name: string; role: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block print:!hidden">
        <SidebarBody items={items} user={user} />
      </aside>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ink px-4 text-paper lg:hidden print:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <LogoMark className="size-6 text-paper" />
          <span className="font-display text-[16px]">Istanbul Hostel</span>
        </Link>
        <Button variant="ghost" size="icon" className="text-paper hover:bg-paper/10" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu aria-hidden className="size-5" />
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-ink p-0 [&>button]:text-paper">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <SheetDescription className="sr-only">Navigate the dashboard</SheetDescription>
          <SidebarBody items={items} user={user} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
