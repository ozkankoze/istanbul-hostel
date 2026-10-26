"use client";

import { useState } from "react";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const LANGS = [
  { id: "en", label: "EN" },
  { id: "sr", label: "SR" },
] as const;

/** Edits a { en, sr } value. Submits as name.en / name.sr. */
export function LocalizedField({
  name,
  label,
  value,
  multiline,
  rows = 3,
  required,
  hint,
}: {
  name: string;
  label: string;
  value: unknown;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  hint?: string;
}) {
  const raw = (value && typeof value === "object" ? value : { en: typeof value === "string" ? value : "" }) as Record<string, string>;
  // Older content was written in Bosnian; offer it as the starting point for Serbian.
  const v: Record<string, string> = { ...raw, sr: raw.sr || raw.bs || "" };
  const [active, setActive] = useState<(typeof LANGS)[number]["id"]>("en");
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label htmlFor={`${name}-${active}`} className="mb-0">
          {label}
        </Label>
        <div role="tablist" aria-label={`${label} language`} className="flex gap-0.5 rounded-md bg-limestone p-0.5">
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={active === l.id}
              onClick={() => setActive(l.id)}
              className={cn(
                "rounded-sm px-2 py-0.5 text-[11.5px] font-semibold cursor-pointer",
                active === l.id ? "bg-paper text-ink shadow-sm" : "text-slate hover:text-ink",
                !v[l.id] && active !== l.id && "text-tulip/70",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {LANGS.map((l) =>
        multiline ? (
          <Textarea
            key={l.id}
            id={`${name}-${l.id}`}
            name={`${name}.${l.id}`}
            defaultValue={v[l.id] ?? ""}
            rows={rows}
            required={required && l.id === "en"}
            lang={l.id}
            className={cn(active !== l.id && "hidden")}
          />
        ) : (
          <Input
            key={l.id}
            id={`${name}-${l.id}`}
            name={`${name}.${l.id}`}
            defaultValue={v[l.id] ?? ""}
            required={required && l.id === "en"}
            lang={l.id}
            className={cn(active !== l.id && "hidden")}
          />
        ),
      )}
      {hint ? <p className="mt-1.5 text-[12px] text-mist">{hint}</p> : null}
    </div>
  );
}
