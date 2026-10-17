"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission, audit, AuthError, can } from "@/server/auth";
import { getProperty } from "@/server/queries";
import type { ActionResult } from "./types";

const STATUSES = ["CLEAN", "DIRTY", "CLEANING", "INSPECTED", "MAINTENANCE"] as const;

function refresh() {
  revalidatePath("/staff", "layout");
  revalidatePath("/admin", "layout");
}

async function guard<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function setRoomStatus(input: { roomId: string; status: string; note?: string }) {
  return guard(async () => {
    const user = await assertPermission("staffApp");
    const d = z
      .object({ roomId: z.string().min(1), status: z.enum(STATUSES), note: z.string().trim().max(500).optional() })
      .parse(input);
    if (d.status === "INSPECTED" && !can(user.role, "tasks"))
      return { ok: false, error: "Only a supervisor can mark a room as inspected." };

    const room = await db.room.findUniqueOrThrow({ where: { id: d.roomId } });
    await db.$transaction([
      db.room.update({
        where: { id: room.id },
        data: {
          housekeepingStatus: d.status,
          housekeepingNote: d.status === "MAINTENANCE" ? d.note || room.housekeepingNote : d.note || null,
          statusUpdatedAt: new Date(),
        },
      }),
      db.housekeepingLog.create({
        data: { roomId: room.id, fromStatus: room.housekeepingStatus, toStatus: d.status, userId: user.id, note: d.note || null },
      }),
    ]);

    // Keep the room's cleaning task in step with the status.
    if (d.status === "CLEANING") {
      await db.task.updateMany({
        where: { roomId: room.id, type: "CLEANING", status: "OPEN" },
        data: { status: "IN_PROGRESS", startedAt: new Date() },
      });
    }
    if (d.status === "CLEAN" || d.status === "INSPECTED") {
      const open = await db.task.findMany({ where: { roomId: room.id, type: "CLEANING", status: { in: ["OPEN", "IN_PROGRESS"] } } });
      for (const t of open) {
        await db.task.update({
          where: { id: t.id },
          data: { status: "DONE", completedAt: new Date(), events: { create: { userId: user.id, kind: "completed", message: `Room marked ${d.status.toLowerCase()}` } } },
        });
      }
    }
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function reportMaintenance(input: { roomId: string; description: string; priority?: string }) {
  return guard(async () => {
    const user = await assertPermission("staffApp");
    const d = z
      .object({
        roomId: z.string().min(1),
        description: z.string().trim().min(3, "Describe the problem.").max(500),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("HIGH"),
      })
      .safeParse(input);
    if (!d.success) return { ok: false, error: d.error.issues[0]?.message ?? "Describe the problem." };
    const property = await getProperty();
    const room = await db.room.findUniqueOrThrow({ where: { id: d.data.roomId } });
    await db.$transaction([
      db.task.create({
        data: {
          propertyId: property.id,
          roomId: room.id,
          title: d.data.description.slice(0, 80),
          description: d.data.description,
          type: "MAINTENANCE",
          priority: d.data.priority,
          createdById: user.id,
          events: { create: { userId: user.id, kind: "created", message: `Reported by ${user.name}` } },
        },
      }),
      db.room.update({
        where: { id: room.id },
        data: { housekeepingStatus: "MAINTENANCE", housekeepingNote: d.data.description, statusUpdatedAt: new Date() },
      }),
      db.housekeepingLog.create({
        data: { roomId: room.id, fromStatus: room.housekeepingStatus, toStatus: "MAINTENANCE", userId: user.id, note: d.data.description },
      }),
    ]);
    await audit(user.id, "report", "Room", room.id, `Maintenance reported in room ${room.number}`);
    refresh();
    return { ok: true, data: undefined };
  });
}

const TASK_STATUS = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"] as const;

export async function updateTaskStatus(input: { taskId: string; status: string; note?: string }) {
  return guard(async () => {
    const user = await assertPermission("staffApp");
    const d = z
      .object({ taskId: z.string(), status: z.enum(TASK_STATUS), note: z.string().trim().max(1000).optional() })
      .parse(input);
    const task = await db.task.findUniqueOrThrow({ where: { id: d.taskId }, include: { room: true } });
    // Housekeepers can only work on their own or unassigned tasks.
    if (user.role === "HOUSEKEEPING" && task.assignedToId && task.assignedToId !== user.id)
      return { ok: false, error: "This task is assigned to someone else." };
    if (d.status === "CANCELLED" && !can(user.role, "tasks")) return { ok: false, error: "Only a supervisor can cancel tasks." };

    await db.task.update({
      where: { id: task.id },
      data: {
        status: d.status,
        assignedToId: task.assignedToId ?? (user.role === "HOUSEKEEPING" ? user.id : undefined),
        startedAt: d.status === "IN_PROGRESS" && !task.startedAt ? new Date() : undefined,
        completedAt: d.status === "DONE" ? new Date() : d.status === "OPEN" ? null : undefined,
        events: {
          create: {
            userId: user.id,
            kind: d.status === "IN_PROGRESS" ? "started" : d.status === "DONE" ? "completed" : d.status.toLowerCase(),
            message: d.note || null,
          },
        },
      },
    });

    // Mirror cleaning progress on the room.
    if (task.room && task.type === "CLEANING" && (d.status === "IN_PROGRESS" || d.status === "DONE")) {
      const to = d.status === "IN_PROGRESS" ? "CLEANING" : "CLEAN";
      if (task.room.housekeepingStatus !== to && task.room.housekeepingStatus !== "MAINTENANCE") {
        await db.$transaction([
          db.room.update({ where: { id: task.room.id }, data: { housekeepingStatus: to, statusUpdatedAt: new Date() } }),
          db.housekeepingLog.create({ data: { roomId: task.room.id, fromStatus: task.room.housekeepingStatus, toStatus: to, userId: user.id } }),
        ]);
      }
    }
    if (task.room && task.type === "MAINTENANCE" && d.status === "DONE" && task.room.housekeepingStatus === "MAINTENANCE") {
      const stillOpen = await db.task.count({ where: { roomId: task.room.id, type: "MAINTENANCE", status: { in: ["OPEN", "IN_PROGRESS"] } } });
      if (!stillOpen) {
        await db.$transaction([
          db.room.update({ where: { id: task.room.id }, data: { housekeepingStatus: "DIRTY", housekeepingNote: null, statusUpdatedAt: new Date() } }),
          db.housekeepingLog.create({ data: { roomId: task.room.id, fromStatus: "MAINTENANCE", toStatus: "DIRTY", userId: user.id, note: "Maintenance fixed — needs cleaning" } }),
        ]);
      }
    }
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function addTaskNote(input: { taskId: string; note: string }) {
  return guard(async () => {
    const user = await assertPermission("staffApp");
    const d = z.object({ taskId: z.string(), note: z.string().trim().min(1, "Write a note first.").max(1000) }).safeParse(input);
    if (!d.success) return { ok: false, error: "Write a note first." };
    await db.taskEvent.create({ data: { taskId: d.data.taskId, userId: user.id, kind: "note", message: d.data.note } });
    refresh();
    return { ok: true, data: undefined };
  });
}

const createTaskSchema = z.object({
  title: z.string().trim().min(2, "Give the task a title.").max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  type: z.enum(["CLEANING", "INSPECTION", "MAINTENANCE", "CUSTOM"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  roomId: z.string().optional().or(z.literal("")),
  assignedToId: z.string().optional().or(z.literal("")),
  dueAt: z.string().optional().or(z.literal("")),
});

export async function createTask(input: unknown) {
  return guard(async () => {
    const user = await assertPermission("tasks");
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
    const d = parsed.data;
    const property = await getProperty();
    const task = await db.task.create({
      data: {
        propertyId: property.id,
        title: d.title,
        description: d.description || null,
        type: d.type,
        priority: d.priority,
        roomId: d.roomId || null,
        assignedToId: d.assignedToId || null,
        dueAt: d.dueAt ? new Date(`${d.dueAt}:00+03:00`) : null,
        createdById: user.id,
        events: { create: { userId: user.id, kind: "created", message: "Task created" } },
      },
    });
    if (task.type === "CLEANING" && task.roomId) {
      await db.room.update({ where: { id: task.roomId }, data: { assignedToId: task.assignedToId ?? undefined } });
    }
    await audit(user.id, "create", "Task", task.id, `Created task "${task.title}"`);
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function assignTask(input: { taskId: string; userId: string | null }) {
  return guard(async () => {
    const user = await assertPermission("tasks");
    const d = z.object({ taskId: z.string(), userId: z.string().nullable() }).parse(input);
    const assignee = d.userId ? await db.user.findUnique({ where: { id: d.userId } }) : null;
    await db.task.update({
      where: { id: d.taskId },
      data: {
        assignedToId: assignee?.id ?? null,
        events: { create: { userId: user.id, kind: "assigned", message: assignee ? `Assigned to ${assignee.name}` : "Unassigned" } },
      },
    });
    refresh();
    return { ok: true, data: undefined };
  });
}

export async function assignRoom(input: { roomId: string; userId: string | null }) {
  return guard(async () => {
    const user = await assertPermission("tasks");
    const d = z.object({ roomId: z.string(), userId: z.string().nullable() }).parse(input);
    const room = await db.room.update({ where: { id: d.roomId }, data: { assignedToId: d.userId } });
    await audit(user.id, "assign", "Room", room.id, `Room ${room.number} housekeeping assignment changed`);
    refresh();
    return { ok: true, data: undefined };
  });
}
