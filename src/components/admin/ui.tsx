import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminHeader({
  title,
  description,
  actions,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back ? (
          <Link href={back.href} className="text-[13px] text-slate hover:text-ink">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-[14px] text-slate">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-line bg-paper", className)}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-3.5">
          <div>
            <h2 className="text-[15px] font-semibold">{title}</h2>
            {description ? <p className="text-[13px] text-slate">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
  tone?: "default" | "attention";
}) {
  const body = (
    <>
      <p className="text-[13px] text-slate">{label}</p>
      <p className={cn("mt-1 text-[28px] font-semibold leading-none tracking-tight", tone === "attention" ? "text-[#8a5f0f]" : "text-ink")}>{value}</p>
      {hint ? <p className="mt-2 text-[12.5px] text-mist">{hint}</p> : null}
    </>
  );
  const cls = cn(
    "block rounded-lg border bg-paper px-4 py-4",
    tone === "attention" ? "border-saffron/40 bg-saffron-soft/40" : "border-line",
    href && "transition-colors hover:border-ink/30",
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-left text-[14px] [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-[12.5px] [&_th]:font-medium [&_th]:text-slate [&_thead]:border-b [&_thead]:border-line [&_tbody_tr]:border-b [&_tbody_tr]:border-line-soft [&_tbody_tr:last-child]:border-0 [&_tbody_tr:hover]:bg-limestone/50">
        {children}
      </table>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-10 text-center text-[14px] text-slate">{children}</p>;
}

export function DemoTag() {
  return <span className="rounded-sm bg-saffron-soft px-1.5 py-0.5 text-[11px] font-medium text-[#8a5f0f]">demo</span>;
}
