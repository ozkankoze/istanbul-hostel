"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { submitContact } from "@/server/actions/contact";

export function ContactForm() {
  const { locale, dict } = useI18n();
  const t = dict.contact;
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const form = e.currentTarget;
    start(async () => {
      const res = await submitContact(locale, data);
      if (res.ok) {
        setSent(true);
        setErrors({});
        setFormError(null);
        form.reset();
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.fieldErrors ? null : res.error);
      }
    });
  }

  if (sent) {
    return (
      <div role="status" className="rounded-lg border border-tile/30 bg-tile-soft p-6 text-tile">
        <CheckCircle2 aria-hidden className="size-6" />
        <p className="mt-3 text-[16px] font-medium text-ink">{t.sent}</p>
        <Button variant="link" className="mt-2" onClick={() => setSent(false)}>
          {t.formTitle}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.name} htmlFor="c-name" error={errors.name}>
          <Input id="c-name" name="name" autoComplete="name" required aria-invalid={!!errors.name} />
        </Field>
        <Field label={t.email} htmlFor="c-email" error={errors.email}>
          <Input id="c-email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
        </Field>
      </div>
      <Field label={t.subject} htmlFor="c-subject" error={errors.subject}>
        <Input id="c-subject" name="subject" required aria-invalid={!!errors.subject} />
      </Field>
      <Field label={t.message} htmlFor="c-message" error={errors.message}>
        <Textarea id="c-message" name="message" rows={6} required aria-invalid={!!errors.message} />
      </Field>
      <div aria-hidden className="hidden">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {formError ? <p role="alert" className="text-[14px] text-tulip">{formError}</p> : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? dict.common.loading : t.send}
      </Button>
    </form>
  );
}
