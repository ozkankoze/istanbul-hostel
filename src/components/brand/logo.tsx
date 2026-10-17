import { cn } from "@/lib/utils";

/**
 * Istanbul Hostel mark: an eight-point star built from two squares,
 * the geometry found in Ottoman & Seljuk tilework.
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="7.5" y="7.5" width="17" height="17" />
        <rect x="7.5" y="7.5" width="17" height="17" transform="rotate(45 16 16)" />
      </g>
      <circle cx="16" cy="16" r="2.4" className="fill-tulip" />
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
    <span
      className={cn(
        "inline-flex items-center gap-2.5",
        tone === "light" ? "text-paper" : "text-ink",
        className,
      )}
    >
      <LogoMark className={tone === "light" ? "text-paper" : "text-cobalt"} />
      {!compact && (
        <span className="font-display text-[21px] leading-none tracking-[-0.01em]">
          Istanbul Hostel
        </span>
      )}
    </span>
  );
}
