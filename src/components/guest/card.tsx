import { cn } from "@/lib/utils";

export function GuestCard({
  id,
  icon: Icon,
  title,
  children,
  className,
  action,
}: {
  id?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={cn("scroll-mt-20 rounded-xl border border-line-soft bg-paper p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id ? `${id}-h` : undefined} className="flex items-center gap-2.5 text-[16.5px] font-semibold">
          {Icon ? (
            <span className="flex size-8 items-center justify-center rounded-lg bg-cobalt-soft text-cobalt">
              <Icon className="size-[18px]" strokeWidth={1.8} />
            </span>
          ) : null}
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
