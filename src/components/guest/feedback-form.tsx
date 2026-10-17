"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { SuccessPanel } from "@/components/forms/success-panel";
import { useFormAction } from "@/components/forms/use-form-action";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Input, Textarea } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { submitFeedback } from "@/server/actions/guest";

export function FeedbackForm({ roomNumber, defaultName }: { roomNumber?: string; defaultName?: string }) {
  const { locale, dict } = useI18n();
  const g = dict.guest;
  const [rating, setRating] = useState(0);
  const { pending, errors, formError, result, run } = useFormAction();

  if (result !== null) return <SuccessPanel title={g.feedbackSent} />;

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        run(() => submitFeedback(locale, { ...data, rating }));
      }}
    >
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">{g.rating}</legend>
        <div className="flex gap-1.5" role="radiogroup" aria-label={g.rating}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} / 5`}
              onClick={() => setRating(n)}
              className="rounded-md p-1 cursor-pointer"
            >
              <Star
                aria-hidden
                className={cn("size-8 transition-colors", n <= rating ? "fill-saffron text-saffron" : "text-line")}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <FieldError>{errors.rating}</FieldError>
      </fieldset>
      <Field label={g.feedbackMessage} htmlFor="f-msg" error={errors.message}>
        <Textarea id="f-msg" name="message" rows={4} aria-invalid={!!errors.message} />
      </Field>
      <div className="grid grid-cols-[1fr_96px] gap-3">
        <Field label={`${g.feedbackName} (${dict.common.optional})`} htmlFor="f-name">
          <Input id="f-name" name="name" defaultValue={defaultName} autoComplete="given-name" />
        </Field>
        <Field label={dict.experiences.roomNumber} htmlFor="f-room">
          <Input id="f-room" name="roomNumber" defaultValue={roomNumber} inputMode="numeric" />
        </Field>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {formError && !Object.keys(errors).length ? <p role="alert" className="text-[14px] text-tulip">{formError}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? dict.booking.submitting : g.feedbackSubmit}
      </Button>
    </form>
  );
}
