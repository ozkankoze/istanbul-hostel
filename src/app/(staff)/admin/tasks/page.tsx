import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { NewTaskButton } from "@/components/admin/task-create";
import { StaffDialog } from "@/components/admin/staff-dialog";
import { AdminHeader, Panel, Table } from "@/components/admin/ui";
import { TaskList } from "@/components/staff/task-list";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { ROLE_LABEL } from "@/lib/status";
import { cn, formatDateTime } from "@/lib/utils";
import { can, requirePermission } from "@/server/auth";
import { getTasks } from "@/server/tasks";

export const metadata = { title: "Staff & Tasks" };

const FILTERS = {
  open: { label: "Open", where: { status: { in: ["OPEN", "IN_PROGRESS"] } } },
  unassigned: { label: "Unassigned", where: { status: { in: ["OPEN", "IN_PROGRESS"] }, assignedToId: null } },
  done: { label: "Completed", where: { status: "DONE" } },
  all: { label: "All", where: {} },
} satisfies Record<string, { label: string; where: Prisma.TaskWhereInput }>;

export default async function TasksPage({ searchParams }: PageProps<"/admin/tasks">) {
  const user = await requirePermission("tasks");
  const sp = await searchParams;
  const filter = typeof sp.filter === "string" && sp.filter in FILTERS ? (sp.filter as keyof typeof FILTERS) : "open";
  const who = typeof sp.who === "string" ? sp.who : "";
  const where: Prisma.TaskWhereInput = { ...FILTERS[filter].where, ...(who ? { assignedToId: who } : {}) };

  const [tasks, team, rooms, workload] = await Promise.all([
    getTasks(where, 150),
    db.user.findMany({ orderBy: [{ isActive: "desc" }, { role: "asc" }, { name: "asc" }] }),
    db.room.findMany({ orderBy: { number: "asc" }, select: { id: true, number: true } }),
    db.task.groupBy({ by: ["assignedToId"], where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, _count: true }),
  ]);
  const assignable = team.filter((u) => u.isActive).map((u) => ({ id: u.id, name: u.name }));
  const canManageStaff = can(user.role, "staff");
  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(filter !== "open" ? { filter } : {}), ...(who ? { who } : {}), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/admin/tasks${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <AdminHeader title="Staff & Tasks" description="Create and assign work, follow progress, and manage team accounts." actions={<NewTaskButton rooms={rooms} staff={assignable} />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {Object.entries(FILTERS).map(([k, f]) => (
              <Link
                key={k}
                href={link({ filter: k === "open" ? "" : k })}
                className={cn("rounded-full border px-3 py-1.5 text-[13px]", filter === k ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-soft")}
              >
                {f.label}
              </Link>
            ))}
            {who ? (
              <Link href={link({ who: "" })} className="ml-2 text-[13px] text-cobalt">
                Showing {team.find((u) => u.id === who)?.name ?? "one person"} — clear
              </Link>
            ) : null}
          </div>
          <TaskList tasks={tasks} staff={assignable} canManage empty="No tasks match this filter." />
        </div>
        <Panel title="Team" description="Open tasks per person" actions={canManageStaff ? <StaffDialog /> : null} bodyClassName="p-0">
          <Table className="[&_table]:min-w-0">
            <tbody>
              {team.map((u) => {
                const count = workload.find((w) => w.assignedToId === u.id)?._count ?? 0;
                return (
                  <tr key={u.id} className={cn(!u.isActive && "opacity-55")}>
                    <td>
                      <Link href={link({ who: u.id, filter: "" })} className="font-medium hover:text-cobalt">
                        {u.name}
                      </Link>
                      <span className="block text-[12px] text-slate">
                        {ROLE_LABEL[u.role]}
                        {!u.isActive ? " · inactive" : ""}
                        {u.lastLoginAt ? ` · last seen ${formatDateTime(u.lastLoginAt)}` : ""}
                      </span>
                    </td>
                    <td className="text-right">{count ? <Badge tone="cobalt">{count}</Badge> : <span className="text-mist">0</span>}</td>
                    {canManageStaff ? (
                      <td className="w-px">
                        <StaffDialog user={{ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, isActive: u.isActive }} />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {!canManageStaff ? <p className="border-t border-line-soft px-5 py-3 text-[12.5px] text-slate">Only administrators can add or edit accounts.</p> : null}
        </Panel>
      </div>
    </>
  );
}
