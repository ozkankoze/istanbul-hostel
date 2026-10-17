import Link from "next/link";
import { notFound } from "next/navigation";
import { GuestNotes } from "@/components/admin/guest-notes";
import { AdminHeader, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { pick } from "@/i18n/config";
import { RES_STATUS } from "@/lib/status";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { requirePermission } from "@/server/auth";

export default async function GuestDetail({ params }: PageProps<"/admin/guests/[id]">) {
  await requirePermission("guests");
  const { id } = await params;
  const g = await db.guest.findUnique({
    where: { id },
    include: { reservations: { orderBy: { checkIn: "desc" }, include: { roomType: { select: { name: true } } } } },
  });
  if (!g) notFound();
  return (
    <>
      <AdminHeader back={{ href: "/admin/guests", label: "Guests" }} title={`${g.firstName} ${g.lastName}`} description={`Guest since ${formatDateTime(g.createdAt)}`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Contact">
          <dl className="space-y-3 text-[14px]">
            <div>
              <dt className="text-[12.5px] text-slate">Email</dt>
              <dd>
                <a className="text-cobalt hover:underline" href={`mailto:${g.email}`}>
                  {g.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-slate">Phone</dt>
              <dd>{g.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-slate">Country</dt>
              <dd>{g.country ?? "—"}</dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-line-soft pt-4">
            <p className="mb-2 text-[13px] font-medium">Team notes</p>
            <GuestNotes id={g.id} initial={g.notes ?? ""} />
          </div>
        </Panel>
        <Panel title={`Reservations (${g.reservations.length})`} className="lg:col-span-2" bodyClassName="p-0">
          <Table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Room</th>
                <th>Stay</th>
                <th>Status</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {g.reservations.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/reservations/${r.id}`} className="font-mono text-[13px] text-cobalt hover:underline">
                      {r.reference}
                    </Link>
                  </td>
                  <td>{pick(r.roomType.name, "en")}</td>
                  <td>
                    {formatDate(r.checkIn, "en", { year: undefined })} – {formatDate(r.checkOut)}
                  </td>
                  <td>
                    <Badge tone={RES_STATUS[r.status]!.tone} dot>
                      {RES_STATUS[r.status]!.label}
                    </Badge>
                  </td>
                  <td className="text-right">{formatMoney(Number(r.totalPrice))}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
