"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createManualReservation } from "@/server/actions/admin/reservations";

export function NewReservationButton({ roomTypes, today }: { roomTypes: { id: string; name: string }[]; today: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [state, action, pending] = useActionState(async (prev: unknown, fd: FormData) => {
    const res = await createManualReservation(prev, fd);
    if (res.ok) {
      toast.success(`Reservation ${res.data.reference} created`);
      setOpen(false);
      router.push(`/admin/reservations/${res.data.id}`);
    }
    return res;
  }, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden /> New reservation
      </Button>
      <DialogContent title="New reservation" description="For walk-ins, phone and email bookings. Availability is checked before saving.">
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in" htmlFor="nr-in">
              <Input id="nr-in" name="checkIn" type="date" min={today} defaultValue={today} required />
            </Field>
            <Field label="Check-out" htmlFor="nr-out">
              <Input id="nr-out" name="checkOut" type="date" min={today} required />
            </Field>
          </div>
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Field label="Room type" htmlFor="nr-type">
              <Select id="nr-type" name="roomTypeId" required>
                {roomTypes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Guests" htmlFor="nr-guests">
              <Input id="nr-guests" name="guests" type="number" min={1} max={20} defaultValue={1} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" htmlFor="nr-first">
              <Input id="nr-first" name="firstName" required />
            </Field>
            <Field label="Last name" htmlFor="nr-last">
              <Input id="nr-last" name="lastName" required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" htmlFor="nr-email">
              <Input id="nr-email" name="email" type="email" required />
            </Field>
            <Field label="Phone" htmlFor="nr-phone">
              <Input id="nr-phone" name="phone" type="tel" />
            </Field>
          </div>
          <Field label="Country" htmlFor="nr-country">
            <Input id="nr-country" name="country" />
          </Field>
          <Field label="Notes" htmlFor="nr-notes">
            <Textarea id="nr-notes" name="notes" rows={2} />
          </Field>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" name="confirmNow" defaultChecked className="size-4 accent-cobalt" /> Confirm immediately and assign beds
          </label>
          {state && !state.ok ? <p role="alert" className="rounded-md bg-tulip-soft px-3 py-2 text-[14px] text-tulip">{state.error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Create reservation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
