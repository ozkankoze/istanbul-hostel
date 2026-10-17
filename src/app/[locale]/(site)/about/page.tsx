import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BedDouble,
  Compass,
  HeartHandshake,
  Leaf,
  MousePointerClick,
  Scale,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { href } from "@/lib/links";
import { initials } from "@/lib/utils";
import { getProperty } from "@/server/queries";

const offerIcons = [BedDouble, Users, Compass, MousePointerClick];
const valueIcons = [HeartHandshake, Sparkles, Store, Scale];
const responsibleIcons = [Leaf, Store, ShieldCheck];
const teamTones = ["bg-cobalt text-white", "bg-tile text-white", "bg-tulip text-white", "bg-saffron text-ink"];
const iconTones = [
  "bg-cobalt-soft text-cobalt",
  "bg-tile-soft text-tile",
  "bg-saffron-soft text-[#9a6a0c]",
  "bg-tulip-soft text-tulip",
];

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: t.about.title, description: t.about.lead };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const a = t.about;
  const [property, rooms, beds] = await Promise.all([
    getProperty(),
    db.room.count({ where: { isActive: true } }),
    db.bed.count({ where: { isActive: true, room: { isActive: true, roomType: { kind: "DORM" } } } }),
  ]);
  const privateRooms = await db.room.count({ where: { isActive: true, roomType: { kind: "PRIVATE" } } });

  const facts = [
    { label: a.facts.rooms, value: String(rooms) },
    { label: a.facts.beds, value: String(beds + privateRooms * 2) },
    { label: a.facts.reception, value: a.facts.receptionValue },
    { label: a.facts.checkin, value: `${property.checkInTime} / ${property.checkOutTime}` },
    { label: a.facts.languages, value: a.facts.languagesValue },
    { label: a.facts.location, value: a.facts.locationValue },
  ];

  return (
    <>
      {/* Intro */}
      <section className="container-page grid gap-10 pb-14 pt-14 md:grid-cols-12 md:pb-20 md:pt-20">
        <div className="md:col-span-7">
          <p className="text-[14px] font-medium text-cobalt">{a.title}</p>
          <h1 className="mt-3 font-display text-[40px] leading-[1.05] md:text-[58px]">{a.lead}</h1>
        </div>
        <div className="md:col-span-5 md:pt-10">
          <p className="text-[17px] leading-[1.75] text-ink-soft">{a.intro}</p>
        </div>
      </section>

      {/* Image mosaic */}
      <section className="container-page">
        <div className="grid gap-3 md:grid-cols-4 md:grid-rows-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[480px]">
            <Image src="/images/about-istanbul.jpg" alt="" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-md md:block md:aspect-auto">
            <Image src="/images/common-room.jpg" alt="" fill sizes="25vw" className="object-cover" />
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-md md:block md:aspect-auto">
            <Image src="/images/breakfast.jpg" alt="" fill sizes="25vw" className="object-cover" />
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-md md:col-span-2 md:block md:aspect-auto">
            <Image src="/images/terrace.jpg" alt="" fill sizes="50vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Facts */}
      <section className="container-page py-14 md:py-16" aria-labelledby="facts-h">
        <h2 id="facts-h" className="sr-only">
          {a.factsTitle}
        </h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-line py-8 md:grid-cols-3 lg:grid-cols-6">
          {facts.map((f, i) => (
            <div key={f.label} className="border-l-2 pl-4" style={{ borderColor: ["#1d4fc4", "#0b8577", "#d1442b", "#e3a21a", "#1d4fc4", "#0b8577"][i] }}>
              <dt className="text-[12.5px] text-slate">{f.label}</dt>
              <dd className="mt-1 font-display text-[22px] leading-tight">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Story */}
      <section className="container-page grid gap-10 pb-16 md:grid-cols-12 md:pb-24">
        <div className="md:col-span-4">
          <h2 className="font-display text-[32px] leading-tight md:sticky md:top-28 md:text-[40px]">{a.storyTitle}</h2>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <div className="space-y-5 text-[17px] leading-[1.8] text-ink-soft">
            {a.story.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <figure className="mt-10 border-l-4 border-cobalt pl-6">
            <blockquote className="font-display text-[26px] leading-snug text-ink md:text-[30px]">“{a.quote}”</blockquote>
            <figcaption className="mt-3 text-[14px] text-slate">— {a.quoteBy}</figcaption>
          </figure>
        </div>
      </section>

      {/* What we offer */}
      <section className="bg-paper py-16 md:py-24">
        <div className="container-page">
          <h2 className="font-display text-[32px] md:text-[40px]">{a.offerTitle}</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {a.offer.map((o, i) => {
              const Icon = offerIcons[i] ?? BedDouble;
              return (
                <div key={o.title}>
                  <span className={`flex size-11 items-center justify-center rounded-lg ${iconTones[i % 4]}`}>
                    <Icon aria-hidden className="size-5" strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 text-[17px] font-semibold">{o.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate">{o.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container-page py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-12">
          <h2 className="font-display text-[32px] leading-tight md:col-span-4 md:text-[40px]">{a.valuesTitle}</h2>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 md:col-span-8">
            {a.values.map((v, i) => {
              const Icon = valueIcons[i] ?? HeartHandshake;
              return (
                <li key={v.title} className="flex gap-4 border-t border-line pt-6">
                  <Icon aria-hidden className={`mt-0.5 size-6 shrink-0 ${["text-cobalt", "text-tile", "text-tulip", "text-[#b07d0e]"][i % 4]}`} strokeWidth={1.7} />
                  <div>
                    <h3 className="text-[17px] font-semibold">{v.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-slate">{v.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Team */}
      <section className="bg-paper py-16 md:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[32px] md:text-[40px]">{a.teamTitle}</h2>
              <p className="mt-2 text-[16px] text-slate">{a.teamIntro}</p>
            </div>
            {property.isDemo ? <Badge tone="saffron">{t.common.demoLabel}</Badge> : null}
          </div>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {a.team.map((m, i) => (
              <li key={m.name} className="rounded-lg border border-line-soft bg-limestone/60 p-6">
                <span aria-hidden className={`flex size-14 items-center justify-center rounded-full font-display text-[20px] ${teamTones[i % 4]}`}>
                  {initials(m.name)}
                </span>
                <p className="mt-5 text-[17px] font-semibold">{m.name}</p>
                <p className="text-[14px] font-medium text-cobalt">{m.role}</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-slate">{m.bio}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Responsible hospitality */}
      <section className="bg-cobalt-deep py-16 text-paper md:py-24">
        <div className="container-page grid gap-10 md:grid-cols-12">
          <h2 className="font-display text-[32px] leading-tight md:col-span-4 md:text-[40px]">{a.responsibleTitle}</h2>
          <ul className="grid gap-8 sm:grid-cols-3 md:col-span-8">
            {a.responsible.map((r, i) => {
              const Icon = responsibleIcons[i] ?? Leaf;
              return (
                <li key={r.title}>
                  <Icon aria-hidden className="size-6 text-tile-bright" strokeWidth={1.7} />
                  <h3 className="mt-4 text-[17px] font-semibold">{r.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-paper/75">{r.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 md:py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl bg-paper p-8 md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="font-display text-[30px] leading-tight md:text-[36px]">{a.ctaTitle}</h2>
            <p className="mt-2 text-[16px] text-slate">{a.ctaBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={href(locale, "/book")}>{t.common.bookYourStay}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={href(locale, "/contact")}>{a.ctaContact}</Link>
            </Button>
          </div>
        </div>
        {property.isDemo ? <p className="mt-6 text-[12.5px] text-mist">{a.teamNote}</p> : null}
      </section>
    </>
  );
}
