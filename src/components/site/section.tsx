import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  tone = "default",
  id,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { tone?: "default" | "paper" | "ink" | "cobalt" }) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 md:py-28",
        tone === "paper" && "bg-paper",
        tone === "ink" && "bg-ink text-paper",
        tone === "cobalt" && "bg-cobalt-deep text-paper",
        className,
      )}
      {...rest}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({
  title,
  intro,
  action,
  className,
  as: Tag = "h2",
}: {
  title: React.ReactNode;
  intro?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        <Tag className={cn("font-display text-[34px] leading-[1.08] md:text-[46px]", Tag === "h1" && "md:text-[56px]")}>
          {title}
        </Tag>
        {intro ? <p className="mt-4 max-w-xl text-[16.5px] leading-relaxed text-slate">{intro}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ title, intro, children }: { title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line-soft">
      <div className="container-page pb-12 pt-14 md:pb-16 md:pt-20">
        <h1 className="max-w-3xl font-display text-[40px] leading-[1.05] md:text-[60px]">{title}</h1>
        {intro ? <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-slate">{intro}</p> : null}
        {children}
      </div>
    </div>
  );
}
