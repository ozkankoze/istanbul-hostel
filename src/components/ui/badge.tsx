import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-medium leading-5 whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-ink/[0.06] text-ink-soft",
        cobalt: "bg-cobalt-soft text-cobalt",
        tile: "bg-tile-soft text-tile",
        tulip: "bg-tulip-soft text-tulip",
        saffron: "bg-saffron-soft text-[#8a5f0f]",
        dark: "bg-ink text-paper",
        outline: "border border-line text-slate",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  dot,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {props.children}
    </span>
  );
}
