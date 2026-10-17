import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink, Footprints, TramFront } from "lucide-react";
import { GuestCard } from "@/components/guest/card";
import { GuestSubHeader } from "@/components/guest/sub-header";
import { GuideIcon } from "@/components/site/guide-icon";
import { getDictionary } from "@/i18n";
import { isLocale, pick } from "@/i18n/config";
import { mapsUrl } from "@/lib/links";
import { getGuide, getPlaces } from "@/server/queries";

const ORDER = ["ATTRACTION", "NEIGHBORHOOD", "RESTAURANT", "CAFE", "NIGHTLIFE"] as const;

export default async function GuestExplore({ params }: PageProps<"/[locale]/guest/explore">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [places, guide] = await Promise.all([getPlaces(), getGuide()]);
  const transport = guide.items.filter((i) => i.section === "TRANSPORT");

  return (
    <>
      <Suspense fallback={null}>
        <GuestSubHeader title={t.guest.sections.explore} back={t.guest.back} intro={t.explore.intro} />
      </Suspense>
      <nav aria-label={t.explore.title} className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[...ORDER.filter((c) => places.some((p) => p.category === c)).map((c) => ({ id: c, label: t.explore.categories[c] })), { id: "transport", label: t.explore.transportTitle }].map((c) => (
          <a key={c.id} href={`#${c.id}`} className="shrink-0 rounded-full border border-line bg-paper px-3.5 py-1.5 text-[13px] text-ink-soft">
            {c.label}
          </a>
        ))}
      </nav>
      <div className="space-y-4">
        {ORDER.map((cat) => {
          const list = places.filter((p) => p.category === cat);
          if (!list.length) return null;
          return (
            <GuestCard key={cat} id={cat} title={t.explore.categories[cat]}>
              <ul className="space-y-4">
                {list.map((p) => (
                  <li key={p.id} className="flex gap-3">
                    {p.image ? (
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                        <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold">{p.name}</p>
                      <p className="mt-0.5 text-[13.5px] leading-relaxed text-slate">{pick(p.description, locale)}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                        {p.walkingMinutes ? (
                          <span className="inline-flex items-center gap-1 text-ink-soft">
                            <Footprints aria-hidden className="size-3.5" /> {p.walkingMinutes} {t.common.minutes}
                          </span>
                        ) : p.transitNote ? (
                          <span className="inline-flex items-center gap-1 text-ink-soft">
                            <TramFront aria-hidden className="size-3.5" /> {pick(p.transitNote, locale)}
                          </span>
                        ) : null}
                        <a href={mapsUrl(p.mapQuery)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-cobalt">
                          {t.explore.openMap} <ExternalLink aria-hidden className="size-3" />
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </GuestCard>
          );
        })}
        <GuestCard id="transport" title={t.explore.transportTitle}>
          <p className="mb-4 text-[13.5px] text-slate">{t.explore.transportIntro}</p>
          <ul className="space-y-3.5">
            {transport.map((i) => (
              <li key={i.id} className="flex gap-3">
                <GuideIcon name={i.icon} className="mt-0.5 size-5 shrink-0 text-cobalt" />
                <div>
                  <p className="text-[14.5px] font-medium">{pick(i.title, locale)}</p>
                  <p className="text-[13.5px] leading-relaxed text-slate">{pick(i.body, locale)}</p>
                </div>
              </li>
            ))}
          </ul>
        </GuestCard>
      </div>
    </>
  );
}
