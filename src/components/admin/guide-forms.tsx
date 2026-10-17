"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { guideIcons } from "@/components/site/guide-icon";
import { useStaffAction } from "@/components/staff/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { deleteGuideItem, deletePlace, saveGuideConfig, saveGuideItem, savePlace, setServiceRequestStatus } from "@/server/actions/admin/guide";
import { ActionForm } from "./action-form";
import { ConfirmDelete } from "./confirm-delete";
import { ImageField } from "./image-field";
import { LocalizedField } from "./localized-field";
import { Toggle } from "./toggle";

type L = unknown;

export type GuideConfigData = {
  welcomeNote: L;
  wifiNetwork: string;
  wifiPassword: string;
  breakfastStart: string;
  breakfastEnd: string;
  breakfastLocation: L;
  breakfastMenu: L;
  luggageInfo: L;
  quietHoursStart: string;
  quietHoursEnd: string;
  smokingPolicy: L;
  checkoutSteps: L;
  receptionHours: L;
  checkInTime: string;
  checkOutTime: string;
};

export function GuideConfigForm({ c }: { c: GuideConfigData }) {
  return (
    <ActionForm action={saveGuideConfig} success="Guest guide updated — live for guests now" className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <div>
          <h3 className="text-[15px] font-semibold">Wi-Fi</h3>
          <p className="text-[13px] text-slate">Guests can copy the password with one tap.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          <Field label="Network name" htmlFor="g-net">
            <Input id="g-net" name="wifiNetwork" defaultValue={c.wifiNetwork} required />
          </Field>
          <Field label="Password" htmlFor="g-pw">
            <Input id="g-pw" name="wifiPassword" defaultValue={c.wifiPassword} required className="font-mono" />
          </Field>
        </div>
      </section>
      <section className="grid gap-4 border-t border-line-soft pt-6 lg:grid-cols-3">
        <div>
          <h3 className="text-[15px] font-semibold">Breakfast</h3>
        </div>
        <div className="space-y-3 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" htmlFor="g-bs">
              <Input id="g-bs" name="breakfastStart" type="time" defaultValue={c.breakfastStart} required />
            </Field>
            <Field label="Until" htmlFor="g-be">
              <Input id="g-be" name="breakfastEnd" type="time" defaultValue={c.breakfastEnd} required />
            </Field>
          </div>
          <LocalizedField name="breakfastLocation" label="Where" value={c.breakfastLocation} />
          <LocalizedField name="breakfastMenu" label="Menu" value={c.breakfastMenu} multiline rows={2} />
        </div>
      </section>
      <section className="grid gap-4 border-t border-line-soft pt-6 lg:grid-cols-3">
        <div>
          <h3 className="text-[15px] font-semibold">Check-in & check-out</h3>
        </div>
        <div className="space-y-3 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in from" htmlFor="g-ci">
              <Input id="g-ci" name="checkInTime" type="time" defaultValue={c.checkInTime} required />
            </Field>
            <Field label="Check-out until" htmlFor="g-co">
              <Input id="g-co" name="checkOutTime" type="time" defaultValue={c.checkOutTime} required />
            </Field>
          </div>
          <LocalizedField name="luggageInfo" label="Luggage storage" value={c.luggageInfo} multiline rows={2} />
          <LocalizedField name="checkoutSteps" label="Check-out steps" value={c.checkoutSteps} multiline rows={4} hint="One step per line." />
        </div>
      </section>
      <section className="grid gap-4 border-t border-line-soft pt-6 lg:grid-cols-3">
        <div>
          <h3 className="text-[15px] font-semibold">House rules & reception</h3>
        </div>
        <div className="space-y-3 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quiet hours from" htmlFor="g-qs">
              <Input id="g-qs" name="quietHoursStart" type="time" defaultValue={c.quietHoursStart} required />
            </Field>
            <Field label="Quiet hours until" htmlFor="g-qe">
              <Input id="g-qe" name="quietHoursEnd" type="time" defaultValue={c.quietHoursEnd} required />
            </Field>
          </div>
          <LocalizedField name="smokingPolicy" label="Smoking policy" value={c.smokingPolicy} multiline rows={2} />
          <LocalizedField name="receptionHours" label="Reception hours" value={c.receptionHours} />
          <LocalizedField name="welcomeNote" label="Welcome note" value={c.welcomeNote} multiline rows={2} />
        </div>
      </section>
    </ActionForm>
  );
}

const SECTIONS = { FACILITY: "Facility", RULE: "House rule", TRANSPORT: "Transport tip" } as const;

export type GuideItemData = { id?: string; section: keyof typeof SECTIONS; icon: string; title: L; body: L; sortOrder: number; isActive: boolean };

