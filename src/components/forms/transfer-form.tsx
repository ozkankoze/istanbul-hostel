"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/config";
import { plural } from "@/i18n/plural";
import { formatMoney } from "@/lib/utils";
import { requestTransfer } from "@/server/actions/experiences";
import { SuccessPanel } from "./success-panel";
import { useFormAction } from "./use-form-action";

export function TransferForm({ prices }: { prices: { IST: number; SAW: number } }) {
  const { locale, dict } = useI18n();
  const g = dict.guest;
  const [airport, setAirport] = useState<"IST" | "SAW">("IST");
  const today = useMemo(
    () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
    [],
  );
  const { pending, errors, formError, result, setResult, run } = useFormAction<{ reference: string }>();

  if (result) {
    return (
      <SuccessPanel title={dict.experiences.successTitle} body={format(g.transferSent, { ref: result.reference })} reference={result.reference} referenceLabel={dict.booking.reference}>
        <Button variant="link" className="mt-4" onClick={() => setResult(null)}>
          {g.transferSubmit}
        </Button>
      </SuccessPanel>
    );
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        run(() => requestTransfer(locale, data));
      }}
    >
      <Field label={g.airport} htmlFor="t-airport">
        <Select id="t-airport" name="airport" value={airport} onChange={(e) => setAirport(e.target.value as "IST" | "SAW")}>
          <option value="IST">{g.airports.IST}</option>
          <option value="SAW">{g.airports.SAW}</option>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={g.flightNumber} htmlFor="t-flight" error={errors.flightNumber}>
          <Input id="t-flight" name="flightNumber" placeholder="TK 1022" autoCapitalize="characters" required aria-invalid={!!errors.flightNumber} />
        </Field>
        <Field label={g.passengers} htmlFor="t-pax">
          <Select id="t-pax" name="passengers" defaultValue="1">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {plural(locale, dict.common.people, n)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 grid-cols-2">
        <Field label={g.arrivalDate} htmlFor="t-date" error={errors.arrivalDate}>
          <Input id="t-date" name="arrivalDate" type="date" min={today} required aria-invalid={!!errors.arrivalDate} />
        </Field>
        <Field label={g.arrivalTime} htmlFor="t-time" error={errors.arrivalTime}>
          <Input id="t-time" name="arrivalTime" type="time" required aria-invalid={!!errors.arrivalTime} />
        </Field>
      </div>
      <Field label={dict.experiences.name} htmlFor="t-name" error={errors.name}>
        <Input id="t-name" name="name" autoComplete="name" required aria-invalid={!!errors.name} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.booking.email} htmlFor="t-email" error={errors.email}>
          <Input id="t-email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
        </Field>
        <Field label={dict.booking.phone} htmlFor="t-phone" error={errors.phone} hint={dict.booking.phoneHint}>
          <Input id="t-phone" name="phone" type="tel" autoComplete="tel" required aria-invalid={!!errors.phone} />
        </Field>
      </div>
      <Field label={`${dict.experiences.notes} (${dict.common.optional})`} htmlFor="t-notes">
        <Textarea id="t-notes" name="notes" rows={2} />
      </Field>
      <div className="flex items-center justify-between border-t border-line pt-4 text-[14px]">
        <span className="text-slate">{format(g.transferPrice, { price: formatMoney(prices[airport], "EUR", locale) })}</span>
      </div>
      {formError && !Object.keys(errors).length ? <p role="alert" className="text-[14px] text-tulip">{formError}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? dict.booking.submitting : g.transferSubmit}
      </Button>
    </form>
  );
}
