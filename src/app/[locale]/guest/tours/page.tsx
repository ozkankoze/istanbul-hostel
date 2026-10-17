import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Clock, MapPin } from "lucide-react";
import { ExperienceForm } from "@/components/forms/experience-form";
import { GuestLink } from "@/components/guest/guest-link";
import { GuestSubHeader } from "@/components/guest/sub-header";
import { getDictionary } from "@/i18n";
import { isLocale, pick } from "@/i18n/config";
import { formatDays, formatDuration } from "@/lib/experience";
import { formatMoney } from "@/lib/utils";
import { getGuestSession } from "@/server/guest-session";
import { getExperiences } from "@/server/queries";

export default async function GuestTours({ params, searchParams }: PageProps<"/[locale]/guest/tours">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const sp = await searchParams;
  const [experiences, stay] = await Promise.all([getExperiences(), getGuestSession()]);
  const room = typeof sp.room === "string" ? sp.room : stay?.allocations[0]?.room.number;

  return (
    <>
      <Suspense fallback={null}>
        <GuestSubHeader title={t.guest.sections.tours} back={t.guest.back} intro={t.experiences.intro} />
      </Suspense>
      <div className="space-y-4">
        {experiences.map((e) => (
          <details key={e.id} id={e.slug} className="group scroll-mt-20 overflow-hidden rounded-xl border border-line-soft bg-paper open:shadow-raise">
            <summary className="flex cursor-pointer list-none gap-3 p-3 [&::-webkit-details-marker]:hidden">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
                <Image src={e.image} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-[15.5px] font-semibold leading-snug">{pick(e.title, locale)}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] text-slate">{pick(e.summary, locale)}</p>
                <p className="mt-1 flex items-center gap-3 text-[12.5px] text-ink-soft">
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden className="size-3.5" />
                    {formatDuration(e.durationMinutes, t)}
                  </span>
                  <span className="font-medium">
                    {formatMoney(Number(e.price), "EUR", locale)} {e.priceUnit === "GROUP" ? t.common.perGroup : t.common.perPerson}
                  </span>
                </p>
              </div>
            </summary>
            <div className="border-t border-line-soft p-4">
              <p className="text-[14px] leading-relaxed text-ink-soft">{pick(e.description, locale)}</p>
              <p className="mt-3 flex items-start gap-1.5 text-[13px] text-slate">
                <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                {pick(e.meetingPoint, locale)} · {e.isTransfer ? t.experiences.everyDay : `${formatDays(e.availableDays, t)} · ${e.startTime}`}
              </p>
              <div className="mt-4">
                {e.isTransfer ? (
                  <GuestLink path="/transfer" className="block rounded-md bg-cobalt px-4 py-3 text-center text-[14px] font-medium text-white">
                    {t.experiences.transferCta}
                  </GuestLink>
                ) : (
                  <ExperienceForm
                    compact
                    source="GUEST_PORTAL"
                    roomNumber={room}
                    experience={{
                      id: e.id,
                      price: Number(e.price),
                      priceUnit: e.priceUnit,
                      maxParticipants: e.maxParticipants,
                      availableDays: e.availableDays,
                    }}
                  />
                )}
              </div>
            </div>
          </details>
        ))}
      </div>
      <p className="mt-5 text-center text-[12px] text-mist">{t.experiences.demoNote}</p>
    </>
  );
}
