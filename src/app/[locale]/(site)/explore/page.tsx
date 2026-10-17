import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Footprints, TramFront } from "lucide-react";
import { GuideIcon } from "@/components/site/guide-icon";
import { PageHeader } from "@/components/site/section";
import { getDictionary } from "@/i18n";
import { isLocale, pick } from "@/i18n/config";
import { href, mapsUrl } from "@/lib/links";
import { cn } from "@/lib/utils";
import { getGuide, getPlaces } from "@/server/queries";

const CATEGORIES = ["ATTRACTION", "NEIGHBORHOOD", "RESTAURANT", "CAFE", "NIGHTLIFE"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/explore">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: t.explore.title, description: t.explore.intro };
}

export default async function ExplorePage({ params, searchParams }: PageProps<"/[locale]/explore">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const sp = await searchParams;
  const active = typeof sp.category === "string" && (CATEGORIES as readonly string[]).includes(sp.category) ? sp.category : null;

  const [places, guide] = await Promise.all([getPlaces(), getGuide()]);
  const shown = active ? places.filter((p) => p.category === active) : places;
  const transport = guide.items.filter((i) => i.section === "TRANSPORT");
  const present = CATEGORIES.filter((c) => places.some((p) => p.category === c));

  return (
    <>
      <PageHeader title={t.explore.title} intro={t.explore.intro}>
        <nav aria-label={t.explore.title} className="mt-8 flex flex-wrap gap-2">
          {[null, ...present].map((c) => {
            const isActive = c === active;
            return (
              <Link
                key={c ?? "all"}
                href={c ? `${href(locale, "/explore")}?category=${c}` : href(locale, "/explore")}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-[14px] transition-colors",
                  isActive ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40",
                )}
              >
                {c ? t.explore.categories[c] : t.explore.all}
              </Link>
            );
          })}
        </nav>
      </PageHeader>

      <div className="container-page grid gap-x-10 gap-y-14 py-14 sm:grid-cols-2 lg:grid-cols-3 md:py-20">
        {shown.map((p) => (
          <article key={p.id} className="flex flex-col">
            <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-limestone-deep">
              {p.image ? (
                <Image src={p.image} alt={p.name} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover" />
              ) : null}
            </div>
            <p className="mt-4 text-[12.5px] text-slate">
              {t.explore.categories[p.category]} · {p.area}
            </p>
            <h2 className="mt-1 font-display text-[24px] leading-tight">{p.name}</h2>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate">{pick(p.description, locale)}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13.5px]">
              <span className="inline-flex items-center gap-1.5 text-ink-soft">
                {p.walkingMinutes ? (
                  <>
                    <Footprints aria-hidden className="size-4 text-slate" />
                    {p.walkingMinutes} {t.common.minutes} {t.common.walk}
                  </>
                ) : p.transitNote ? (
                  <>
                    <TramFront aria-hidden className="size-4 text-slate" />
                    {pick(p.transitNote, locale)}
                  </>
                ) : null}
              </span>
              <a
                href={mapsUrl(p.mapQuery)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-cobalt hover:underline underline-offset-4"
              >
                {t.explore.openMap} <ExternalLink aria-hidden className="size-3.5" />
              </a>
            </div>
          </article>
        ))}
      </div>

      <section id="transport" className="bg-paper py-16 md:py-24">
        <div className="container-page grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="font-display text-[30px] md:text-[38px]">{t.explore.transportTitle}</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-slate">{t.explore.transportIntro}</p>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 md:col-span-8">
            {transport.map((item) => (
              <li key={item.id} className="flex gap-4">
                <GuideIcon name={item.icon} className="mt-0.5 size-5 shrink-0 text-cobalt" />
                <div>
                  <h3 className="text-[16px] font-semibold">{pick(item.title, locale)}</h3>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-slate">{pick(item.body, locale)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
