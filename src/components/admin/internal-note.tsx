"use client";

import { useState } from "react";
import { useStaffAction } from "@/components/staff/use-action";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { updateReservationNote } from "@/server/actions/admin/reservations";

export function InternalNote({ id, initial }: { id: string; initial: string }) {
  const [note, setNote] = useState(initial);
  const { pending, run } = useStaffAction();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateReservationNote({ id, note }), "Note saved");
      }}
      className="space-y-3"
    >
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Paid deposit by bank transfer, prefers lower bunk" aria-label="Internal note" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending || note === initial}>
        Save note
      </Button>
    </form>
  );
}
