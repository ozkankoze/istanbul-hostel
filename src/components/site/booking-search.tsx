"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarDays, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { plural } from "@/i18n/plural";
import { href } from "@/lib/links";
import { cn } from "@/lib/utils";

function isoInTz(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const d = new Date(`${parts}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function BookingSearch({
  initial,
  maxGuests = 8,
  variant = "floating",
  room,
  className,
}: {
  room?: string;
  initial?: { checkIn?: string; checkOut?: string; guests?: number };
  maxGuests?: number;
  variant?: "floating" | "inline";
  className?: string;
}) {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const today = useMemo(() => isoInTz(0), []);
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? isoInTz(7));
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? isoInTz(10));
  const [guests, setGuests] = useState(initial?.guests ?? 1);

  const minOut = useMemo(() => {
    const d = new Date(`${checkIn}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [checkIn]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    if (room) params.set("room", room);
    router.push(`${href(locale, "/book")}?${params}#results`);
  }

  const cell = "flex flex-1 flex-col justify-center px-4 py-3 md:px-5";
  const label = "flex items-center gap-1.5 text-[12px] font-medium text-slate";
  const control =
    "mt-1 w-full bg-transparent text-[15.5px] font-medium text-ink focus:outline-none [color-scheme:light] cursor-pointer";

  return (
    <form
      onSubmit={onSubmit}
      aria-label={dict.search.submit}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-line bg-paper md:flex-row md:items-stretch",
        variant === "floating" && "shadow-float",
        className,
      )}
    >
      <label className={cn(cell, "border-b border-line-soft md:border-b-0 md:border-r")}>
        <span className={label}>
          <CalendarDays aria-hidden className="size-3.5" /> {dict.search.checkIn}
        </span>
        <input
          type="date"
          required
          min={today}
          value={checkIn}
          onChange={(e) => {
            const v = e.target.value;
            setCheckIn(v);
            if (v >= checkOut) {
              const d = new Date(`${v}T00:00:00Z`);
              d.setUTCDate(d.getUTCDate() + 1);
              setCheckOut(d.toISOString().slice(0, 10));
            }
          }}
          className={control}
        />
      </label>
      <label className={cn(cell, "border-b border-line-soft md:border-b-0 md:border-r")}>
        <span className={label}>
          <CalendarDays aria-hidden className="size-3.5" /> {dict.search.checkOut}
        </span>
        <input
          type="date"
          required
          min={minOut}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className={control}
        />
      </label>
      <label className={cn(cell, "md:max-w-[190px]")}>
        <span className={label}>
          <Users aria-hidden className="size-3.5" /> {dict.search.guests}
        </span>
        <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className={control}>
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {plural(locale, dict.common.guests, n)}
            </option>
          ))}
        </select>
      </label>
      <div className="p-2">
        <Button type="submit" size="lg" className="h-full min-h-12 w-full md:w-auto md:px-7">
          <Search aria-hidden />
          {dict.search.submit}
        </Button>
      </div>
    </form>
  );
}
