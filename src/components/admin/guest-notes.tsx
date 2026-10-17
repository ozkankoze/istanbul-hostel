"use client";

import { useState } from "react";
import { useStaffAction } from "@/components/staff/use-action";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { updateGuestNotes } from "@/server/actions/admin/people";

export function GuestNotes({ id, initial }: { id: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const { pending, run } = useStaffAction();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateGuestNotes({ id, notes }), "Notes saved");
      }}
    >
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} aria-label="Guest notes" placeholder="Preferences, allergies, anything the team should know" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending || notes === initial}>
        Save notes
      </Button>
    </form>
  );
}
