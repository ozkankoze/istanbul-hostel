"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormAction } from "@/components/forms/use-form-action";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { format } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { createServiceRequest } from "@/server/actions/guest";

const TYPES = ["TOWELS", "CLEANING", "AMENITIES", "MAINTENANCE", "RECEPTION", "OTHER"] as const;

export function ServiceRequestForm({ rooms }: { rooms: { id: string; number: string }[] }) {
  const { locale, dict } = useI18n();
  const g = dict.guest;
  const router = useRouter();
  const [type, setType] = useState<(typeof TYPES)[number]>("TOWELS");
  const { pending, errors, formError, result, setResult, run } = useFormAction<{ reference: string }>();

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        run(
          () => createServiceRequest(locale, { ...data, type }),
          () => {
            form.reset();
            router.refresh();
          },
        );
      }}
    >
      <fieldset>
        <legend className="sr-only">{g.requestType}</legend>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={type === k}
              onClick={() => {
                setType(k);
                setResult(null);
              }}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors cursor-pointer",
                type === k ? "border-cobalt bg-cobalt-soft text-cobalt" : "border-line bg-paper text-ink-soft hover:border-ink/30",
              )}
            >
              {g.requestTypes[k]}
            </button>
          ))}
        </div>
      </fieldset>
      {rooms.length > 1 ? (
        <Field label={dict.booking.room} htmlFor="r-room">
          <Select id="r-room" name="roomId">
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {format(g.roomLabel, { room: r.number })}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <input type="hidden" name="roomId" value={rooms[0]?.id ?? ""} />
      )}
      <Field
        label={`${g.requestMessage}${type === "MAINTENANCE" || type === "OTHER" ? "" : ` (${dict.common.optional})`}`}
        htmlFor="r-msg"
        error={errors.message}
      >
        <Textarea id="r-msg" name="message" rows={3} aria-invalid={!!errors.message} />
      </Field>
      {formError && !errors.message ? <p role="alert" className="text-[14px] text-tulip">{formError}</p> : null}
      {result ? (
        <p role="status" className="rounded-lg bg-tile-soft px-4 py-3 text-[14px] text-tile">
          {format(g.requestSent, { ref: result.reference })}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? dict.booking.submitting : g.requestSubmit}
      </Button>
    </form>
  );
}
