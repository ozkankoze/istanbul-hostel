"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BedDouble, Brush, CheckCheck, ClipboardCheck, Sparkles, User, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { HK_STATUS, OCCUPANCY } from "@/lib/status";
import { cn, timeAgo } from "@/lib/utils";
import { assignRoom, reportMaintenance, setRoomStatus } from "@/server/actions/housekeeping";
import { useStaffAction } from "./use-action";

export type BoardRoom = {
  id: string;
  number: string;
  floor: number;
  typeName: string;
  kind: "DORM" | "PRIVATE";
  status: keyof typeof HK_STATUS;
  note: string | null;
  statusUpdatedAt: string;
  assignedTo: { id: string; name: string } | null;
  capacity: number;
  occupiedUnits: number;
  occupancy: keyof typeof OCCUPANCY;
  arrivingToday: number;
  departingToday: number;
  guests: string[];
  blockedReason: string | null;
  openTasks: number;
  urgentTasks: number;
};

const FILTERS = ["ALL", "DIRTY", "CLEANING", "CLEAN", "INSPECTED", "MAINTENANCE"] as const;

export function RoomBoard({
  rooms,
  staff,
  canInspect,
  canAssign,
  currentUserId,
  compact,
}: {
  rooms: BoardRoom[];
  staff?: { id: string; name: string }[];
  canInspect: boolean;
  canAssign: boolean;
  currentUserId: string;
  compact?: boolean;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [mine, setMine] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = useMemo(
    () => rooms.filter((r) => (filter === "ALL" || r.status === filter) && (!mine || r.assignedTo?.id === currentUserId)),
    [rooms, filter, mine, currentUserId],
  );
  const open = rooms.find((r) => r.id === openId) ?? null;
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rooms.length };
    for (const r of rooms) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rooms]);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors cursor-pointer",
                filter === f ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink-soft hover:border-ink/30",
              )}
            >
              {f !== "ALL" ? <span aria-hidden className={cn("size-2 rounded-full", HK_STATUS[f]!.dot)} /> : null}
              {f === "ALL" ? "All rooms" : HK_STATUS[f]!.label}
              <span className={cn("text-[12px]", filter === f ? "text-paper/60" : "text-mist")}>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-[13px] text-ink-soft">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="size-4 accent-cobalt" />
          Assigned to me
        </label>
      </div>

      <ul className={cn("mt-4 grid gap-3", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6")}>
        {shown.map((r) => {
          const s = HK_STATUS[r.status]!;
          const o = OCCUPANCY[r.occupancy]!;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setOpenId(r.id)}
                className="group relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-line bg-paper p-3.5 pl-4 text-left transition-shadow hover:shadow-raise cursor-pointer"
              >
                <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", s.dot)} />
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-[26px] leading-none">{r.number}</span>
                  {r.urgentTasks ? <AlertTriangle aria-label="Urgent task" className="size-4 text-tulip" /> : null}
                </div>
                <span className="mt-1 line-clamp-1 text-[12.5px] text-slate">{r.typeName}</span>
                <span className="mt-3 text-[13px] font-medium">{s.label}</span>
                <span className="mt-1 flex items-center gap-1 text-[12px] text-slate">
                  <BedDouble aria-hidden className="size-3.5" />
                  {r.kind === "DORM" ? `${r.occupiedUnits}/${r.capacity} beds` : o.label}
                </span>
                {r.arrivingToday || r.departingToday ? (
                  <span className="mt-1 text-[12px] text-cobalt">
                    {r.departingToday ? `${r.departingToday} out` : ""}
                    {r.departingToday && r.arrivingToday ? " · " : ""}
                    {r.arrivingToday ? `${r.arrivingToday} in` : ""} today
                  </span>
                ) : null}
                <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11.5px] text-mist">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <User aria-hidden className="size-3 shrink-0" />
                    <span className="truncate">{r.assignedTo?.name.split(" ")[0] ?? "—"}</span>
                  </span>
                  <span className="shrink-0">{timeAgo(new Date(r.statusUpdatedAt))}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!shown.length ? <p className="mt-6 text-[14px] text-slate">No rooms match this filter.</p> : null}

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent side="right" className="overflow-y-auto p-6">
          {open ? (
            <RoomActions
              key={open.id}
              room={open}
              staff={staff}
              canInspect={canInspect}
              canAssign={canAssign}
              onDone={() => setOpenId(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RoomActions({
  room,
  staff,
  canInspect,
  canAssign,
  onDone,
}: {
  room: BoardRoom;
  staff?: { id: string; name: string }[];
  canInspect: boolean;
  canAssign: boolean;
  onDone: () => void;
}) {
  const { pending, run } = useStaffAction();
  const [mode, setMode] = useState<"main" | "maintenance">("main");
  const [note, setNote] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("HIGH");
  const s = HK_STATUS[room.status]!;
  const o = OCCUPANCY[room.occupancy]!;

  const set = (status: string, label: string) =>
    run(() => setRoomStatus({ roomId: room.id, status, note: note || undefined }), `Room ${room.number}: ${label}`, onDone);

  return (
    <div>
      <SheetTitle className="font-display text-[34px] leading-none">Room {room.number}</SheetTitle>
      <SheetDescription className="mt-1 text-[14px] text-slate">
        {room.typeName} · Floor {room.floor}
      </SheetDescription>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={s.tone} dot>
          {s.label}
        </Badge>
        <Badge tone={o.tone}>{room.kind === "DORM" ? `${room.occupiedUnits}/${room.capacity} beds occupied` : o.label}</Badge>
      </div>
      {room.note ? <p className="mt-3 rounded-md bg-limestone px-3 py-2 text-[13.5px] text-ink-soft">{room.note}</p> : null}
      {room.blockedReason ? <p className="mt-2 text-[13px] text-slate">Blocked today: {room.blockedReason}</p> : null}
      {room.guests.length ? <p className="mt-2 text-[13px] text-slate">In house: {room.guests.join(", ")}</p> : null}

      {mode === "main" ? (
        <>
          <div className="mt-6 grid gap-2">
            <Button size="lg" variant={room.status === "CLEANING" ? "secondary" : "primary"} disabled={pending || room.status === "CLEANING"} onClick={() => set("CLEANING", "cleaning started")}>
              <Brush aria-hidden /> Start cleaning
            </Button>
            <Button size="lg" variant="secondary" disabled={pending || room.status === "CLEAN"} onClick={() => set("CLEAN", "marked clean")}>
              <Sparkles aria-hidden /> Mark cleaning completed
            </Button>
            {canInspect ? (
              <Button size="lg" variant="secondary" disabled={pending || room.status === "INSPECTED"} onClick={() => set("INSPECTED", "inspected & ready")}>
                <ClipboardCheck aria-hidden /> Mark inspected / ready
              </Button>
            ) : null}
            <Button size="lg" variant="secondary" disabled={pending || room.status === "DIRTY"} onClick={() => set("DIRTY", "marked dirty")}>
              <CheckCheck aria-hidden /> Needs cleaning
            </Button>
            <Button size="lg" variant="ghost" className="text-tulip hover:bg-tulip-soft" onClick={() => setMode("maintenance")}>
              <Wrench aria-hidden /> Report maintenance issue
            </Button>
          </div>
          <Field label="Note (optional)" htmlFor="room-note" className="mt-6" hint="Saved with the next status change.">
            <Textarea id="room-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Extra towels left, window latch loose" />
          </Field>
          {canAssign && staff ? (
            <Field label="Assigned housekeeper" htmlFor="room-assign" className="mt-5">
              <Select
                id="room-assign"
                value={room.assignedTo?.id ?? ""}
                disabled={pending}
                onChange={(e) => run(() => assignRoom({ roomId: room.id, userId: e.target.value || null }), "Assignment updated")}
              >
                <option value="">Unassigned</option>
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
        </>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => reportMaintenance({ roomId: room.id, description: issue, priority }), "Maintenance issue reported", onDone);
          }}
        >
          <Field label="What's wrong?" htmlFor="issue">
            <Textarea id="issue" rows={4} value={issue} onChange={(e) => setIssue(e.target.value)} required placeholder="e.g. Shower drain blocked, bed B2 light broken" />
          </Field>
          <Field label="Priority" htmlFor="issue-priority">
            <Select id="issue-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent — room can&apos;t be used</option>
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setMode("main")}>
              Back
            </Button>
            <Button type="submit" variant="danger" disabled={pending} className="flex-1">
              Report issue
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
