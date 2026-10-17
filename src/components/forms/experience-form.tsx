"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { plural } from "@/i18n/plural";
import { formatDateParts, formatMoney } from "@/lib/utils";
import { requestExperience } from "@/server/actions/experiences";
import { SuccessPanel } from "./success-panel";
import { useFormAction } from "./use-form-action";

function upcomingDates(days: number[], count = 45) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const start = new Date(`${parts}T00:00:00Z`);
  const out: string[] = [];
  for (let i = 0; i < 120 && out.length < count; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    if (days.includes(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function ExperienceForm({
  experience,
  roomNumber,
  source = "WEBSITE",
  compact,
}: {
  experience: { id: string; price: number; priceUnit: string; maxParticipants: number; availableDays: number[] };
  roomNumber?: string;
  source?: "WEBSITE" | "GUEST_PORTAL";
  compact?: boolean;
}) {
  const { locale, dict } = useI18n();
  const t = dict.experiences;
  const dates = useMemo(() => upcomingDates(experience.availableDays), [experience.availableDays]);
  const [participants, setParticipants] = useState(1);
  const { pending, errors, formError, result, setResult, run } = useFormAction<{ reference: string; total: number }>();
  const total = experience.priceUnit === "GROUP" ? experience.price : experience.price * participants;
  const fmt = (iso: string) =>
    formatDateParts(`${iso}T00:00:00Z`, locale, { weekday: "short", day: "numeric", month: "short" });

  if (result) {
    return (
      <SuccessPanel title={t.successTitle} body={t.successBody} reference={result.reference} referenceLabel={dict.booking.reference}>
        <Button variant="link" className="mt-4" onClick={() => setResult(null)}>
          {t.requestBooking}
        </Button>
      </SuccessPanel>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        run(() => requestExperience(locale, { ...data, experienceId: experience.id, source }));
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.date} htmlFor="x-date" error={errors.date}>
          <Select id="x-date" name="date" required defaultValue={dates[0]} aria-invalid={!!errors.date}>
            {dates.map((d) => (
              <option key={d} value={d}>
                {fmt(d)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.participants} htmlFor="x-participants" error={errors.participants}>
          <Select
            id="x-participants"
            name="participants"
            value={participants}
            onChange={(e) => setParticipants(Number(e.target.value))}
            aria-invalid={!!errors.participants}
          >
            {Array.from({ length: experience.maxParticipants }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {plural(locale, dict.common.people, n)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label={t.name} htmlFor="x-name" error={errors.name}>
        <Input id="x-name" name="name" autoComplete="name" required aria-invalid={!!errors.name} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.booking.email} htmlFor="x-email" error={errors.email}>
          <Input id="x-email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
        </Field>
        <Field label={`${dict.booking.phone} (${dict.common.optional})`} htmlFor="x-phone" error={errors.phone}>
          <Input id="x-phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} />
        </Field>
      </div>
      {!compact ? (
        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Field label={t.roomNumber} htmlFor="x-room">
            <Input id="x-room" name="roomNumber" defaultValue={roomNumber} inputMode="numeric" />
          </Field>
          <Field label={`${t.notes} (${dict.common.optional})`} htmlFor="x-notes">
            <Input id="x-notes" name="notes" />
          </Field>
        </div>
      ) : (
        <input type="hidden" name="roomNumber" value={roomNumber ?? ""} />
      )}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-[14px] text-slate">{dict.booking.total}</span>
        <span className="font-display text-[26px]">{formatMoney(total, "EUR", locale)}</span>
      </div>
      {formError && !Object.keys(errors).length ? <p role="alert" className="text-[14px] text-tulip">{formError}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? dict.booking.submitting : t.submit}
      </Button>
      <p className="text-[12.5px] leading-relaxed text-slate">{dict.booking.requestNotice}</p>
    </form>
  );
}
