"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BedDouble, Check, Users } from "lucide-react";
import { SuccessPanel } from "@/components/forms/success-panel";
import { useFormAction } from "@/components/forms/use-form-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FieldError, Input, Select, Textarea } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/config";
import { plural } from "@/i18n/plural";
import { href } from "@/lib/links";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { createReservationRequest, type ReservationReceipt } from "@/server/actions/booking";

export type BookingOption = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  bedSummary: string;
  image: string;
  kind: "DORM" | "PRIVATE";
  female: boolean;
  capacity: number;
  freeUnits: number;
  unitsNeeded: number;
  fits: boolean;
  nightlyPrice: number;
  total: number;
};

type Stay = { checkIn: string; checkOut: string; guests: number; nights: number };
type Step = "room" | "details" | "review" | "done";

type Details = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  arrivalTime: string;
  specialRequests: string;
  femaleConfirm: boolean;
  acceptTerms: boolean;
};

const emptyDetails: Details = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  arrivalTime: "",
  specialRequests: "",
  femaleConfirm: false,
  acceptTerms: false,
};

const ARRIVAL_SLOTS = ["", "08:00–12:00", "12:00–14:00", "14:00–17:00", "17:00–20:00", "20:00–23:00", "23:00+"];

export function BookingFlow({ stay, options, preselect }: { stay: Stay; options: BookingOption[]; preselect?: string }) {
  const { locale, dict } = useI18n();
  const t = dict.booking;
  const v = dict.validation;
  const initial = options.find((o) => o.slug === preselect && o.fits);
  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null);
  const [step, setStep] = useState<Step>("room");
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { pending, errors: serverErrors, formError, result, run } = useFormAction<ReservationReceipt>();
  const topRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === selectedId) ?? null;
  const errors = { ...serverErrors, ...localErrors };

  useEffect(() => {
    if (step !== "room") topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const nightsLabel = plural(locale, dict.common.nights, stay.nights);
  const guestsLabel = plural(locale, dict.common.guests, stay.guests);
  const dateRange = `${formatDate(stay.checkIn, locale, { weekday: "short", year: undefined })} – ${formatDate(stay.checkOut, locale, { weekday: "short" })}`;
  const anyFits = options.some((o) => o.fits);

  function unitsLabel(o: BookingOption, n: number) {
    return o.kind === "DORM" ? plural(locale, dict.common.beds, n) : plural(locale, dict.common.rooms, n);
  }

  function set<K extends keyof Details>(key: K, value: Details[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
    if (localErrors[key]) setLocalErrors((e) => ({ ...e, [key]: "" }));
  }

  function validateDetails() {
    const e: Record<string, string> = {};
    if (!details.firstName.trim()) e.firstName = v.required;
    if (!details.lastName.trim()) e.lastName = v.required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) e.email = v.email;
    if (!/^[+\d][\d\s()-]{5,}$/.test(details.phone.trim())) e.phone = v.phone;
    if (selected?.female && !details.femaleConfirm) e.femaleConfirm = v.female;
    if (!details.acceptTerms) e.acceptTerms = v.terms;
    setLocalErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!selected) return;
    run(
      () =>
        createReservationRequest(locale, {
          ...stay,
          roomTypeId: selected.id,
          ...details,
        }),
      () => setStep("done"),
      // If the room was taken in the meantime, send the guest back to choose another.
      (error) => {
        if (error === v.unavailable) setStep("room");
      },
    );
  }

  const stepIndex = { room: 2, details: 3, review: 4, done: 5 }[step];

  if (step === "done" && result) {
    return (
      <div ref={topRef} className="mx-auto max-w-2xl scroll-mt-28">
        <SuccessPanel
          title={t.confirmationTitle}
          body={format(t.confirmationBody, { name: result.firstName, email: result.email })}
          reference={result.reference}
          referenceLabel={t.reference}
        >
          <p className="mt-3 text-[13.5px] text-slate">{t.referenceHint}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 text-[14.5px]">
            <div>
              <dt className="text-[12.5px] text-slate">{t.room}</dt>
              <dd className="mt-0.5 font-medium">{selected?.name}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-slate">{t.stay}</dt>
              <dd className="mt-0.5 font-medium">{dateRange}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-slate">{t.status}</dt>
              <dd className="mt-0.5">
                <Badge tone="saffron" dot>
                  {t.pending}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-slate">{t.total}</dt>
              <dd className="mt-0.5 font-medium">{formatMoney(result.total, "EUR", locale)}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href={href(locale, "/guest")}>{dict.nav.guestGuide}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={href(locale, "/book")}>{t.newSearch}</Link>
            </Button>
          </div>
        </SuccessPanel>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      {/* Progress */}
      <ol className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13.5px]" aria-label="Progress">
        {t.steps.map((label, i) => {
          const n = i + 1;
          const done = n < stepIndex || n === 1;
          const current = n === stepIndex;
          return (
            <li key={label} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-[12px] font-semibold",
                  current ? "border-cobalt bg-cobalt text-white" : done ? "border-tile bg-tile text-white" : "border-line text-mist",
                )}
              >
                {done && !current ? <Check aria-hidden className="size-3.5" /> : n}
              </span>
              <span className={cn(current ? "font-medium text-ink" : "text-slate")}>{label}</span>
              {n < t.steps.length ? <span aria-hidden className="mx-1 h-px w-6 bg-line md:w-10" /> : null}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {step === "room" ? (
            <section aria-labelledby="choose-room">
              <h2 id="choose-room" className="font-display text-[28px]">
                {t.steps[1]}
              </h2>
              <p className="mt-1 text-[14.5px] text-slate">
                {dateRange} · {nightsLabel} · {guestsLabel}
              </p>
              {formError === v.unavailable ? (
                <p role="alert" className="mt-4 rounded-md bg-tulip-soft px-4 py-3 text-[14px] text-tulip">
                  {formError}
                </p>
              ) : null}
              {!anyFits ? (
                <p className="mt-6 rounded-md border border-line bg-paper px-5 py-4 text-[15px] text-slate">{t.noResults}</p>
              ) : null}
              <ul className="mt-6 space-y-4">
                {options.map((o) => {
                  const isSel = o.id === selectedId;
                  return (
                    <li key={o.id}>
                      <div
                        className={cn(
                          "grid gap-4 rounded-lg border bg-paper p-3 transition-colors sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr_auto] md:items-center md:gap-6",
                          isSel ? "border-cobalt ring-2 ring-cobalt/15" : "border-line",
                          !o.fits && "opacity-60",
                        )}
                      >
                        <div className="relative aspect-[4/3] overflow-hidden rounded-md sm:aspect-auto sm:h-full sm:min-h-[130px]">
                          <Image src={o.image} alt="" fill sizes="220px" className="object-cover" />
                        </div>
                        <div className="px-1 sm:py-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[18px] font-semibold">{o.name}</h3>
                            {o.female ? <Badge tone="tulip">{dict.rooms.femaleOnly}</Badge> : null}
                          </div>
                          <p className="mt-1 text-[14px] leading-relaxed text-slate">{o.summary}</p>
                          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
                            <span className="inline-flex items-center gap-1.5">
                              <BedDouble aria-hidden className="size-3.5 text-slate" /> {o.bedSummary}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Users aria-hidden className="size-3.5 text-slate" />
                              {o.kind === "DORM"
                                ? format(dict.rooms.capacityDorm, { count: o.capacity })
                                : format(dict.rooms.capacityPrivate, { count: o.capacity })}
                            </span>
                          </p>
                          <p className="mt-2 text-[13px]">
                            {o.fits ? (
                              <span className="inline-flex items-center gap-1.5 text-tile">
                                <span aria-hidden className="size-1.5 rounded-full bg-tile" />
                                {t.available} · {format(t.leftCount, { count: unitsLabel(o, o.freeUnits) })}
                              </span>
                            ) : o.freeUnits === 0 ? (
                              <span className="text-tulip">{t.unavailable}</span>
                            ) : (
                              <span className="text-tulip">{format(t.notEnough, { guests: guestsLabel })}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-end justify-between gap-4 border-t border-line-soft px-1 pt-3 sm:col-span-2 md:col-span-1 md:flex-col md:items-end md:border-0 md:pt-0 md:text-right">
                          <div>
                            <p className="font-display text-[26px] leading-none">{formatMoney(o.total, "EUR", locale)}</p>
                            <p className="mt-1 text-[12.5px] text-slate">
                              {format(t.priceBreakdown, {
                                price: formatMoney(o.nightlyPrice, "EUR", locale),
                                units: unitsLabel(o, o.unitsNeeded),
                                nights: nightsLabel,
                              })}
                            </p>
                          </div>
                          <Button
                            variant={isSel ? "primary" : "secondary"}
                            disabled={!o.fits}
                            aria-pressed={isSel}
                            onClick={() => setSelectedId(o.id)}
                            className="md:mt-3"
                          >
                            {isSel ? (
                              <>
                                <Check aria-hidden /> {t.selected}
                              </>
                            ) : (
                              t.select
                            )}
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {step === "details" && selected ? (
            <section aria-labelledby="details-h">
              <h2 id="details-h" className="font-display text-[28px]">
                {t.yourDetails}
              </h2>
              <form
                noValidate
                className="mt-6 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (validateDetails()) setStep("review");
                }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t.firstName} htmlFor="b-first" error={errors.firstName}>
                    <Input id="b-first" autoComplete="given-name" value={details.firstName} onChange={(e) => set("firstName", e.target.value)} aria-invalid={!!errors.firstName} required />
                  </Field>
                  <Field label={t.lastName} htmlFor="b-last" error={errors.lastName}>
                    <Input id="b-last" autoComplete="family-name" value={details.lastName} onChange={(e) => set("lastName", e.target.value)} aria-invalid={!!errors.lastName} required />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t.email} htmlFor="b-email" error={errors.email}>
                    <Input id="b-email" type="email" autoComplete="email" value={details.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} required />
                  </Field>
                  <Field label={t.phone} htmlFor="b-phone" error={errors.phone} hint={t.phoneHint}>
                    <Input id="b-phone" type="tel" autoComplete="tel" value={details.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={!!errors.phone} required />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={`${t.country} (${dict.common.optional})`} htmlFor="b-country">
                    <Input id="b-country" autoComplete="country-name" value={details.country} onChange={(e) => set("country", e.target.value)} />
                  </Field>
                  <Field label={`${t.arrivalTime} (${dict.common.optional})`} htmlFor="b-arrival">
                    <Select id="b-arrival" value={details.arrivalTime} onChange={(e) => set("arrivalTime", e.target.value)}>
                      {ARRIVAL_SLOTS.map((s) => (
                        <option key={s} value={s}>
                          {s || "—"}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label={`${t.specialRequests} (${dict.common.optional})`} htmlFor="b-notes" hint={t.specialRequestsHint}>
                  <Textarea id="b-notes" rows={3} value={details.specialRequests} onChange={(e) => set("specialRequests", e.target.value)} />
                </Field>
                <div className="space-y-3 border-t border-line pt-5">
                  {selected.female ? (
                    <div>
                      <label className="flex items-start gap-3 text-[14.5px]">
                        <Checkbox checked={details.femaleConfirm} onChange={(e) => set("femaleConfirm", e.target.checked)} className="mt-0.5" aria-invalid={!!errors.femaleConfirm} />
                        {t.femaleConfirm}
                      </label>
                      <FieldError>{errors.femaleConfirm}</FieldError>
                    </div>
                  ) : null}
                  <div>
                    <label className="flex items-start gap-3 text-[14.5px]">
                      <Checkbox checked={details.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} className="mt-0.5" aria-invalid={!!errors.acceptTerms} />
                      <span>
                        {t.acceptTerms}{" "}
                        <Link href={href(locale, "/terms")} target="_blank" className="text-cobalt underline underline-offset-2">
                          {dict.nav.terms}
                        </Link>
                        {" · "}
                        <Link href={href(locale, "/privacy")} target="_blank" className="text-cobalt underline underline-offset-2">
                          {dict.nav.privacy}
                        </Link>
                      </span>
                    </label>
                    <FieldError>{errors.acceptTerms}</FieldError>
                  </div>
                </div>
                <div className="flex flex-wrap justify-between gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setStep("room")}>
                    <ArrowLeft aria-hidden /> {dict.common.back}
                  </Button>
                  <Button type="submit" size="lg">
                    {dict.common.continue}
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          {step === "review" && selected ? (
            <section aria-labelledby="review-h">
              <h2 id="review-h" className="font-display text-[28px]">
                {t.review}
              </h2>
              <p className="mt-1 text-[14.5px] text-slate">{t.reviewIntro}</p>
              <dl className="mt-6 divide-y divide-line rounded-lg border border-line bg-paper">
                {[
                  { label: t.stay, value: `${dateRange} · ${nightsLabel}`, edit: null },
                  { label: t.room, value: `${selected.name} · ${unitsLabel(selected, selected.unitsNeeded)} · ${guestsLabel}`, edit: "room" as Step },
                  {
                    label: t.guest,
                    value: (
                      <>
                        {details.firstName} {details.lastName}
                        <br />
                        <span className="text-slate">
                          {details.email} · {details.phone}
                          {details.country ? ` · ${details.country}` : ""}
                        </span>
                      </>
                    ),
                    edit: "details" as Step,
                  },
                  ...(details.arrivalTime || details.specialRequests
                    ? [{ label: t.specialRequests, value: [details.arrivalTime, details.specialRequests].filter(Boolean).join(" · "), edit: "details" as Step }]
                    : []),
                  { label: t.payment, value: t.paymentOnArrival, edit: null },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div>
                      <dt className="text-[12.5px] text-slate">{row.label}</dt>
                      <dd className="mt-0.5 text-[15px]">{row.value}</dd>
                    </div>
                    {row.edit ? (
                      <Button variant="link" size="sm" onClick={() => setStep(row.edit!)}>
                        {t.edit}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </dl>
              {formError && formError !== v.unavailable ? (
                <p role="alert" className="mt-4 rounded-md bg-tulip-soft px-4 py-3 text-[14px] text-tulip">
                  {formError}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <Button type="button" variant="ghost" onClick={() => setStep("details")}>
                  <ArrowLeft aria-hidden /> {dict.common.back}
                </Button>
                <Button size="lg" onClick={submit} disabled={pending}>
                  {pending ? t.submitting : t.submit}
                </Button>
              </div>
              <p className="mt-4 text-[13px] text-slate">{t.requestNotice}</p>
            </section>
          ) : null}
        </div>

        {/* Summary */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-lg border border-line bg-paper p-5">
            <p className="text-[12.5px] text-slate">{t.stay}</p>
            <p className="mt-0.5 text-[15px] font-medium">{dateRange}</p>
            <p className="text-[14px] text-slate">
              {nightsLabel} · {guestsLabel}
            </p>
            <div className="mt-4 border-t border-line pt-4">
              {selected ? (
                <>
                  <p className="text-[12.5px] text-slate">{t.room}</p>
                  <p className="mt-0.5 text-[15px] font-medium">{selected.name}</p>
                  <p className="text-[13.5px] text-slate">
                    {format(t.priceBreakdown, {
                      price: formatMoney(selected.nightlyPrice, "EUR", locale),
                      units: unitsLabel(selected, selected.unitsNeeded),
                      nights: nightsLabel,
                    })}
                  </p>
                  <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                    <span className="text-[14px]">{format(t.totalFor, { nights: nightsLabel })}</span>
                    <span className="font-display text-[28px]">{formatMoney(selected.total, "EUR", locale)}</span>
                  </div>
                  {step === "room" ? (
                    <Button size="lg" className="mt-5 w-full" onClick={() => setStep("details")}>
                      {dict.common.continue}
                    </Button>
                  ) : null}
                </>
              ) : (
                <p className="text-[14px] text-slate">{t.steps[1]}…</p>
              )}
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-mist">{t.paymentOnArrival}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
