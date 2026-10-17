import Link from "next/link";
import { addDays, propertyToday } from "@/lib/dates";
import { RoomBoard } from "@/components/staff/room-board";
import { TaskList } from "@/components/staff/task-list";
import { cn } from "@/lib/utils";
import { can, requirePermission } from "@/server/auth";
import { getBoardRooms, getHousekeepers, getTasks } from "@/server/tasks";

export default async function StaffHome({ searchParams }: PageProps<"/staff">) {
  const user = await requirePermission("staffApp");
  const sp = await searchParams;
  const tab = sp.tab === "rooms" ? "rooms" : "tasks";
  const supervisor = can(user.role, "tasks");

  const [rooms, myTasks, openTasks, staff] = await Promise.all([
    getBoardRooms(),
    getTasks({ assignedToId: user.id, OR: [{ status: { in: ["OPEN", "IN_PROGRESS"] } }, { completedAt: { gte: addDays(propertyToday(), -1) } }] }),
    getTasks({ assignedToId: null, status: { in: ["OPEN", "IN_PROGRESS"] } }),
    supervisor ? getHousekeepers() : Promise.resolve(undefined),
  ]);
  const activeMine = myTasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const dirty = rooms.filter((r) => r.status === "DIRTY").length;
  const greeting = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Istanbul" }).format(new Date());

  return (
    <>
      <p className="text-[13px] text-slate">{greeting}</p>
      <h1 className="mt-1 font-display text-[32px] leading-tight">Hi {user.name.split(" ")[0]}.</h1>
      <p className="mt-1 text-[15px] text-slate">
        You have {activeMine} open task{activeMine === 1 ? "" : "s"} · {dirty} room{dirty === 1 ? "" : "s"} waiting to be cleaned.
      </p>

      <nav className="mt-6 flex gap-1 rounded-lg bg-limestone-deep p-1" aria-label="Sections">
        {[
          { id: "tasks", label: "My tasks" },
          { id: "rooms", label: "Rooms" },
        ].map((t) => (
          <Link
            key={t.id}
            href={t.id === "tasks" ? "/staff" : "/staff?tab=rooms"}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-center text-[14px] font-medium transition-colors",
              tab === t.id ? "bg-paper text-ink shadow-sm" : "text-slate hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "tasks" ? (
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
