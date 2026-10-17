import { RoomBoard } from "@/components/staff/room-board";
import { AdminHeader, Empty, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { HK_STATUS } from "@/lib/status";
import { formatDateTime } from "@/lib/utils";
import { can, requirePermission } from "@/server/auth";
import { getBoardRooms, getHousekeepers, getTasks } from "@/server/tasks";
import { TaskList } from "@/components/staff/task-list";

export const metadata = { title: "Housekeeping" };

export default async function HousekeepingAdmin() {
  const user = await requirePermission("housekeeping");
  const supervisor = can(user.role, "tasks");
  const [rooms, staff, log, maintenance] = await Promise.all([
    getBoardRooms(),
    getHousekeepers(),
    db.housekeepingLog.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { room: { select: { number: true } }, user: { select: { name: true } } } }),
    getTasks({ type: "MAINTENANCE", status: { in: ["OPEN", "IN_PROGRESS"] } }),
  ]);

  return (
    <>
      <AdminHeader
        title="Housekeeping"
        description="Cleaning status is tracked separately from occupancy — an occupied room can still need cleaning. Click a room to change its status, report an issue or assign a housekeeper."
      />
      <Panel>
        <RoomBoard rooms={rooms} staff={staff} canInspect={supervisor} canAssign={supervisor} currentUserId={user.id} />
      </Panel>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={`Open maintenance issues (${maintenance.length})`}>
          <TaskList tasks={maintenance} staff={staff} canManage={supervisor} empty="No open maintenance issues." />
        </Panel>
        <Panel title="Status history" description="Last 30 changes" bodyClassName="p-0">
          {log.length ? (
            <Table className="[&_table]:min-w-0">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Room</th>
                  <th>Change</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap text-[13px] text-slate">{formatDateTime(l.createdAt)}</td>
                    <td className="font-semibold">{l.room.number}</td>
                    <td>
                      <span className="flex flex-wrap items-center gap-1">
                        {l.fromStatus ? <span className="text-[12.5px] text-slate">{HK_STATUS[l.fromStatus]!.label} →</span> : null}
                        <Badge tone={HK_STATUS[l.toStatus]!.tone}>{HK_STATUS[l.toStatus]!.label}</Badge>
                      </span>
                      {l.note ? <span className="mt-0.5 block text-[12.5px] text-slate">{l.note}</span> : null}
                    </td>
                    <td className="text-[13px]">{l.user?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Empty>No history yet.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
