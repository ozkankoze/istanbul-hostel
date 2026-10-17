"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useStaffAction } from "@/components/staff/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { ActionResult } from "@/server/actions/types";

export function ConfirmDelete({ label, action, success = "Deleted" }: { label: string; action: () => Promise<ActionResult>; success?: string }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useStaffAction();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" className="text-tulip" onClick={() => setOpen(true)} aria-label={`Delete ${label}`}>
        <Trash2 aria-hidden />
      </Button>
      <DialogContent title={`Delete ${label}?`} description="This can't be undone.">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Keep it
          </Button>
          <Button variant="danger" disabled={pending} onClick={() => run(action, success, () => setOpen(false))}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
