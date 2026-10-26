import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { StaffAppShell } from "@/components/staff/app-shell";
import { StaffLangProvider, StaffLangSwitch } from "@/components/staff/staff-lang";
import { getStaffText } from "@/server/staff-lang";
import { initials } from "@/lib/utils";
import { logout } from "@/server/actions/auth";
import { can, requirePermission } from "@/server/auth";

export const metadata: Metadata = {
  title: "Staff",
  manifest: "/hk/manifest.webmanifest",
  applicationName: "Hostel Staff",
  appleWebApp: { capable: true, title: "Hostel Staff", statusBarStyle: "black-translucent" },
  icons: { icon: "/hk/icon.svg", apple: "/hk/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#1d4fc4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("staffApp");
  const { lang, t } = await getStaffText();
  return (
    <StaffLangProvider lang={lang}>
    <div className="min-h-dvh" lang={lang}>
      <header className="sticky top-0 z-30 bg-cobalt pt-[env(safe-area-inset-top)] text-paper shadow-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/staff" className="flex items-center gap-2">
            <LogoMark className="size-6 text-paper" />
            <span className="text-[16px] font-semibold tracking-[-0.01em]">{can(user.role, "reservations") ? t.appStaff : t.appHousekeeping}</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <StaffLangSwitch lang={lang} />
            {can(user.role, "overview") ? (
              <Link href="/admin" className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-paper/85 hover:bg-white/10 hover:text-paper">
                Admin
              </Link>
            ) : null}
            <span
              aria-label={`${user.name}, ${t.role[user.role]}`}
              className="flex size-8 items-center justify-center rounded-full bg-white/15 text-[12px] font-semibold"
            >
              {initials(user.name)}
            </span>
            <form action={logout}>
              <button type="submit" aria-label={t.signOut} className="rounded-md p-2 text-paper/80 hover:bg-white/10 hover:text-paper">
                <LogOut className="size-[18px]" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </header>
      <StaffAppShell />
      <main className="mx-auto max-w-3xl px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-5">{children}</main>
    </div>
    </StaffLangProvider>
  );
}
