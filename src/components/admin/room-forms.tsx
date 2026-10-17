"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useStaffAction } from "@/components/staff/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { addBlockedDates, removeBlockedDates, saveRoom } from "@/server/actions/admin/rooms";
import { ActionForm } from "./action-form";
import { Toggle } from "./toggle";

type TypeOpt = { id: string; name: string; kind: "DORM" | "PRIVATE"; capacity: number };
type RoomRow = { id: string; number: string; floor: number; roomTypeId: string; beds: number; isActive: boolean };

export function RoomDialog({ room, types }: { room?: RoomRow; types: TypeOpt[] }) {
  const [open, setOpen] = useState(false);
  const [typeId, setTypeId] = useState(room?.roomTypeId ?? types[0]?.id ?? "");
  const type = types.find((t) => t.id === typeId);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {room ? (
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={`Edit room ${room.number}`}>
          <Pencil aria-hidden /> Edit
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden /> Add room
        </Button>
      )}
      <DialogContent title={room ? `Edit room ${room.number}` : "Add a room"}>
        <ActionForm action={saveRoom} success={room ? "Room updated" : "Room added"} onSuccess={() => setOpen(false)}>
          {room ? <input type="hidden" name="id" value={room.id} /> : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room number" htmlFor="r-number">
              <Input id="r-number" name="number" defaultValue={room?.number} required placeholder="e.g. 205" />
            </Field>
            <Field label="Floor" htmlFor="r-floor">
              <Input id="r-floor" name="floor" type="number" defaultValue={room?.floor ?? 1} required />
            </Field>
          </div>
          <Field label="Room type" htmlFor="r-type">
            <Select id="r-type" name="roomTypeId" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          {type?.kind === "DORM" ? (
            <Field label="Beds in this room" htmlFor="r-beds" hint="Each bed is sold separately.">
              <Input id="r-beds" name="beds" type="number" min={1} max={30} defaultValue={room?.beds ?? type.capacity} required />
            </Field>
          ) : (
            <input type="hidden" name="beds" value="1" />
          )}
          <Toggle name="isActive" defaultChecked={room?.isActive ?? true} label="Available for booking" description="Turn off to take the room out of inventory." />
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function BlockDatesForm({ rooms, today }: { rooms: { id: string; number: string }[]; today: string }) {
  return (
    <ActionForm action={addBlockedDates} success="Dates blocked" submitLabel="Block dates" resetOnSuccess className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr_auto] lg:items-end">
      <Field label="Room" htmlFor="b-room">
        <Select id="b-room" name="roomId" required>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              Room {r.number}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="From" htmlFor="b-start">
        <Input id="b-start" name="startDate" type="date" min={today} required />
      </Field>
      <Field label="Until (inclusive)" htmlFor="b-end">
        <Input id="b-end" name="endDate" type="date" min={today} required />
      </Field>
      <Field label="Reason" htmlFor="b-reason">
        <Input id="b-reason" name="reason" placeholder="e.g. Painting, private event" />
      </Field>
    </ActionForm>
  );
}

export function RemoveBlockButton({ id }: { id: string }) {
  const { pending, run } = useStaffAction();
  return (
    <Button size="sm" variant="ghost" className="text-tulip" disabled={pending} onClick={() => run(() => removeBlockedDates(id), "Block removed")}>
      <Trash2 aria-hidden /> Remove
    </Button>
  );
}
