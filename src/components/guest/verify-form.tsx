"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useFormAction } from "@/components/forms/use-form-action";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { verifyStay } from "@/server/actions/guest";

export function VerifyForm() {
  const { locale, dict } = useI18n();
  const g = dict.guest;
  const router = useRouter();
  const { pending, formError, run } = useFormAction();
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        run(() => verifyStay(locale, data), () => router.refresh());
      }}
    >
      <Field label={g.verifyReference} htmlFor="v-ref">
        <Input id="v-ref" name="reference" placeholder="IH-XXXXXX" autoCapitalize="characters" autoComplete="off" required className="font-mono uppercase tracking-wider" />
      </Field>
      <Field label={g.verifyLastName} htmlFor="v-last">
        <Input id="v-last" name="lastName" autoComplete="family-name" required />
      </Field>
      {formError ? <p role="alert" className="text-[14px] text-tulip">{formError}</p> : null}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        <Lock aria-hidden /> {pending ? dict.common.loading : g.verifySubmit}
      </Button>
    </form>
  );
}
