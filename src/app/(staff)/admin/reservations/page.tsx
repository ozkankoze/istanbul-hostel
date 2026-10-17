import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { NewReservationButton } from "@/components/admin/new-reservation";
import { ReservationActions } from "@/components/admin/reservation-actions";
import { AdminHeader, DemoTag, Empty, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { db } from "@/lib/db";
import { addDays, propertyToday, toISODate } from "@/lib/dates";
import { pick } from "@/i18n/config";
import { RES_STATUS } from "@/lib/status";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { getRoomTypes } from "@/server/queries";

export const metadata = { title: "Reservations" };
const PAGE_SIZE = 20;
const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "DECLINED", "CANCELLED"] as const;
const VIEWS = { all: "All", upcoming: "Upcoming", arrivals: "Arriving today", departures: "Departing today", inhouse: "In house" } as const;

export default async function ReservationsPage({ searchParams }: PageProps<"/admin/reservations">) {
  await requirePermission("reservations");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" && (STATUSES as readonly string[]).includes(sp.status) ? (sp.status as (typeof STATUSES)[number]) : null;
  const view = typeof sp.view === "string" && sp.view in VIEWS ? (sp.view as keyof typeof VIEWS) : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const today = propertyToday();

  const where: Prisma.ReservationWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { guest: { firstName: { contains: q, mode: "insensitive" } } },
      { guest: { lastName: { contains: q, mode: "insensitive" } } },
      { guest: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (view === "upcoming") where.checkIn = { gte: today };
  if (view === "arrivals") Object.assign(where, { checkIn: today, status: status ?? "CONFIRMED" });
  if (view === "departures") Object.assign(where, { checkOut: today, status: status ?? "CONFIRMED" });
  if (view === "inhouse") Object.assign(where, { checkIn: { lte: today }, checkOut: { gt: today }, status: "CONFIRMED" });

  const [rows, total, counts, roomTypes] = await Promise.all([
    db.reservation.findMany({
      where,
      orderBy: view === "all" ? [{ createdAt: "desc" }] : [{ checkIn: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        guest: { select: { firstName: true, lastName: true, email: true } },
        roomType: { select: { name: true } },
        allocations: { select: { room: { select: { number: true } } } },
      },
    }),
    db.reservation.count({ where }),
    db.reservation.groupBy({ by: ["status"], _count: true }),
    getRoomTypes(),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { q: q || null, status, view: view === "all" ? null : view, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/reservations${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminHeader
        title="Reservations"
        description="Website requests and bookings entered by reception. Confirming a request assigns real beds and blocks them for other bookings."
        actions={<NewReservationButton roomTypes={roomTypes.map((r) => ({ id: r.id, name: pick(r.name, "en") }))} today={toISODate(today)} />}
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link href={qs({ status: null })} className={cn("rounded-full border px-3 py-1.5 text-[13px]", !status ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-soft")}>
          All statuses
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={qs({ status: s, page: null })}
            className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px]", status === s ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-soft")}
          >
            {RES_STATUS[s]!.label}
            <span className={status === s ? "text-paper/60" : "text-mist"}>{countOf(s)}</span>
          </Link>
        ))}
      </div>

      <Panel bodyClassName="p-0">
        <form className="flex flex-wrap gap-2 border-b border-line-soft p-3" action="/admin/reservations">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <div className="relative min-w-56 flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
            <Input name="q" defaultValue={q} placeholder="Search by reference, name or email" className="h-10 pl-9" aria-label="Search reservations" />
          </div>
          <div className="w-44">
            <Select name="view" defaultValue={view} className="h-10" aria-label="Date view">
              {Object.entries(VIEWS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="dark" className="h-10">
            Search
          </Button>
          {q || view !== "all" ? (
            <Button asChild variant="ghost" className="h-10">
              <Link href={status ? `/admin/reservations?status=${status}` : "/admin/reservations"}>Clear</Link>
            </Button>
          ) : null}
        </form>
        {rows.length ? (
          <Table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Guest</th>
                <th>Room</th>
                <th>Stay</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th className="w-px">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = RES_STATUS[r.status]!;
                const roomsAssigned = [...new Set(r.allocations.map((a) => a.room.number))];
                return (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/admin/reservations/${r.id}`} className="font-mono text-[13px] font-medium text-cobalt hover:underline">
                        {r.reference}
                      </Link>
                      {r.isDemo ? <span className="ml-1.5"><DemoTag /></span> : null}
                    </td>
                    <td>
                      <span className="block font-medium">
                        {r.guest.firstName} {r.guest.lastName}
                      </span>
                      <span className="text-[12.5px] text-slate">{r.guest.email}</span>
                    </td>
                    <td>
                      <span className="block">{pick(r.roomType.name, "en")}</span>
                      <span className="text-[12.5px] text-slate">
                        {r.guests} guest{r.guests > 1 ? "s" : ""}
                        {roomsAssigned.length ? ` · Room ${roomsAssigned.join(", ")}` : ""}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {formatDate(r.checkIn, "en", { year: undefined })} – {formatDate(r.checkOut, "en")}
                      {r.checkIn.getTime() === today.getTime() ? <Badge tone="cobalt" className="ml-1.5">today</Badge> : null}
                    </td>
                    <td className="text-right font-medium tabular-nums">{formatMoney(Number(r.totalPrice))}</td>
                    <td>
                      <Badge tone={s.tone} dot>
                        {s.label}
                      </Badge>
                    </td>
                    <td>
                      <ReservationActions id={r.id} status={r.status} reference={r.reference} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <Empty>No reservations match. {q ? "Try a different search." : ""}</Empty>
        )}
        {pages > 1 ? (
          <div className="flex items-center justify-between border-t border-line-soft px-4 py-3 text-[13px] text-slate">
            <span>
              Page {page} of {pages} · {total} reservations
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href={qs({ page: String(page - 1) })}>Previous</Link>
                </Button>
              ) : null}
              {page < pages ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href={qs({ page: String(page + 1) })}>Next</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Panel>
      <p className="mt-3 text-[12.5px] text-mist">Times are Istanbul time. Today is {formatDate(today, "en", { weekday: "long" })}; next week ends {formatDate(addDays(today, 7), "en")}.</p>
    </>
  );
}
