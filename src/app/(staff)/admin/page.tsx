import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { AdminHeader, Empty, Panel, Stat } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { addDays, propertyToday } from "@/lib/dates";
import { pick } from "@/i18n/config";
import { HK_STATUS, SR_TYPE } from "@/lib/status";
import { formatDate, formatDateTime, formatMoney, timeAgo } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { getRoomBoard } from "@/server/housekeeping";
import { getProperty } from "@/server/queries";

export const metadata = { title: "Overview" };

export default async function AdminOverview() {
  const user = await requirePermission("overview");
  const property = await getProperty();
  const today = propertyToday();
  const in7 = addDays(today, 7);

  const [board, pending, arrivals, departures, upcomingArrivals, openTasks, tourRequests, transferRequests, serviceRequests, recent, feedback] =
    await Promise.all([
      getRoomBoard(),
      db.reservation.findMany({
        where: { status: "PENDING" },
        orderBy: { checkIn: "asc" },
        take: 6,
        include: { guest: { select: { firstName: true, lastName: true } }, roomType: { select: { name: true } } },
      }),
      db.reservation.findMany({
        where: { status: "CONFIRMED", checkIn: today },
        include: { guest: { select: { firstName: true, lastName: true } }, roomType: { select: { name: true } }, allocations: { include: { room: { select: { number: true } } } } },
      }),
      db.reservation.findMany({
        where: { status: "CONFIRMED", checkOut: today },
        include: { guest: { select: { firstName: true, lastName: true } }, roomType: { select: { name: true } }, allocations: { include: { room: { select: { number: true } } } } },
      }),
      db.reservation.count({ where: { status: "CONFIRMED", checkIn: { gt: today, lte: in7 } } }),
      db.task.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      db.experienceBooking.count({ where: { status: "PENDING" } }),
      db.transferRequest.count({ where: { status: "PENDING" } }),
      db.serviceRequest.findMany({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { room: { select: { number: true } } },
      }),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }),
      db.feedback.aggregate({ _avg: { rating: true }, _count: true }),
    ]);

  const totalRooms = board.filter((r) => r.isActive).length;
  const occupied = board.filter((r) => r.occupancy === "OCCUPIED" || r.occupancy === "PARTIAL").length;
  const blocked = board.filter((r) => r.occupancy === "BLOCKED").length;
  const available = board.filter((r) => r.occupancy !== "OCCUPIED" && r.occupancy !== "BLOCKED").length;
  const bedsTotal = board.reduce((n, r) => n + r.capacity, 0);
  const bedsUsed = board.reduce((n, r) => n + r.occupiedUnits, 0);
  const hkCounts = Object.fromEntries(Object.keys(HK_STATUS).map((k) => [k, board.filter((r) => r.status === k).length]));
  const pendingCount = await db.reservation.count({ where: { status: "PENDING" } });

  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Istanbul" }).format(new Date()));
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <AdminHeader
        title={`${hello}, ${user.name.split(" ")[0]}`}
        description={`${formatDate(today, "en", { weekday: "long", month: "long" })} · ${property.name}`}
      />
      {property.isDemo ? (
        <p className="mb-6 flex items-start gap-2 rounded-md border border-saffron/40 bg-saffron-soft/50 px-4 py-2.5 text-[13.5px] text-[#6d4b0b]">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
          Demo mode — every number below is calculated live from the database, which holds sample guests, reservations and tasks.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total rooms" value={totalRooms} hint={`${bedsTotal} beds / units`} href="/admin/rooms" />
        <Stat label="Available tonight" value={available} hint={blocked ? `${blocked} blocked` : "rooms with free space"} href="/admin/housekeeping" />
        <Stat label="Occupied rooms" value={occupied} hint={`${bedsUsed} of ${bedsTotal} beds in use`} href="/admin/housekeeping" />
        <Stat label="Pending reservations" value={pendingCount} hint="waiting for confirmation" href="/admin/reservations?status=PENDING" tone={pendingCount ? "attention" : "default"} />
        <Stat label="Check-ins today" value={arrivals.length} hint={`${upcomingArrivals} more in the next 7 days`} href="/admin/reservations?view=arrivals" />
        <Stat label="Check-outs today" value={departures.length} href="/admin/reservations?view=departures" />
        <Stat label="Open housekeeping tasks" value={openTasks} hint={`${hkCounts.DIRTY ?? 0} rooms dirty`} href="/admin/tasks" />
        <Stat label="Pending tour & transfer requests" value={tourRequests + transferRequests} href="/admin/experiences" tone={tourRequests + transferRequests ? "attention" : "default"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Reservation requests"
          description="Newest requests waiting for a decision"
          actions={
            <Link href="/admin/reservations?status=PENDING" className="inline-flex items-center gap-1 text-[13px] font-medium text-cobalt">
              All requests <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          }
          bodyClassName="p-0"
        >
          {pending.length ? (
            <ul className="divide-y divide-line-soft">
              {pending.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/reservations/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-limestone/50">
                    <span className="w-28 font-mono text-[13px] text-slate">{r.reference}</span>
                    <span className="min-w-40 flex-1 text-[14.5px] font-medium">
                      {r.guest.firstName} {r.guest.lastName}
                    </span>
                    <span className="text-[13.5px] text-slate">{pick(r.roomType.name, "en")}</span>
                    <span className="text-[13.5px]">
                      {formatDate(r.checkIn, "en", { year: undefined })} → {formatDate(r.checkOut, "en", { year: undefined })}
                    </span>
                    <span className="w-20 text-right text-[14px] font-medium">{formatMoney(Number(r.totalPrice))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No requests waiting. Nice.</Empty>
          )}
        </Panel>

        <Panel title="Housekeeping" actions={<Link href="/admin/housekeeping" className="text-[13px] font-medium text-cobalt">Room board</Link>}>
          <ul className="space-y-2.5">
            {Object.entries(HK_STATUS).map(([k, s]) => {
              const n = hkCounts[k] ?? 0;
              return (
                <li key={k} className="flex items-center gap-3 text-[14px]">
                  <span aria-hidden className={`size-2.5 rounded-full ${s.dot}`} />
                  <span className="flex-1">{s.label}</span>
                  <span className="font-semibold tabular-nums">{n}</span>
                  <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-limestone">
                    <span className={`block h-full ${s.dot}`} style={{ width: `${totalRooms ? (n / totalRooms) * 100 : 0}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Arrivals today" bodyClassName="p-0">
          {arrivals.length ? (
            <ul className="divide-y divide-line-soft">
              {arrivals.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/reservations/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-limestone/50">
                    <span>
                      <span className="block text-[14.5px] font-medium">
                        {r.guest.firstName} {r.guest.lastName}
                      </span>
                      <span className="text-[13px] text-slate">
                        {pick(r.roomType.name, "en")} · {r.guests} guest{r.guests > 1 ? "s" : ""}
                      </span>
                    </span>
                    <Badge tone="cobalt">Room {[...new Set(r.allocations.map((a) => a.room.number))].join(", ")}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No arrivals today.</Empty>
          )}
        </Panel>

        <Panel title="Departures today" bodyClassName="p-0">
          {departures.length ? (
            <ul className="divide-y divide-line-soft">
              {departures.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/reservations/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-limestone/50">
                    <span>
                      <span className="block text-[14.5px] font-medium">
                        {r.guest.firstName} {r.guest.lastName}
                      </span>
                      <span className="text-[13px] text-slate">{pick(r.roomType.name, "en")}</span>
                    </span>
                    <Badge tone="saffron">Room {[...new Set(r.allocations.map((a) => a.room.number))].join(", ")}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No departures today.</Empty>
          )}
        </Panel>

        <Panel title="Guest requests" description="From the QR guest guide" actions={<Link href="/admin/guide?tab=requests" className="text-[13px] font-medium text-cobalt">All</Link>} bodyClassName="p-0">
          {serviceRequests.length ? (
            <ul className="divide-y divide-line-soft">
              {serviceRequests.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <p className="text-[14px] font-medium">
                    {s.room ? `Room ${s.room.number} · ` : ""}
                    {SR_TYPE[s.type]}
                  </p>
                  <p className="line-clamp-1 text-[13px] text-slate">{s.message}</p>
                  <p className="text-[12px] text-mist">{timeAgo(s.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No open guest requests.</Empty>
          )}
        </Panel>

        <Panel title="Recent activity" className="xl:col-span-2" bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-2.5 text-[13.5px]">
                <span>
                  <span className="font-medium">{a.user?.name ?? "System"}</span> <span className="text-slate">— {a.summary}</span>
                </span>
                <span className="shrink-0 text-[12px] text-mist">{formatDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Guest feedback">
          <p className="text-[32px] font-semibold leading-none">{feedback._avg.rating ? feedback._avg.rating.toFixed(1) : "—"}</p>
          <p className="mt-1 text-[13px] text-slate">average from {feedback._count} internal feedback message{feedback._count === 1 ? "" : "s"}</p>
          <Link href="/admin/guide?tab=feedback" className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-cobalt">
            Read feedback <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </Panel>
      </div>

    </>
  );
}
