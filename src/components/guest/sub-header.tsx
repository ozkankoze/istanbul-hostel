import { ChevronLeft } from "lucide-react";
import { GuestLink } from "./guest-link";

export function GuestSubHeader({ title, back, intro }: { title: string; back: string; intro?: string }) {
  return (
    <div className="mb-5">
      <GuestLink path="/" className="inline-flex items-center gap-1 text-[13.5px] text-slate hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" /> {back}
      </GuestLink>
      <h1 className="mt-2 font-display text-[30px] leading-tight">{title}</h1>
      {intro ? <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate">{intro}</p> : null}
    </div>
  );
}
