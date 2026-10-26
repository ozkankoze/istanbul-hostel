import Link from "next/link";
import { BedDouble, CalendarCheck, ListChecks } from "lucide-react";
import { addDays, propertyToday } from "@/lib/dates";
import { BookingList } from "@/components/staff/booking-list";
import { RoomBoard } from "@/components/staff/room-board";
import { TaskList } from "@/components/staff/task-list";
import { cn } from "@/lib/utils";
import { can, requirePermission } from "@/server/auth";
import { getStaffBookings } from "@/server/staff-bookings";
import { getBoardRooms, getHousekeepers, getTasks } from "@/server/tasks";

export default async function StaffHome({ searchParams }: PageProps<"/staff">) {
  const user = await requirePermission("staffApp");
  const sp = await searchParams;
  const desk = can(user.role, "reservations");
  const tab = sp.tab === "rooms" ? "rooms" : sp.tab === "bookings" && desk ? "bookings" : "tasks";
  const supervisor = can(user.role, "tasks");

  const [bookings, rooms, myTasks, openTasks, staff] = await Promise.all([
    desk ? getStaffBookings() : Promise.resolve(null),
    getBoardRooms(),
    getTasks({ assignedToId: user.id, OR: [{ status: { in: ["OPEN", "IN_PROGRESS"] } }, { completedAt: { gte: addDays(propertyToday(), -1) } }] }),
    getTasks({ assignedToId: null, status: { in: ["OPEN", "IN_PROGRESS"] } }),
    supervisor ? getHousekeepers() : Promise.resolve(undefined),
  ]);
  const activeMine = myTasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const dirty = rooms.filter((r) => r.status === "DIRTY").length;
  const cleaning = rooms.filter((r) => r.status === "CLEANING").length;
  const ready = rooms.filter((r) => r.status === "CLEAN" || r.status === "INSPECTED").length;
  const attention = bookings ? bookings.pending.length + bookings.arrivals.length : 0;
  const greeting = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Istanbul" }).format(new Date());

  return (
    <>
      <p className="text-[13px] text-slate">{greeting}</p>
      <h1 className="mt-1 font-display text-[30px] leading-tight">Hi {user.name.split(" ")[0]}.</h1>
      <p className="mt-1 text-[15px] text-slate">
        {tab === "bookings" && bookings
          ? `${bookings.pending.length} new request${bookings.pending.length === 1 ? "" : "s"} · ${bookings.arrivals.length} arriving today.`
          : `You have ${activeMine} open task${activeMine === 1 ? "" : "s"} · ${dirty} room${dirty === 1 ? "" : "s"} waiting to be cleaned.`}
      </p>

      <div className={cn("mt-4 grid gap-2", tab === "bookings" ? "grid-cols-4" : "grid-cols-3")}>
        {(tab === "bookings" && bookings
          ? [
              { label: "Requests", value: bookings.pending.length, tone: "bg-saffron/15 text-[#9a6a00]", href: "#requests" },
              { label: "Arriving", value: bookings.arrivals.length, tone: "bg-cobalt/10 text-cobalt", href: "#arrivals" },
              { label: "Leaving", value: bookings.departures.length, tone: "bg-tulip/10 text-tulip", href: "#departures" },
              { label: "In house", value: bookings.inHouse, tone: "bg-tile/10 text-tile", href: "#upcoming" },
            ]
          : [
              { label: "To clean", value: dirty, tone: "bg-tulip/10 text-tulip", href: "/staff?tab=rooms" },
              { label: "Cleaning", value: cleaning, tone: "bg-saffron/15 text-[#9a6a00]", href: "/staff?tab=rooms" },
              { label: "Ready", value: ready, tone: "bg-tile/10 text-tile", href: "/staff?tab=rooms" },
            ]
        ).map((s) => (
          <Link key={s.label} href={s.href} className={cn("rounded-xl px-3 py-2.5", s.tone)}>
            <span className="block font-display text-[26px] leading-none">{s.value}</span>
            <span className="mt-1 block text-[12px] font-medium">{s.label}</span>
          </Link>
        ))}
      </div>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className={cn("mx-auto grid h-16 max-w-3xl", desk ? "grid-cols-3" : "grid-cols-2")}>
          {[
            ...(desk ? [{ id: "bookings", label: "Bookings", href: "/staff?tab=bookings", Icon: CalendarCheck, count: attention }] : []),
            { id: "tasks", label: "My tasks", href: "/staff", Icon: ListChecks, count: activeMine },
            { id: "rooms", label: "Rooms", href: "/staff?tab=rooms", Icon: BedDouble, count: dirty },
          ].map(({ id, label, href, Icon, count }) => (
            <Link
              key={id}
              href={href}
              aria-current={tab === id ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 text-[12px] font-medium",
                tab === id ? "text-cobalt" : "text-slate",
              )}
            >
              <span className={cn("relative rounded-full px-5 py-1", tab === id && "bg-cobalt-soft")}>
                <Icon className="size-[22px]" aria-hidden />
                {count > 0 ? (
                  <span className="absolute -right-0.5 -top-1 min-w-[18px] rounded-full bg-tulip px-1 text-center text-[10.5px] font-semibold leading-[18px] text-paper">
                    {count}
                  </span>
                ) : null}
              </span>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mt-7">
        {tab === "bookings" && bookings ? (
          <div className="space-y-9">
            <section id="requests" className="scroll-mt-20">
              <h2 className="mb-3 text-[15px] font-semibold">New booking requests</h2>
              <BookingList items={bookings.pending} empty="No requests waiting. New ones from the website appear here." />
            </section>
            <section id="arrivals" className="scroll-mt-20">
              <h2 className="mb-3 text-[15px] font-semibold">Arriving today</h2>
              <BookingList items={bookings.arrivals} empty="No arrivals today." />
            </section>
            <section id="departures" className="scroll-mt-20">
              <h2 className="mb-3 text-[15px] font-semibold">Leaving today</h2>
              <BookingList items={bookings.departures} empty="No departures today." departing />
            </section>
            <section id="upcoming" className="scroll-mt-20">
              <h2 className="mb-3 text-[15px] font-semibold">Next 3 days</h2>
              <BookingList items={bookings.upcoming} empty="No confirmed arrivals in the next 3 days." />
            </section>
          </div>
        ) : tab === "tasks" ? (
          <div className="space-y-10">
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Assigned to me</h2>
              <TaskList tasks={myTasks} staff={staff} canManage={supervisor} empty="Nothing assigned to you right now." />
            </section>
            <section>
              <h2 className="mb-3 text-[15px] font-semibold">Unassigned — anyone can pick up</h2>
              <TaskList tasks={openTasks} staff={staff} canManage={supervisor} empty="No unassigned tasks." />
            </section>
          </div>
        ) : (
          <RoomBoard rooms={rooms} staff={staff} canInspect={supervisor} canAssign={supervisor} currentUserId={user.id} compact />
        )}
      </div>
    </>
  );
}
