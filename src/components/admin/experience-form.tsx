"use client";

import { useRouter } from "next/navigation";
import { Field, Input, Select } from "@/components/ui/input";
import { saveExperience } from "@/server/actions/admin/experiences";
import { ActionForm } from "./action-form";
import { ImageField } from "./image-field";
import { LocalizedField } from "./localized-field";
import { Toggle } from "./toggle";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type ExperienceData = {
  id?: string;
  title: unknown;
  summary: unknown;
  description: unknown;
  meetingPoint: unknown;
  durationMinutes: number;
  price: number;
  priceUnit: string;
  startTime: string;
  maxParticipants: number;
  availableDays: number[];
  image: string;
  isActive: boolean;
  isTransfer: boolean;
};

export function ExperienceAdminForm({ exp }: { exp: ExperienceData }) {
  const router = useRouter();
  return (
    <ActionForm action={saveExperience} success="Experience saved" onSuccess={(d) => !exp.id && router.push(`/admin/experiences/${d.id}`)} className="space-y-6">
      {exp.id ? <input type="hidden" name="id" value={exp.id} /> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <LocalizedField name="title" label="Title" value={exp.title} required />
          <LocalizedField name="summary" label="One-line summary" value={exp.summary} />
          <LocalizedField name="description" label="Description" value={exp.description} multiline rows={6} />
          <LocalizedField name="meetingPoint" label="Meeting point" value={exp.meetingPoint} />
        </div>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-soft">Image</p>
            <ImageField name="image" initial={exp.image ? [exp.image] : []} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (€)" htmlFor="e-price">
              <Input id="e-price" name="price" type="number" min={0} step="0.5" defaultValue={exp.price} required />
            </Field>
            <Field label="Priced" htmlFor="e-unit">
              <Select id="e-unit" name="priceUnit" defaultValue={exp.priceUnit}>
                <option value="PERSON">Per person</option>
                <option value="GROUP">Per group / vehicle</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Duration (min)" htmlFor="e-dur">
              <Input id="e-dur" name="durationMinutes" type="number" min={10} defaultValue={exp.durationMinutes} required />
            </Field>
            <Field label="Start time" htmlFor="e-start">
              <Input id="e-start" name="startTime" type="time" defaultValue={exp.startTime} required />
            </Field>
            <Field label="Max people" htmlFor="e-max">
              <Input id="e-max" name="maxParticipants" type="number" min={1} defaultValue={exp.maxParticipants} required />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink-soft">Runs on</legend>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <label key={d} className="cursor-pointer">
                  <input type="checkbox" name="availableDays" value={d} defaultChecked={exp.availableDays.includes(d)} className="peer sr-only" />
                  <span className="inline-block rounded-md border border-line px-3 py-1.5 text-[13px] peer-checked:border-cobalt peer-checked:bg-cobalt-soft peer-checked:text-cobalt peer-focus-visible:outline-2 peer-focus-visible:outline-cobalt">
                    {DAYS[d]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Toggle name="isActive" defaultChecked={exp.isActive} label="Bookable on website and guest guide" />
          <Toggle name="isTransfer" defaultChecked={exp.isTransfer} label="This is an airport transfer" description="Shows the flight-details form instead of the tour form." />
        </div>
      </div>
    </ActionForm>
  );
}
