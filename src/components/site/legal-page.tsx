import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/site/section";
import type { Dictionary } from "@/i18n";
import { format, type Locale } from "@/i18n/config";
import { formatDate } from "@/lib/utils";

export function LegalPage({
  title,
  doc,
  t,
  locale,
}: {
  title: string;
  doc: { sections: { heading: string; body: string[] }[] };
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <>
      <PageHeader title={title}>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-[13.5px] text-slate">
          <span>{format(t.legal.updated, { date: formatDate("2026-10-01", locale, { month: "long" }) })}</span>
          <Badge tone="saffron">{t.common.demoLabel}</Badge>
        </div>
      </PageHeader>
      <div className="container-page grid gap-10 py-14 md:grid-cols-12 md:py-20">
        <nav aria-label={title} className="hidden md:col-span-3 md:block">
          <ol className="sticky top-28 space-y-2 text-[14px]">
            {doc.sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#s${i + 1}`} className="text-slate hover:text-ink">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="prose-hostel max-w-2xl text-[16px] text-ink-soft md:col-span-8 md:col-start-5">
          <p className="rounded-md border border-saffron/30 bg-saffron-soft px-4 py-3 text-[14px] text-[#6d4b0b]">
            {t.legal.demoNote}
          </p>
          {doc.sections.map((s, i) => (
            <section key={s.heading} id={`s${i + 1}`} className="scroll-mt-28">
              <h2>{s.heading}</h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
