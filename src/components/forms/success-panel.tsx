import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SuccessPanel({
  title,
  body,
  reference,
  referenceLabel,
  children,
  className,
}: {
  title: string;
  body?: React.ReactNode;
  reference?: string;
  referenceLabel?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={cn("rounded-lg border border-tile/25 bg-tile-soft/60 p-6", className)}>
      <CheckCircle2 aria-hidden className="size-7 text-tile" strokeWidth={1.8} />
      <h3 className="mt-3 font-display text-[26px] leading-tight text-ink">{title}</h3>
      {body ? <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{body}</p> : null}
      {reference ? (
        <div className="mt-5 rounded-md border border-line bg-paper px-4 py-3">
          {referenceLabel ? <p className="text-[12px] text-slate">{referenceLabel}</p> : null}
          <p className="mt-0.5 font-display text-[28px] tracking-[0.04em] text-cobalt">{reference}</p>
        </div>
      ) : null}
      {children}
    </div>
  );
}