export function GuideItemDialog({ item, section }: { item?: GuideItemData; section: keyof typeof SECTIONS }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {item ? (
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label="Edit">
          <Pencil aria-hidden />
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Plus aria-hidden /> Add {SECTIONS[section].toLowerCase()}
        </Button>
      )}
      <DialogContent title={item ? `Edit ${SECTIONS[section].toLowerCase()}` : `New ${SECTIONS[section].toLowerCase()}`}>
        <ActionForm action={saveGuideItem} success="Saved — live in the guest guide" onSuccess={() => setOpen(false)}>
          {item?.id ? <input type="hidden" name="id" value={item.id} /> : null}
          <input type="hidden" name="section" value={section} />
          <LocalizedField name="title" label="Title" value={item?.title} required />
          <LocalizedField name="body" label="Text" value={item?.body} multiline rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Icon" htmlFor="gi-icon">
              <Select id="gi-icon" name="icon" defaultValue={item?.icon ?? "info"}>
                {Object.keys(guideIcons).map((k) => (
                  <option key={k} value={k}>
                    {k.replace(/-/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Order" htmlFor="gi-order">
              <Input id="gi-order" name="sortOrder" type="number" defaultValue={item?.sortOrder ?? 10} />
            </Field>
          </div>
          <Toggle name="isActive" defaultChecked={item?.isActive ?? true} label="Visible to guests" />
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteGuideItem({ id, label }: { id: string; label: string }) {
  return <ConfirmDelete label={label} action={() => deleteGuideItem(id)} />;
}

export type PlaceData = {
  id?: string;
  name: string;
  category: string;
  area: string;
  description: L;
  walkingMinutes: number | null;
  transitNote: L;
  mapQuery: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function PlaceDialog({ place }: { place?: PlaceData }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {place ? (
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={`Edit ${place.name}`}>
          <Pencil aria-hidden />
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Plus aria-hidden /> Add place
        </Button>
      )}
      <DialogContent title={place ? `Edit ${place.name}` : "New recommendation"}>
        <ActionForm action={savePlace} success="Saved — live on the website and guest guide" onSuccess={() => setOpen(false)}>
          {place?.id ? <input type="hidden" name="id" value={place.id} /> : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" htmlFor="p-name">
              <Input id="p-name" name="name" defaultValue={place?.name} required />
            </Field>
            <Field label="Category" htmlFor="p-cat">
              <Select id="p-cat" name="category" defaultValue={place?.category ?? "ATTRACTION"}>
                <option value="ATTRACTION">Sight</option>
                <option value="NEIGHBORHOOD">Neighbourhood</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="CAFE">Café</option>
                <option value="NIGHTLIFE">Nightlife</option>
              </Select>
            </Field>
          </div>
          <LocalizedField name="description" label="Why we recommend it" value={place?.description} multiline rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Area" htmlFor="p-area">
              <Input id="p-area" name="area" defaultValue={place?.area} placeholder="e.g. Karaköy" />
            </Field>
            <Field label="Walk from hostel (min)" htmlFor="p-walk">
              <Input id="p-walk" name="walkingMinutes" type="number" min={1} defaultValue={place?.walkingMinutes ?? ""} />
            </Field>
          </div>
          <LocalizedField name="transitNote" label="Transport note (if not walkable)" value={place?.transitNote} />
          <Field label="Google Maps search text" htmlFor="p-map">
            <Input id="p-map" name="mapQuery" defaultValue={place?.mapQuery} placeholder="e.g. Galata Tower Istanbul" />
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-soft">Photo</p>
            <ImageField name="image" initial={place?.image ? [place.image] : []} />
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <Field label="Order" htmlFor="p-order">
              <Input id="p-order" name="sortOrder" type="number" defaultValue={place?.sortOrder ?? 20} />
            </Field>
            <Toggle name="isActive" defaultChecked={place?.isActive ?? true} label="Visible" />
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function DeletePlace({ id, label }: { id: string; label: string }) {
  return <ConfirmDelete label={label} action={() => deletePlace(id)} />;
}

export function ServiceRequestButtons({ id, status }: { id: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" }) {
  const { pending, run } = useStaffAction();
  return (
    <div className="flex gap-1.5">
      {status === "OPEN" ? (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setServiceRequestStatus(id, "IN_PROGRESS"), "Marked in progress")}>
          Start
        </Button>
      ) : null}
      {status !== "RESOLVED" ? (
        <Button size="sm" disabled={pending} onClick={() => run(() => setServiceRequestStatus(id, "RESOLVED"), "Resolved — the guest sees it as done")}>
          Resolve
        </Button>
      ) : (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setServiceRequestStatus(id, "OPEN"), "Reopened")}>
          Reopen
        </Button>
      )}
    </div>
  );
}
