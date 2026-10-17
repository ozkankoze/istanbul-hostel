import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  BedDouble,
  Coffee,
  MapPin,
  QrCode,
  Users,
  Wallet,
} from "lucide-react";
import { BookingSearch } from "@/components/site/booking-search";
import { ExperienceCard } from "@/components/site/experience-card";
import { RoomTile } from "@/components/site/room-tile";
import { Section, SectionHeading } from "@/components/site/section";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { isLocale, pick, type LocalizedText } from "@/i18n/config";
import { href, mapsUrl } from "@/lib/links";
import {
  getContentBlock,
  getExperiences,
  getFaqs,
  getPlaces,
  getProperty,
  getRoomTypes,
  getSetting,
  getTestimonials,
} from "@/server/queries";
import { db } from "@/lib/db";

const whyIcons = [MapPin, BedDouble, Coffee, QrCode, Users, Wallet];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  const [property, roomTypes, experiences, places, faqs, testimonials, hero, maxGuests, roomCount] = await Promise.all([
    getProperty(),
    getRoomTypes(),
    getExperiences(),
    getPlaces(),
    getFaqs(),
    getTestimonials(),
    getContentBlock<{ title?: LocalizedText; subtitle?: LocalizedText; image?: string }>("home.hero"),
    getSetting<number>("booking.maxGuests", 8),
    db.room.count({ where: { isActive: true } }),
  ]);

  const heroTitle = pick(hero?.title, locale) || t.home.heroTitle;
  const heroSubtitle = pick(hero?.subtitle, locale) || t.home.heroSubtitle;
  const heroImage = hero?.image || "/images/hero-istanbul.jpg";
  const featuredPlaces = places.filter((p) => p.image).slice(0, 4);
  const tours = experiences.filter((e) => !e.isTransfer).slice(0, 3);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative isolate">
        <div className="relative h-[86svh] min-h-[560px] max-h-[860px] w-full overflow-hidden bg-ink">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="animate-[fade-in_1.2s_ease-out_both] object-cover object-[50%_60%]"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/10 to-ink/70" />
          <div className="container-page relative flex h-full flex-col justify-end pb-32 md:pb-36">
            <h1 className="max-w-[15ch] animate-rise font-display text-[46px] leading-[1.02] text-paper sm:text-[64px] md:text-[84px]">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-xl animate-rise text-[17px] leading-relaxed text-paper/85 [animation-delay:120ms] md:text-[19px]">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:220ms]">
              <Button asChild size="lg" variant="light">
                <Link href={href(locale, "/book")}>{t.common.bookYourStay}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-paper">
                <Link href={href(locale, "/rooms")}>{t.common.exploreRooms}</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="container-page relative z-10 -mt-12 md:-mt-11">
          <Suspense fallback={<div className="h-[76px] rounded-lg bg-paper shadow-float" />}>
            <BookingSearch maxGuests={maxGuests} />
          </Suspense>
        </div>
      </section>

      {/* ── Welcome ──────────────────────────────────── */}
      <Section className="pt-24 md:pt-32">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6 lg:col-span-5">
            <h2 className="font-display text-[34px] leading-[1.08] md:text-[46px]">{t.home.welcomeTitle}</h2>
            <p className="mt-6 text-[17px] leading-[1.75] text-ink-soft">{t.home.welcomeBody}</p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-6">
              {[
                { n: String(roomCount), label: t.home.welcomeStats.rooms },
                { n: "7", label: t.home.welcomeStats.galata },
                { n: "24/7", label: t.home.welcomeStats.reception },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-[30px] leading-none text-cobalt">{s.n}</dd>
                  <dd className="mt-2 text-[13px] leading-snug text-slate">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative md:col-span-6 lg:col-span-6 lg:col-start-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-md">
              <Image src="/images/common-room.jpg" alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-10 -left-6 hidden aspect-square w-[38%] overflow-hidden rounded-md border-[6px] border-limestone md:block">
              <Image src="/images/terrace.jpg" alt="" fill sizes="20vw" className="object-cover" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Rooms ────────────────────────────────────── */}
      <Section tone="paper">
        <SectionHeading
          title={t.home.roomsTitle}
          intro={t.home.roomsIntro}
          action={
            <Button asChild variant="secondary">
              <Link href={href(locale, "/rooms")}>{t.common.seeAll}</Link>
            </Button>
          }
        />
        <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
          {roomTypes.map((r) => (
            <RoomTile key={r.id} room={r} locale={locale} t={t} />
          ))}
        </div>
        <p className="mt-10 text-[13px] text-mist">{t.rooms.priceNote}</p>
      </Section>

      {/* ── Why stay ─────────────────────────────────── */}
      <Section>
        <SectionHeading title={t.home.whyTitle} />
        <ul className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {t.home.why.map((w, i) => {
            const Icon = whyIcons[i] ?? MapPin;
            return (
              <li key={w.title} className="border-t border-line pt-6">
                <Icon aria-hidden className="size-5 text-cobalt" strokeWidth={1.6} />
                <h3 className="mt-4 text-[17px] font-semibold">{w.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate">{w.body}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ── Explore Istanbul ─────────────────────────── */}
      <Section tone="ink">
        <SectionHeading
          title={t.home.exploreTitle}
          intro={<span className="text-paper/70">{t.home.exploreIntro}</span>}
          action={
            <Button asChild variant="outline" className="text-paper">
              <Link href={href(locale, "/explore")}>{t.nav.explore}</Link>
            </Button>
          }
        />
        <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2 md:gap-5">
          {featuredPlaces.map((p, i) => (
            <a
              key={p.id}
              href={mapsUrl(p.mapQuery)}
              target="_blank"
              rel="noreferrer"
              className={
                "group relative block overflow-hidden rounded-md " +
                (i === 0 ? "aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto" : "aspect-[4/3] md:aspect-auto md:min-h-[220px]") +
                (i === 3 ? " md:col-span-2" : "")
              }
            >
              <Image
                src={p.image!}
                alt={p.name}
                fill
                sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 100vw"}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[12.5px] text-paper/70">
                  {t.explore.categories[p.category]} · {p.area}
                </p>
                <h3 className="mt-1 font-display text-[24px] leading-tight text-paper md:text-[26px]">{p.name}</h3>
                {i === 0 ? (
                  <p className="mt-2 hidden max-w-md text-[14.5px] leading-relaxed text-paper/80 md:block">
                    {pick(p.description, locale)}
                  </p>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* ── Experiences ──────────────────────────────── */}
      <Section>
        <SectionHeading
          title={t.home.experiencesTitle}
          intro={t.home.experiencesIntro}
          action={
            <Button asChild variant="secondary">
              <Link href={href(locale, "/experiences")}>{t.common.seeAll}</Link>
            </Button>
          }
        />
        <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 lg:gap-8">
          {tours.map((e) => (
            <div key={e.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <ExperienceCard exp={e} locale={locale} t={t} />
            </div>
          ))}
        </div>
      </Section>

      {/* ── Reviews ──────────────────────────────────── */}
      <Section tone="paper">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-[34px] leading-tight md:text-[46px]">{t.home.reviewsTitle}</h2>
          {testimonials.some((r) => r.isSample) ? <Badge tone="saffron">{t.common.demoLabel}</Badge> : null}
        </div>
        {testimonials.some((r) => r.isSample) ? <p className="mt-3 max-w-xl text-[14px] text-slate">{t.home.reviewsNote}</p> : null}
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
          {testimonials.map((r) => (
            <figure key={r.id} className="flex flex-col border-l-2 border-cobalt/30 pl-6">
              <blockquote className="font-display text-[21px] italic leading-snug text-ink">
                “{pick(r.quote, locale)}”
              </blockquote>
              <figcaption className="mt-5 text-[13.5px] text-slate">
                {r.name} · {r.origin}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <Section>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="font-display text-[34px] leading-[1.08] md:text-[46px]">{t.home.faqTitle}</h2>
            <p className="mt-4 text-[15px] text-slate">
              <Link href={href(locale, "/contact")} className="text-cobalt underline-offset-4 hover:underline">
                {t.nav.contact}
              </Link>
            </p>
          </div>
          <Accordion type="single" collapsible className="md:col-span-8 border-t border-line">
            {faqs.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger>{pick(f.question, locale)}</AccordionTrigger>
                <AccordionContent>{pick(f.answer, locale)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ── Location ─────────────────────────────────── */}
      <Section tone="paper" className="pb-24">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="font-display text-[34px] leading-[1.08] md:text-[46px]">{t.home.locationTitle}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate">{t.home.locationBody}</p>
            <p className="mt-4 text-[15px] text-ink">
              {property.addressLine}, {property.city}
            </p>
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {t.home.gettingHere.map((g) => (
                <div key={g.label} className="flex justify-between gap-4 py-3 text-[14.5px]">
                  <dt className="text-ink-soft">{g.label}</dt>
                  <dd className="text-slate">{g.value}</dd>
                </div>
              ))}
            </dl>
            <Button asChild variant="secondary" className="mt-8">
              <a href={mapsUrl(property.mapQuery)} target="_blank" rel="noreferrer">
                <MapPin aria-hidden />
                {t.home.directions}
              </a>
            </Button>
          </div>
          <div className="md:col-span-8">
            <div className="relative h-[380px] overflow-hidden rounded-md border border-line bg-limestone-deep md:h-full md:min-h-[460px]">
              <iframe
                title={t.home.locationTitle}
                src={`https://www.google.com/maps?q=${encodeURIComponent(property.mapQuery)}&z=15&output=embed`}
                className="absolute inset-0 h-full w-full grayscale-[35%]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
