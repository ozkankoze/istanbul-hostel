import { SettingsForm } from "@/components/admin/content-forms";
import { AdminHeader, Panel, Table } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { getProperty, getSetting } from "@/server/queries";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePermission("settings");
  const p = await getProperty();
  const [maxNights, maxGuests, priceIST, priceSAW, audit] = await Promise.all([
    getSetting<number>("booking.maxNights", 30),
    getSetting<number>("booking.maxGuests", 8),
    getSetting<number>("transfer.priceIST", 45),
    getSetting<number>("transfer.priceSAW", 55),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 60, include: { user: { select: { name: true } } } }),
  ]);
  return (
    <>
      <AdminHeader title="Settings" description="Property details, booking rules and the audit trail." />
      <Panel>
        <SettingsForm
          s={{
            name: p.name,
            tagline: p.tagline,
            addressLine: p.addressLine,
            city: p.city,
            country: p.country,
            phone: p.phone,
            whatsapp: p.whatsapp,
            email: p.email,
            mapQuery: p.mapQuery,
            reviewUrl: p.reviewUrl ?? "",
            isDemo: p.isDemo,
            maxNights,
            maxGuests,
            priceIST,
            priceSAW,
          }}
        />
      </Panel>
      <Panel className="mt-6" title="Audit log" description="Important changes, newest first" bodyClassName="p-0">
        <Table>
          <thead>
            <tr>
              <th>When</th>
              <th>Who</th>
              <th>What</th>
              <th>Area</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((a) => (
              <tr key={a.id}>
                <td className="whitespace-nowrap text-[13px] text-slate">{formatDateTime(a.createdAt)}</td>
                <td className="whitespace-nowrap">{a.user?.name ?? "System"}</td>
                <td>{a.summary}</td>
                <td className="text-[13px] text-slate">{a.entity}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
