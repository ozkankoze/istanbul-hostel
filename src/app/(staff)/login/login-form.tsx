"use client";

import { useActionState, useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { login } from "@/server/actions/auth";

export function LoginForm({ next, demo }: { next?: string; demo?: { password: string; accounts: { email: string; label: string }[] } }) {
  const [state, action, pending] = useActionState(login, undefined);
  // Controlled so values survive React's automatic form reset after an action.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {state?.error ? (
          <p role="alert" className="rounded-md bg-tulip-soft px-3 py-2 text-[14px] text-tulip">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          <LogIn aria-hidden /> {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      {demo ? (
        <div className="mt-8 rounded-lg border border-dashed border-saffron/50 bg-saffron-soft/50 p-4">
          <p className="text-[13px] font-semibold text-[#6d4b0b]">Demo accounts (DEMO_MODE is on)</p>
          <p className="mt-1 text-[12.5px] text-[#6d4b0b]/80">Click to fill. Turn DEMO_MODE off before any public deployment.</p>
          <div className="mt-3 grid gap-1.5">
            {demo.accounts.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(demo.password);
                }}
                className="flex items-center justify-between rounded-md bg-paper px-3 py-2 text-left text-[13px] hover:bg-white cursor-pointer"
              >
                <span className="font-medium">{a.label}</span>
                <span className="text-slate">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
