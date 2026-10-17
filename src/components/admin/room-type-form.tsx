"use client";

import { useRouter } from "next/navigation";
import { Field, Input, Select } from "@/components/ui/input";
import { saveRoomType } from "@/server/actions/admin/rooms";
import { ActionForm } from "./action-form";
import { ImageField } from "./image-field";
import { LocalizedField } from "./localized-field";
import { Toggle } from "./toggle";

const AMENITIES: [string, string][] = [
  ["wifi", "Wi-Fi"],
  ["locker", "Personal locker"],
  ["curtain", "Privacy curtain"],
  ["readingLight", "Reading light"],
  ["outlet", "Power & USB"],
  ["ac", "Air conditioning"],
  ["ensuite", "Private bathroom"],
  ["sharedBath", "Shared bathroom"],
  ["towels", "Towels included"],
  ["desk", "Work desk"],
  ["view", "City view"],
  ["kettle", "Kettle & tea"],
  ["balcony", "Balcony"],
  ["hairdryer", "Hair dryer"],
  ["mirror", "Vanity mirror"],
  ["blackout", "Blackout blinds"],
];

export type RoomTypeData = {
  id?: string;
  name: unknown;
  summary: unknown;
  description: unknown;
  bedSummary: unknown;
  basePrice: number;
  capacity: number;
  sizeSqm: number | null;
  amenities: string[];
  images: string[];
  isActive: boolean;
  kind: "DORM" | "PRIVATE";
  genderPolicy: "MIXED" | "FEMALE";
};

export function RoomTypeForm({ type }: { type: RoomTypeData }) {
  const router = useRouter();
  return (
    <ActionForm action={saveRoomType} success="Room type saved — the website is updated" onSuccess={() => !type.id && router.push("/admin/rooms")} className="space-y-6">
      {type.id ? <input type="hidden" name="id" value={type.id} /> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <LocalizedField name="name" label="Name" value={type.name} required />
          <LocalizedField name="summary" label="Short summary" value={type.summary} />
          <LocalizedField name="description" label="Description" value={type.description} multiline rows={5} />
          <LocalizedField name="bedSummary" label="Bed setup" value={type.bedSummary} hint="e.g. 3 bunk beds (6 beds)" />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" htmlFor="rt-kind">
              <Select id="rt-kind" name="kind" defaultValue={type.kind}>
                <option value="DORM">Dormitory (sell beds)</option>
                <option value="PRIVATE">Private room (sell rooms)</option>
              </Select>
            </Field>
            <Field label="Who can book" htmlFor="rt-gender">
              <Select id="rt-gender" name="genderPolicy" defaultValue={type.genderPolicy}>
                <option value="MIXED">Everyone</option>
                <option value="FEMALE">Women only</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Price / night (€)" htmlFor="rt-price">
              <Input id="rt-price" name="basePrice" type="number" step="0.5" min={0} defaultValue={type.basePrice} required />
            </Field>
            <Field label="Capacity" htmlFor="rt-cap" hint="beds or guests">
              <Input id="rt-cap" name="capacity" type="number" min={1} max={30} defaultValue={type.capacity} required />
            </Field>
            <Field label="Size (m²)" htmlFor="rt-size">
              <Input id="rt-size" name="sizeSqm" type="number" min={1} defaultValue={type.sizeSqm ?? ""} />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink-soft">Amenities</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {AMENITIES.map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-[13.5px]">
                  <input type="checkbox" name="amenities" value={k} defaultChecked={type.amenities.includes(k)} className="size-4 accent-cobalt" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-soft">Photos</p>
            <ImageField name="images" initial={type.images} multiple />
          </div>
          <Toggle name="isActive" defaultChecked={type.isActive} label="Show on website and accept bookings" />
        </div>
      </div>
    </ActionForm>
  );
}
