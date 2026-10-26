"use client";

import { useState } from "react";
import { Check, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { confirmReservationAction, setReservationStatus } from "@/server/actions/admin/reservations";
import { useStaffText } from "./staff-lang";
import { useStaffAction } from "./use-action";

type Status = "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";

/** Confirm / decline a request, or check a departing guest out. */
export function BookingActions({ id, status, reference, departing }: { id: string; status: Status; reference: string; departing?: boolean }) {
  const { t: all } = useStaffText();
  const t = all.bookings;
  const { pending, run } = useStaffAction();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  if (status === "PENDING")
    return (
      <>
        <Button disabled={pending} onClick={() => run(() => confirmReservationAction(id), t.confirmed(reference))}>
          <Check aria-hidden /> {t.confirm}
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => setDeclining(true)}>
          <X aria-hidden /> {t.decline}
        </Button>
        <Dialog open={declining} onOpenChange={setDeclining}>
          <DialogContent title={t.declineTitle(reference)} description={t.declineDesc}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => setReservationStatus({ id, status: "DECLINED", reason }), t.declined(reference), () => {
                  setDeclining(false);
                  setReason("");
                });
              }}
            >
              <Field label={t.reason} htmlFor={`reason-${id}`}>
                <Textarea id={`reason-${id}`} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.reasonPh} />
              </Field>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setDeclining(false)}>
                  {t.back}
                </Button>
                <Button type="submit" variant="danger" disabled={pending}>
                  {t.declineSubmit}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  if (status === "CONFIRMED" && departing)
    return (
      <Button disabled={pending} onClick={() => run(() => setReservationStatus({ id, status: "COMPLETED" }), t.checkedOut(reference))}>
        <LogOut aria-hidden /> {t.checkOut}
      </Button>
    );
  return null;
}
