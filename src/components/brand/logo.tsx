import { cn } from "@/lib/utils";

/**
 * Istanbul Hostel mark: an arched doorway (a home) with the Bosphorus
 * waves and a low sun inside it.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <path d="M6.5 28.5V14a9.5 9.5 0 0 1 19 0v14.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="15" r="3" className="fill-tulip" />
      <path d="M9.5 21.5c1.6-1.3 3.3-1.3 4.9 0s3.3 1.3 4.9 0 3.3-1.3 4.9 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".9" />
      <path d="M9.5 25.5c1.6-1.3 3.3-1.3 4.9 0s3.3 1.3 4.9 0 3.3-1.3 4.9 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

export function Logo({
  className,
  tone = "ink",
  compact = false,
}: {
  className?: string;
  tone?: "ink" | "light";
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", tone === "light" ? "text-paper" : "text-ink", className)}>
      <LogoMark className={tone === "light" ? "text-paper" : "text-cobalt"} />
      {!compact && <span className="font-display text-[21px] leading-none tracking-[-0.01em]">Istanbul Hostel</span>}
    </span>
  );
}
