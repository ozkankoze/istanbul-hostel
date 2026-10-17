import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ADMIN_NAV } from "@/components/admin/nav";
import { db } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/status";
import { can, getCurrentUser } from "@/server/auth";

export const metadata = { title: { default: "Admin", template: "%s · Admin · Istanbul Hostel" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  const [pendingRes, pendingTours, pendingTransfers, openRequests] = await Promise.all([
    db.reservation.count({ where: { status: "PENDING" } }),
    db.experienceBooking.count({ where: { status: "PENDING" } }),
    db.transferRequest.count({ where: { status: "PENDING" } }),
    db.serviceRequest.count({ where: { status: "OPEN" } }),
  ]);
  const badges: Record<string, number> = {
    "/admin/reservations": pendingRes,
    "/admin/experiences": pendingTours + pendingTransfers,
    "/admin/guide": openRequests,
  };
  const items = ADMIN_NAV.filter((n) => can(user.role, n.permission)).map((n) => ({
    href: n.href,
    label: n.label,
    badge: badges[n.href] || undefined,
  }));

  return (
    <div className="min-h-dvh bg-limestone">
      <AdminSidebar items={items} user={{ name: user.name, role: ROLE_LABEL[user.role] ?? user.role }} />
      <div className="lg:pl-60 print:pl-0">
        <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-8 md:py-8 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
