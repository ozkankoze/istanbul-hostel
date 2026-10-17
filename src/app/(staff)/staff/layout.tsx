import Link from "next/link";
import { LogOut } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL } from "@/lib/status";
import { initials } from "@/lib/utils";
import { logout } from "@/server/actions/auth";
import { can, requirePermission } from "@/server/auth";

export const metadata = { title: "Housekeeping" };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("staffApp");
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/staff" className="flex items-center gap-2">
            <LogoMark className="size-6 text-cobalt" />
            <span className="text-[15px] font-semibold">Housekeeping</span>
          </Link>
          <div className="flex items-center gap-2">
            {can(user.role, "overview") ? (
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin">Admin</Link>
              </Button>
            ) : null}
            <span className="hidden text-right text-[12.5px] leading-tight sm:block">
              <span className="block font-medium">{user.name}</span>
              <span className="text-slate">{ROLE_LABEL[user.role]}</span>
            </span>
            <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-cobalt-soft text-[12px] font-semibold text-cobalt">
              {initials(user.name)}
            </span>
            <form action={logout}>
              <Button variant="ghost" size="icon-sm" type="submit" aria-label="Sign out">
                <LogOut aria-hidden />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">{children}</main>
    </div>
  );
}
