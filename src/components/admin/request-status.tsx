"use client";

import { Check, CheckCheck, X } from "lucide-react";
import { useStaffAction } from "@/components/staff/use-action";
import { Button } from "@/components/ui/button";
import { setExperienceBookingStatus, setTransferStatus, toggleExperience } from "@/server/actions/admin/experiences";

export function RequestStatusButtons({ id, status, kind, reference }: { id: string; status: string; kind: "tour" | "transfer"; reference: string }) {
  const { pending, run } = useStaffAction();
  const fn = kind === "tour" ? setExperienceBookingStatus : setTransferStatus;
  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "PENDING" ? (
        <>
          <Button size="sm" disabled={pending} onClick={() => run(() => fn(id, "CONFIRMED"), `${reference} confirmed`)}>
            <Check aria-hidden /> Confirm
          </Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => fn(id, "DECLINED"), `${reference} declined`)}>
            <X aria-hidden /> Decline
          </Button>
        </>
      ) : null}
      {status === "CONFIRMED" ? (
        <>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => fn(id, "COMPLETED"), `${reference} completed`)}>
            <CheckCheck aria-hidden /> Complete
          </Button>
          <Button size="sm" variant="ghost" className="text-tulip" disabled={pending} onClick={() => run(() => fn(id, "CANCELLED"), `${reference} cancelled`)}>
            Cancel
          </Button>
        </>
      ) : null}
    </div>
  );
}

export function ExperienceToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const { pending, run } = useStaffAction();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={isActive ? "Disable experience" : "Enable experience"}
      disabled={pending}
      onClick={() => run(() => toggleExperience(id, !isActive), isActive ? "Experience hidden from website" : "Experience is live")}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${isActive ? "bg-tile" : "bg-line"}`}
    >
      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}
