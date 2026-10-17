import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { ExperienceToggle, RequestStatusButtons } from "@/components/admin/request-status";
import { AdminHeader, DemoTag, Empty, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { propertyToday } from "@/lib/dates";
import { pick } from "@/i18n/config";
import { RES_STATUS } from "@/lib/status";
import { cn, formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { getProperty } from "@/server/queries";

export const metadata = { title: "Tours & Activities" };

export default async function ExperiencesAdmin({ searchParams }: PageProps<"/admin/experiences">) {
  await requirePermission("experiences");
  const sp = await searchParams;
  const show = sp.show === "all" ? "all" : "open";
  const property = await getProperty();
  const today = propertyToday();
  const reqWhere = show === "all" ? {} : { status: { in: ["PENDING", "CONFIRMED"] as ("PENDING" | "CONFIRMED")[] } };
  const [experiences, bookings, transfers] = await Promise.all([
    db.experience.findMany({
      where: { propertyId: property.id },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { bookings: { where: { status: "PENDING" } } } } },
    }),
    db.experienceBooking.findMany({
      where: { ...reqWhere, ...(show === "all" ? {} : { date: { gte: today } }) },
      orderBy: [{ status: "asc" }, { date: "asc" }],
      take: 100,
      include: { experience: { select: { title: true } } },
    }),
    db.transferRequest.findMany({ where: reqWhere, orderBy: { arrivalAt: "asc" }, take: 50 }),
  ]);

  return (
    <>
      <AdminHeader
        title="Tours & Activities"
        description="Experiences shown on the website and guest guide, and the requests guests send."
        actions={
          <Button asChild>
            <Link href="/admin/experiences/new">
              <Plus aria-hidden /> New experience
            </Link>
          </Button>
        }
      />
      <Panel title="Experiences" bodyClassName="p-0">
        <ul className="divide-y divide-line-soft">
          {experiences.map((e) => (
            <li key={e.id} className={cn("flex flex-wrap items-center gap-4 px-5 py-3", !e.isActive && "opacity-60")}>
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-limestone">
                <Image src={e.image} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-48 flex-1">
                <p className="font-medium">
                  {pick(e.title, "en")} {e._count.bookings ? <Badge tone="saffron">{e._count.bookings} pending</Badge> : null}
                </p>
                <p className="text-[13px] text-slate">
                  {formatMoney(Number(e.price))} {e.priceUnit === "GROUP" ? "per group" : "per person"} · {e.durationMinutes} min · max {e.maxParticipants}
                </p>
              </div>
              <ExperienceToggle id={e.id} isActive={e.isActive} />
              <Button asChild size="sm" variant="ghost">
                <Link href={`/admin/experiences/${e.id}`}>
                  <Pencil aria-hidden /> Edit
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mb-3 mt-8 flex items-center gap-2">
        <h2 className="text-[17px] font-semibold">Requests</h2>
        <div className="ml-auto flex gap-1.5 text-[13px]">
          <Link href="/admin/experiences" className={cn("rounded-full border px-3 py-1", show === "open" ? "border-ink bg-ink text-paper" : "border-line bg-paper")}>
            Upcoming & open
          </Link>
          <Link href="/admin/experiences?show=all" className={cn("rounded-full border px-3 py-1", show === "all" ? "border-ink bg-ink text-paper" : "border-line bg-paper")}>
            All history
          </Link>
        </div>
      </div>
      <Panel title="Tour requests" bodyClassName="p-0">
        {bookings.length ? (
          <Table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Experience</th>
                <th>Date</th>
                <th>Guest</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th className="w-px" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="font-mono text-[13px]">
                    {b.reference} {b.isDemo ? <DemoTag /> : null}
                  </td>
                  <td>
                    {pick(b.experience.title, "en")}
                    <span className="block text-[12.5px] text-slate">
                      {b.participants} {b.participants === 1 ? "person" : "people"} · via {b.source === "GUEST_PORTAL" ? "guest guide" : "website"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(b.date, "en", { weekday: "short", year: undefined })}</td>
                  <td>
                    <span className="block">{b.name}</span>
                    <span className="text-[12.5px] text-slate">
                      {b.email}
                      {b.roomNumber ? ` · room ${b.roomNumber}` : ""}
                    </span>
                    {b.notes ? <span className="block text-[12.5px] italic text-slate">“{b.notes}”</span> : null}
                  </td>
                  <td className="text-right">{formatMoney(Number(b.totalPrice))}</td>
                  <td>
                    <Badge tone={RES_STATUS[b.status]!.tone} dot>
                      {RES_STATUS[b.status]!.label}
                    </Badge>
                  </td>
                  <td>
                    <RequestStatusButtons id={b.id} status={b.status} kind="tour" reference={b.reference} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Empty>No tour requests.</Empty>
        )}
      </Panel>

      <Panel title="Airport transfer requests" className="mt-6" bodyClassName="p-0">
        {transfers.length ? (
          <Table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Arrival</th>
                <th>Flight</th>
                <th>Guest</th>
                <th>Status</th>
                <th className="w-px" />
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-[13px]">
                    {t.reference} {t.isDemo ? <DemoTag /> : null}
                  </td>
                  <td className="whitespace-nowrap">
                    {formatDateTime(t.arrivalAt)}
                    <span className="block text-[12.5px] text-slate">
                      {t.airport} · {t.passengers} pax
                    </span>
                  </td>
                  <td className="font-mono">{t.flightNumber}</td>
                  <td>
                    <span className="block">{t.name}</span>
                    <span className="text-[12.5px] text-slate">
                      {t.phone} · {t.email}
                    </span>
                  </td>
                  <td>
                    <Badge tone={RES_STATUS[t.status]!.tone} dot>
                      {RES_STATUS[t.status]!.label}
                    </Badge>
                  </td>
                  <td>
                    <RequestStatusButtons id={t.id} status={t.status} kind="transfer" reference={t.reference} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Empty>No transfer requests.</Empty>
        )}
      </Panel>
    </>
  );
}
