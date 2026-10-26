"use client";

import { LogOut } from "lucide-react";
import { ReservationActions } from "@/components/admin/reservation-actions";
import { Button } from "@/components/ui/button";
import { setReservationStatus } from "@/server/actions/admin/reservations";
import { useStaffAction } from "./use-action";

type Status = "PENDING" | "CONFIRMED" | "DECLINED" | "CANCELLED" | "COMPLETED";

/** Confirm / decline a request, or check a departing guest out. */
export function BookingActions({ id, status, reference, departing }: { id: string; status: Status; reference: string; departing?: boolean }) {
  const { pending, run } = useStaffAction();
  if (status === "PENDING") return <ReservationActions id={id} status={status} reference={reference} size="md" />;
  if (status === "CONFIRMED" && departing)
    return (
      <Button disabled={pending} onClick={() => run(() => setReservationStatus({ id, status: "COMPLETED" }), `${reference} checked out`)}>
        <LogOut aria-hidden /> Check out
      </Button>
    );
  return null;
}
