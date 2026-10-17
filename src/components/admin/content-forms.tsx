"use client";

import { useState } from "react";
import { Check, Pencil, Plus, RotateCcw } from "lucide-react";
import { useStaffAction } from "@/components/staff/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { deleteFaq, deleteTestimonial, saveFaq, saveHero, saveSettings, saveTestimonial, setMessageHandled } from "@/server/actions/admin/content";
import { ActionForm } from "./action-form";
import { ConfirmDelete } from "./confirm-delete";
import { ImageField } from "./image-field";
import { LocalizedField } from "./localized-field";
import { Toggle } from "./toggle";

export function HeroForm({ hero }: { hero: { title: unknown; subtitle: unknown; image: string } }) {
  return (
    <ActionForm action={saveHero} success="Homepage updated">
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <LocalizedField name="title" label="Headline" value={hero.title} required />
          <LocalizedField name="subtitle" label="Subheading" value={hero.subtitle} multiline rows={2} />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-soft">Background photo</p>
          <ImageField name="image" initial={[hero.image]} />
        </div>
      </div>
    </ActionForm>
  );
}

export function FaqDialog({ faq }: { faq?: { id: string; question: unknown; answer: unknown; sortOrder: number; isActive: boolean } }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {faq ? (
        <Button size="sm" variant="ghost" aria-label="Edit question" onClick={() => setOpen(true)}>
          <Pencil aria-hidden />
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Plus aria-hidden /> Add question
        </Button>
      )}
      <DialogContent title={faq ? "Edit question" : "New question"}>
        <ActionForm action={saveFaq} success="FAQ saved" onSuccess={() => setOpen(false)}>
          {faq ? <input type="hidden" name="id" value={faq.id} /> : null}
          <LocalizedField name="question" label="Question" value={faq?.question} required />
          <LocalizedField name="answer" label="Answer" value={faq?.answer} multiline rows={4} />
          <div className="grid grid-cols-2 items-end gap-3">
            <Field label="Order" htmlFor="faq-order">
              <Input id="faq-order" name="sortOrder" type="number" defaultValue={faq?.sortOrder ?? 10} />
            </Field>
            <Toggle name="isActive" defaultChecked={faq?.isActive ?? true} label="Visible" />
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteFaq({ id }: { id: string }) {
  return <ConfirmDelete label="this question" action={() => deleteFaq(id)} />;
}

type T = { id: string; name: string; origin: string; quote: unknown; isSample: boolean; isActive: boolean; sortOrder: number };

export function TestimonialDialog({ t }: { t?: T }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {t ? (
        <Button size="sm" variant="ghost" aria-label="Edit review" onClick={() => setOpen(true)}>
          <Pencil aria-hidden />
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Plus aria-hidden /> Add review
        </Button>
      )}
      <DialogContent title={t ? "Edit review" : "New review"} description="Only publish reviews from real guests, with their permission. Sample reviews are labelled on the website.">
        <ActionForm action={saveTestimonial} success="Review saved" onSuccess={() => setOpen(false)}>
          {t ? <input type="hidden" name="id" value={t.id} /> : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" htmlFor="t-name">
              <Input id="t-name" name="name" defaultValue={t?.name} required />
            </Field>
            <Field label="From" htmlFor="t-origin">
              <Input id="t-origin" name="origin" defaultValue={t?.origin} placeholder="City or country" />
            </Field>
          </div>
          <LocalizedField name="quote" label="Quote" value={t?.quote} multiline rows={3} required />
          <Field label="Order" htmlFor="t-order">
            <Input id="t-order" name="sortOrder" type="number" defaultValue={t?.sortOrder ?? 10} />
          </Field>
          <Toggle name="isSample" defaultChecked={t?.isSample ?? true} label="Sample / demo review" description="Keep on until this is a real, verified review." />
          <Toggle name="isActive" defaultChecked={t?.isActive ?? true} label="Visible on website" />
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTestimonial({ id }: { id: string }) {
  return <ConfirmDelete label="this review" action={() => deleteTestimonial(id)} />;
}

export function HandledButton({ id, handled }: { id: string; handled: boolean }) {
  const { pending, run } = useStaffAction();
  return (
    <Button size="sm" variant={handled ? "ghost" : "secondary"} disabled={pending} onClick={() => run(() => setMessageHandled(id, !handled), handled ? "Marked as new" : "Marked as handled")}>
      {handled ? <RotateCcw aria-hidden /> : <Check aria-hidden />}
      {handled ? "Reopen" : "Handled"}
    </Button>
  );
}

export type SettingsData = {
  name: string;
  tagline: unknown;
  addressLine: string;
  city: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  mapQuery: string;
  reviewUrl: string;
  isDemo: boolean;
  maxNights: number;
  maxGuests: number;
  priceIST: number;
  priceSAW: number;
};

export function SettingsForm({ s }: { s: SettingsData }) {
  return (
    <ActionForm action={saveSettings} success="Settings saved" className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <div>
          <h3 className="text-[15px] font-semibold">Property</h3>
          <p className="text-[13px] text-slate">Shown in the footer, contact page and guest guide. Replace these to rebrand for another property.</p>
        </div>
        <div className="space-y-3 lg:col-span-2">
          <Field label="Property name" htmlFor="st-name">
            <Input id="st-name" name="name" defaultValue={s.name} required />
          </Field>
          <LocalizedField name="tagline" label="Tagline" value={s.tagline} />
          <Field label="Street address" htmlFor="st-addr">
            <Input id="st-addr" name="addressLine" defaultValue={s.addressLine} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" htmlFor="st-city">
              <Input id="st-city" name="city" defaultValue={s.city} />
            </Field>
            <Field label="Country" htmlFor="st-country">
              <Input id="st-country" name="country" defaultValue={s.country} />
            </Field>
          </div>
          <Field label="Map search text" htmlFor="st-map" hint="Used for the map and directions links.">
            <Input id="st-map" name="mapQuery" defaultValue={s.mapQuery} />
          </Field>
        </div>
      </section>
      <section className="grid gap-4 border-t border-line-soft pt-6 lg:grid-cols-3">
        <div>
          <h3 className="text-[15px] font-semibold">Reception contact</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          <Field label="Phone" htmlFor="st-phone">
            <Input id="st-phone" name="phone" defaultValue={s.phone} required />
          </Field>
          <Field label="WhatsApp" htmlFor="st-wa">
            <Input id="st-wa" name="whatsapp" defaultValue={s.whatsapp} required />
          </Field>
          <Field label="Email" htmlFor="st-email">
            <Input id="st-email" name="email" type="email" defaultValue={s.email} required />
          </Field>
          <Field label="Public review page" htmlFor="st-review" hint="Google, TripAdvisor or similar">
            <Input id="st-review" name="reviewUrl" type="url" defaultValue={s.reviewUrl} />
          </Field>
        </div>
      </section>
      <section className="grid gap-4 border-t border-line-soft pt-6 lg:grid-cols-3">
        <div>
          <h3 className="text-[15px] font-semibold">Booking rules & prices</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          <Field label="Longest online stay (nights)" htmlFor="st-nights">
            <Input id="st-nights" name="maxNights" type="number" min={1} defaultValue={s.maxNights} required />
          </Field>
          <Field label="Most guests per online request" htmlFor="st-guests">
            <Input id="st-guests" name="maxGuests" type="number" min={1} defaultValue={s.maxGuests} required />
          </Field>
          <Field label="Transfer from IST (€ per car)" htmlFor="st-ist">
            <Input id="st-ist" name="priceIST" type="number" min={0} defaultValue={s.priceIST} required />
          </Field>
          <Field label="Transfer from SAW (€ per car)" htmlFor="st-saw">
            <Input id="st-saw" name="priceSAW" type="number" min={0} defaultValue={s.priceSAW} required />
          </Field>
        </div>
      </section>
      <section className="grid gap-4 border-t border-line-soft pt-6 lg:grid-cols-3">
        <div>
          <h3 className="text-[15px] font-semibold">Demo mode</h3>
        </div>
        <div className="lg:col-span-2">
          <Toggle name="isDemo" defaultChecked={s.isDemo} label="Label sample content on the website" description="Turn off once real contact details, prices and reviews are in place." />
        </div>
      </section>
    </ActionForm>
  );
}
