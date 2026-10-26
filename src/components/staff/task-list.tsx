"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Clock, MessageSquarePlus, Play, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { PRIORITY, TASK_STATUS, TASK_TYPE } from "@/lib/status";
import { cn, formatDateTime } from "@/lib/utils";
import { addTaskNote, assignTask, updateTaskStatus } from "@/server/actions/housekeeping";
import { useStaffText } from "./staff-lang";
import { useStaffAction } from "./use-action";

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
  completedAt: string | null;
  room: { number: string } | null;
  assignedTo: { id: string; name: string } | null;
  events: { id: string; kind: string; message: string | null; createdAt: string; user: { name: string } | null }[];
};

export function TaskList({
  tasks,
  staff,
  canManage,
  empty = "No tasks here.",
}: {
  tasks: TaskItem[];
  staff?: { id: string; name: string }[];
  canManage: boolean;
  empty?: string;
}) {
  if (!tasks.length) return <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[14px] text-slate">{empty}</p>;
  return (
    <ul className="space-y-3">
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} staff={staff} canManage={canManage} />
      ))}
    </ul>
  );
}

function TaskCard({ task, staff, canManage }: { task: TaskItem; staff?: { id: string; name: string }[]; canManage: boolean }) {
  const { lang, t } = useStaffText();
  const { pending, run } = useStaffAction();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const p = PRIORITY[task.priority]!;
  const s = TASK_STATUS[task.status]!;
  const overdue = task.dueAt && task.status !== "DONE" && task.status !== "CANCELLED" && new Date(task.dueAt) < new Date();
  const done = task.status === "DONE" || task.status === "CANCELLED";

  return (
    <li className={cn("rounded-lg border bg-paper", task.priority === "URGENT" && !done ? "border-tulip/40" : "border-line")}>
      <div className="flex flex-wrap items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {task.room ? <Badge tone="dark">{t.tasks.room(task.room.number)}</Badge> : null}
            <Badge tone="outline">{t.taskType[task.type] ?? TASK_TYPE[task.type]}</Badge>
            {task.priority !== "NORMAL" ? <Badge tone={p.tone}>{t.priorityLabel[task.priority]}</Badge> : null}
            <Badge tone={s.tone} dot>
              {t.taskStatus[task.status]}
            </Badge>
          </div>
          <p className={cn("mt-2 text-[15.5px] font-semibold leading-snug", done && "text-slate line-through decoration-1")}>{task.title}</p>
          {task.description ? <p className="mt-1 whitespace-pre-line text-[13.5px] text-slate">{task.description}</p> : null}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-mist">
            <span>{task.assignedTo ? task.assignedTo.name : t.tasks.unassigned}</span>
            {task.dueAt ? (
              <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-tulip")}>
                <Clock aria-hidden className="size-3" /> {t.tasks.due} {formatDateTime(task.dueAt, lang)}
              </span>
            ) : null}
            {task.completedAt ? <span>{t.tasks.doneAgo} {t.ago(new Date(task.completedAt))}</span> : null}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {task.status === "OPEN" ? (
            <Button size="sm" disabled={pending} onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: "IN_PROGRESS" }), t.tasks.started)}>
              <Play aria-hidden /> {t.tasks.start}
            </Button>
          ) : null}
          {task.status === "OPEN" || task.status === "IN_PROGRESS" ? (
            <Button size="sm" variant={task.status === "IN_PROGRESS" ? "primary" : "secondary"} disabled={pending} onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: "DONE" }), t.tasks.markedDone)}>
              <CheckCircle2 aria-hidden /> {t.tasks.done}
            </Button>
          ) : null}
          {done ? (
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: "OPEN" }), t.tasks.reopened)}>
              <RotateCcw aria-hidden /> {t.tasks.reopen}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            <ChevronDown aria-hidden className={cn("transition-transform", open && "rotate-180")} />
            <span className="sr-only sm:not-sr-only">{t.tasks.history}</span>
          </Button>
        </div>
      </div>
      {open ? (
        <div className="space-y-4 border-t border-line-soft px-4 py-4">
          {canManage && staff ? (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`assign-${task.id}`} className="text-[13px] text-slate">
                {t.tasks.assignedTo}
              </label>
              <div className="w-48">
                <Select
                  id={`assign-${task.id}`}
                  className="h-9 text-[14px]"
                  value={task.assignedTo?.id ?? ""}
                  disabled={pending}
                  onChange={(e) => run(() => assignTask({ taskId: task.id, userId: e.target.value || null }), t.rooms.assignmentUpdated)}
                >
                  <option value="">{t.tasks.unassigned}</option>
                  {staff.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </div>
              {!done ? (
                <Button size="sm" variant="ghost" className="text-tulip" disabled={pending} onClick={() => run(() => updateTaskStatus({ taskId: task.id, status: "CANCELLED" }), t.tasks.cancelled)}>
                  <XCircle aria-hidden /> {t.tasks.cancel}
                </Button>
              ) : null}
            </div>
          ) : null}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => addTaskNote({ taskId: task.id, note }), t.tasks.noteAdded, () => setNote(""));
            }}
          >
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.tasks.notePh} className="h-9 text-[14px]" aria-label={t.tasks.note} />
            <Button size="sm" type="submit" variant="secondary" disabled={pending || !note.trim()} className="h-9">
              <MessageSquarePlus aria-hidden /> {t.tasks.add}
            </Button>
          </form>
          <ol className="space-y-2 border-l border-line pl-4">
            {task.events.map((ev) => (
              <li key={ev.id} className="relative text-[13px]">
                <span aria-hidden className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-line" />
                <span className="text-ink-soft">
                  <span className="font-medium">{ev.user?.name ?? t.tasks.system}</span> · {ev.kind === "note" ? "note" : ev.kind}
                </span>
                {ev.message ? <span className="text-slate"> — {ev.message}</span> : null}
                <span className="ml-1 text-mist">{formatDateTime(ev.createdAt, lang)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </li>
  );
}
