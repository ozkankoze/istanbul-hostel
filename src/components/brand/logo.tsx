import { cn } from "@/lib/utils";

/** Istanbul Hostel mark: a simple house with a chimney, an arched door and a round attic window. */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 9.6V6.5h3v5.6" strokeWidth="2.2" />
        <path d="M4.5 16 16 6l11.5 10" strokeWidth="2.4" />
        <path d="M7.5 13.6V26.5h17V13.6" strokeWidth="2.4" />
        <path d="M13.6 26.5v-5.2a2.4 2.4 0 0 1 4.8 0v5.2" strokeWidth="2.1" />
      </g>
      <circle cx="16" cy="12.6" r="1.9" className="fill-tulip" />
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
