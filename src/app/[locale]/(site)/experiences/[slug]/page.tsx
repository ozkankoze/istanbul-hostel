import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronLeft, Clock, MapPin, Users, Wallet } from "lucide-react";
import { ExperienceForm } from "@/components/forms/experience-form";
import { TransferForm } from "@/components/forms/transfer-form";
import { ExperienceCard } from "@/components/site/experience-card";
import { getDictionary } from "@/i18n";
import { format, isLocale, pick } from "@/i18n/config";
import { formatDays, formatDuration } from "@/lib/experience";
import { href } from "@/lib/links";
import { formatMoney } from "@/lib/utils";
import { getExperienceBySlug, getExperiences, getSetting } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/experiences/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const e = await getExperienceBySlug(slug);
  if (!e) return {};
  return { title: pick(e.title, locale), description: pick(e.summary, locale), openGraph: { images: [e.image] } };
}

export default async function ExperiencePage({ params, searchParams }: PageProps<"/[locale]/experiences/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const sp = await searchParams;
  const room = typeof sp.room === "string" ? sp.room.slice(0, 10) : undefined;
  const [exp, all, priceIST, priceSAW] = await Promise.all([
    getExperienceBySlug(slug),
    getExperiences(),
    getSetting<number>("transfer.priceIST", 45),
    getSetting<number>("transfer.priceSAW", 55),
  ]);
  if (!exp) notFound();
  const title = pick(exp.title, locale);
  const others = all.filter((e) => e.id !== exp.id && !e.isTransfer).slice(0, 3);

  const facts = [
    { icon: Clock, label: t.experiences.duration, value: formatDuration(exp.durationMinutes, t) },
    {
      icon: Wallet,
      label: t.experiences.price,
      value: `${formatMoney(Number(exp.price), "EUR", locale)} ${exp.priceUnit === "GROUP" ? t.common.perGroup : t.common.perPerson}`,
    },
    { icon: MapPin, label: t.experiences.meetingPoint, value: pick(exp.meetingPoint, locale) },
    {
      icon: CalendarDays,
      label: t.experiences.availability,
      value: exp.isTransfer ? t.experiences.everyDay : `${formatDays(exp.availableDays, t)} · ${exp.startTime}`,
    },
    { icon: Users, label: t.experiences.groupSize, value: format(t.experiences.upTo, { count: exp.maxParticipants }) },
  ];

  return (
    <>
      <div className="container-page pt-8">
        <Link href={href(locale, "/experiences")} className="inline-flex items-center gap-1 text-[14px] text-slate hover:text-ink">
          <ChevronLeft aria-hidden className="size-4" /> {t.experiences.title}
        </Link>
      </div>
      <div className="container-page grid gap-12 pb-16 pt-6 md:grid-cols-12 md:pb-24">
        <div className="md:col-span-7">
          <div className="relative aspect-[16/10] overflow-hidden rounded-md">
            <Image src={exp.image} alt={title} fill priority sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
          </div>
          <h1 className="mt-8 font-display text-[40px] leading-[1.05] md:text-[56px]">{title}</h1>
          <p className="mt-3 text-[18px] text-ink-soft">{pick(exp.summary, locale)}</p>
          <p className="mt-6 text-[16px] leading-[1.75] text-slate">{pick(exp.description, locale)}</p>
          <dl className="mt-10 grid gap-x-8 gap-y-6 border-t border-line pt-8 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-3">
                <f.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-cobalt" strokeWidth={1.6} />
                <div>
                  <dt className="text-[12.5px] text-slate">{f.label}</dt>
                  <dd className="mt-0.5 text-[15.5px]">{f.value}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-[13px] text-mist">{t.experiences.demoNote}</p>
        </div>
        <aside className="md:col-span-5">
          <div id="book" className="sticky top-24 scroll-mt-24 rounded-lg border border-line bg-paper p-6">
            <h2 className="font-display text-[26px]">{exp.isTransfer ? t.experiences.transferCta : t.experiences.bookingTitle}</h2>
            {exp.isTransfer ? <p className="mt-1 text-[14px] text-slate">{t.guest.transferIntro}</p> : null}
            <div className="mt-5">
              {exp.isTransfer ? (
                <TransferForm prices={{ IST: priceIST, SAW: priceSAW }} />
              ) : (
                <ExperienceForm
                  roomNumber={room}
                  experience={{
                    id: exp.id,
                    price: Number(exp.price),
                    priceUnit: exp.priceUnit,
                    maxParticipants: exp.maxParticipants,
                    availableDays: exp.availableDays,
                  }}
                />
              )}
            </div>
          </div>
        </aside>
      </div>
      {others.length ? (
        <section className="border-t border-line-soft bg-paper py-16 md:py-20">
          <div className="container-page">
            <h2 className="font-display text-[30px] md:text-[38px]">{t.experiences.otherExperiences}</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((e) => (
                <ExperienceCard key={e.id} exp={e} locale={locale} t={t} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
