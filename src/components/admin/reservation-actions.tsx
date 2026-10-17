"use client";

import { useState } from "react";
import { Ban, Check, CheckCheck, X } from "lucide-react";
import { useStaffAction } from "@/components/staff/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { confirmReservationAction, setReservationStatus } from "@/server/actions/admin/reservations";

type Status = "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";

export function ReservationActions({ id, status, reference, size = "sm" }: { id: string; status: Status; reference: string; size?: "sm" | "md" }) {
  const { pending, run } = useStaffAction();
  const [dialog, setDialog] = useState<null | "DECLINED" | "CANCELLED">(null);
  const [reason, setReason] = useState("");

  return (
    <div className="flex flex-nowrap gap-1.5">
      {status === "PENDING" ? (
        <>
          <Button size={size} disabled={pending} onClick={() => run(() => confirmReservationAction(id), `${reference} confirmed — beds assigned`)}>
            <Check aria-hidden /> Confirm
          </Button>
          <Button size={size} variant="secondary" disabled={pending} onClick={() => setDialog("DECLINED")}>
            <X aria-hidden /> Decline
          </Button>
        </>
      ) : null}
      {status === "CONFIRMED" ? (
        <>
          <Button size={size} variant="secondary" disabled={pending} onClick={() => run(() => setReservationStatus({ id, status: "COMPLETED" }), `${reference} marked completed`)}>
            <CheckCheck aria-hidden /> Complete
          </Button>
          <Button size={size} variant="ghost" className="text-tulip" disabled={pending} onClick={() => setDialog("CANCELLED")}>
            <Ban aria-hidden /> Cancel
          </Button>
        </>
      ) : null}
      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent
          title={dialog === "DECLINED" ? `Decline ${reference}?` : `Cancel ${reference}?`}
          description={dialog === "CANCELLED" ? "The assigned beds will be released and become bookable again." : "The guest's request will be marked as declined."}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const status = dialog!;
              run(() => setReservationStatus({ id, status, reason }), status === "DECLINED" ? `${reference} declined` : `${reference} cancelled`, () => {
                setDialog(null);
                setReason("");
              });
            }}
            className="space-y-4"
          >
            <Field label="Reason (optional, internal)" htmlFor="reason">
              <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fully booked, guest asked to cancel" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
                Keep it
              </Button>
              <Button type="submit" variant="danger" disabled={pending}>
                {dialog === "DECLINED" ? "Decline request" : "Cancel reservation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
