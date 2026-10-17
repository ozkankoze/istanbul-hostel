"use client";

import { useState } from "react";
import { Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useStaffAction } from "@/components/staff/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { createMissingRoomQrs, createQr, deleteQr } from "@/server/actions/admin/qr";
import { ActionForm } from "./action-form";
import { ConfirmDelete } from "./confirm-delete";

export function NewQrButton({ rooms }: { rooms: { id: string; number: string }[] }) {
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden /> New QR code
      </Button>
      <DialogContent title="New QR code" description="Room codes open the guest guide with that room selected. Room numbers are informational only — guests still verify their stay for private requests.">
        <ActionForm action={createQr} success="QR code created" submitLabel="Create QR code" onSuccess={() => setOpen(false)}>
          <Field label="For room" htmlFor="q-room">
            <Select id="q-room" name="roomId" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="">No room — custom link</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.number}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Label" htmlFor="q-label" hint={roomId ? "Leave empty to use the room number." : "e.g. Breakfast table, Lobby poster"}>
            <Input id="q-label" name="label" required={!roomId} />
          </Field>
          {!roomId ? (
            <Field label="Opens" htmlFor="q-path" hint="A page on this site. /guest picks the guest's language automatically.">
              <Input id="q-path" name="path" defaultValue="/guest" required />
            </Field>
          ) : null}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function GenerateRoomQrsButton() {
  const { pending, run } = useStaffAction();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => run(() => createMissingRoomQrs(), undefined, (d) => toast.success(d.created ? `Created ${d.created} room codes` : "Every room already has a code"))}
      title="Create codes for rooms that don't have one yet"
    >
      <Wand2 aria-hidden /> Codes for all rooms
    </Button>
  );
}

export function DeleteQr({ id, label }: { id: string; label: string }) {
  return <ConfirmDelete label={`QR code "${label}"`} action={() => deleteQr(id)} />;
}
