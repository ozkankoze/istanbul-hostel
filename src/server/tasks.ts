import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { pick } from "@/i18n/config";
import { getRoomBoard } from "@/server/housekeeping";
import type { TaskItem } from "@/components/staff/task-list";
import type { BoardRoom } from "@/components/staff/room-board";

export async function getTasks(where: Prisma.TaskWhereInput, take = 100): Promise<TaskItem[]> {
  const tasks = await db.task.findMany({
    where,
    take,
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      room: { select: { number: true } },
      assignedTo: { select: { id: true, name: true } },
      events: { orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true } } } },
    },
  });
  const prio = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 } as const;
  const stat = { IN_PROGRESS: 0, OPEN: 1, DONE: 2, CANCELLED: 3 } as const;
  tasks.sort((a, b) => stat[a.status] - stat[b.status] || prio[a.priority] - prio[b.priority]);
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    type: t.type,
    priority: t.priority,
    status: t.status,
    dueAt: t.dueAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    completedAt: t.completedAt?.toISOString() ?? null,
    room: t.room,
    assignedTo: t.assignedTo,
    events: t.events.map((e) => ({ id: e.id, kind: e.kind, message: e.message, createdAt: e.createdAt.toISOString(), user: e.user })),
  }));
}

export async function getBoardRooms(): Promise<BoardRoom[]> {
  const rooms = await getRoomBoard();
  return rooms.map((r) => ({
    ...r,
    typeName: pick(r.typeName, "en"),
    statusUpdatedAt: r.statusUpdatedAt.toISOString(),
  }));
}

export async function getHousekeepers() {
  return db.user.findMany({
    where: { isActive: true, role: { in: ["HOUSEKEEPING", "MANAGER", "RECEPTION"] } },
    select: { id: true, name: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}
