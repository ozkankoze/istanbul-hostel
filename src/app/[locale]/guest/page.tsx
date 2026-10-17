import Image from "next/image";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  ConciergeBell,
  DoorOpen,
  Mail,
  MessageCircle,
  MessageSquareHeart,
  Moon,
  Phone,
  Plane,
  ScrollText,
  Sparkles,
  Ticket,
  Wifi,
} from "lucide-react";
import { GuestCard } from "@/components/guest/card";
import { CopyButton } from "@/components/guest/copy-button";
import { GuestLink } from "@/components/guest/guest-link";
import { GuideIcon } from "@/components/site/guide-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { format, isLocale, pick } from "@/i18n/config";
import { telUrl, whatsappUrl } from "@/lib/links";
import { formatDate, formatMoney } from "@/lib/utils";
import { countReceptionScan, resolveRoom } from "@/server/guest-room";
import { getGuestSession } from "@/server/guest-session";
import { getExperiences, getGuide, getProperty } from "@/server/queries";

export default async function GuestHome({ params, searchParams }: PageProps<"/[locale]/guest">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const g = t.guest;
  const sp = await searchParams;

  const [property, guide, experiences, stay, roomInfo] = await Promise.all([
    getProperty(),
    getGuide(),
    getExperiences(),
    getGuestSession(),
    resolveRoom(sp.room, sp.src),
  ]);
  if (!sp.room) await countReceptionScan(sp.src);
  const c = guide.config;
  if (!c) return <p className="text-slate">Guest guide is not configured yet.</p>;

  const facilities = guide.items.filter((i) => i.section === "FACILITY");
  const rules = guide.items.filter((i) => i.section === "RULE");
  const tours = experiences.filter((e) => !e.isTransfer);
  const checkoutSteps = pick(c.checkoutSteps, locale).split("\n").filter(Boolean);
  const waText = roomInfo.room ? `Hi! ${format(g.roomLabel, { room: roomInfo.room.number })}` : "Hi!";

  const quick = [
    { href: "#wifi", icon: Wifi, label: g.sections.wifi },
    { href: "#breakfast", icon: Coffee, label: g.sections.breakfast },
    { href: "#checkin", icon: DoorOpen, label: g.sections.checkin },
    { href: "#contact", icon: Phone, label: g.sections.contact },
    { href: "#facilities", icon: Sparkles, label: g.sections.facilities },
    { href: "#rules", icon: ScrollText, label: g.sections.rules },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-xl bg-ink text-paper">
        <Image src="/images/terrace.jpg" alt="" fill priority sizes="(max-width: 480px) 100vw, 448px" className="object-cover opacity-45" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
        <div className="relative p-5 pt-16">
          {roomInfo.room ? (
            <Badge className="bg-paper/15 text-paper backdrop-blur-sm">
              {format(g.roomLabel, { room: roomInfo.room.number })} · {pick(roomInfo.room.roomType.name, locale)}
            </Badge>
          ) : null}
          <h1 className="mt-3 font-display text-[30px] leading-[1.1]">{g.welcome}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-paper/80">{g.welcomeSub}</p>
          <p className="mt-3 text-[13.5px] leading-relaxed text-paper/65">{pick(c.welcomeNote, locale)}</p>
        </div>
      </section>
      {roomInfo.param && !roomInfo.room ? (
        <p className="rounded-lg bg-saffron-soft px-4 py-3 text-[13.5px] text-[#6d4b0b]">{format(g.roomUnknown, { room: roomInfo.param })}</p>
      ) : null}

      {/* Stay status */}
      {stay ? (
        <GuestLink path="/requests" className="flex items-center gap-3 rounded-xl border border-tile/25 bg-tile-soft/70 p-4">
          <BadgeCheck aria-hidden className="size-6 shrink-0 text-tile" />
          <div className="flex-1">
            <p className="text-[14.5px] font-semibold">{g.verified}</p>
            <p className="text-[13px] text-slate">
              {format(g.verifiedFor, { name: stay.guest.firstName, date: formatDate(stay.checkOut, locale, { year: undefined }) })}
            </p>
          </div>
          <ChevronRight aria-hidden className="size-5 text-slate" />
        </GuestLink>
      ) : null}

      {/* Quick nav */}
      <nav aria-label={g.title} className="grid grid-cols-3 gap-2">
        {quick.map((q) => (
          <a
            key={q.href}
            href={q.href}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-line-soft bg-paper px-2 py-3.5 text-center text-[12.5px] font-medium leading-tight text-ink-soft transition-colors hover:border-cobalt/40 hover:text-cobalt"
          >
            <q.icon aria-hidden className="size-5 text-cobalt" strokeWidth={1.7} />
            {q.label}
          </a>
        ))}
      </nav>

      {/* Wi-Fi */}
      <GuestCard id="wifi" icon={Wifi} title={g.sections.wifi}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
          <dt className="text-slate">{g.wifiNetwork}</dt>
          <dd className="font-medium break-all">{c.wifiNetwork}</dd>
          <dt className="text-slate">{g.wifiPassword}</dt>
          <dd className="font-mono text-[15px] font-medium break-all">{c.wifiPassword}</dd>
        </dl>
        <div className="mt-4">
          <CopyButton value={c.wifiPassword} label={g.copyPassword} copiedLabel={t.common.copied} />
        </div>
      </GuestCard>

      {/* Breakfast */}
      <GuestCard id="breakfast" icon={Coffee} title={g.sections.breakfast}>
        <p className="text-[18px] font-semibold">{format(g.breakfastHours, { start: c.breakfastStart, end: c.breakfastEnd })}</p>
        <p className="mt-1 text-[14.5px] text-slate">
          {g.breakfastWhere}: {pick(c.breakfastLocation, locale)}
        </p>
        <p className="mt-3 border-t border-line-soft pt-3 text-[14px] leading-relaxed text-ink-soft">
          <span className="font-medium">{g.breakfastMenu}: </span>
          {pick(c.breakfastMenu, locale)}
        </p>
      </GuestCard>

      {/* Check-in / out */}
      <GuestCard id="checkin" icon={DoorOpen} title={g.sections.checkin}>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-limestone px-3 py-3">
            <p className="text-[12.5px] text-slate">{g.checkInFrom}</p>
            <p className="font-display text-[26px] leading-tight">{property.checkInTime}</p>
          </div>
          <div className="rounded-lg bg-limestone px-3 py-3">
            <p className="text-[12.5px] text-slate">{g.checkOutUntil}</p>
            <p className="font-display text-[26px] leading-tight">{property.checkOutTime}</p>
          </div>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          <span className="font-medium">{g.luggage}: </span>
          {pick(c.luggageInfo, locale)}
        </p>
        <h3 className="mt-4 text-[13.5px] font-semibold">{g.checkoutSteps}</h3>
        <ol className="mt-2 space-y-1.5 text-[14px] text-ink-soft">
          {checkoutSteps.map((s, i) => (
            <li key={s} className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cobalt-soft text-[11px] font-semibold text-cobalt">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </GuestCard>

      {/* Contact reception */}
      <GuestCard id="contact" icon={ConciergeBell} title={g.sections.contact}>
        <p className="flex items-center gap-2 text-[14px] text-slate">
          <Clock aria-hidden className="size-4" /> {g.receptionHours}: {pick(c.receptionHours, locale)}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button asChild variant="secondary" className="h-auto flex-col gap-1 py-3 text-[12.5px]">
            <a href={whatsappUrl(property.whatsapp, waText)} target="_blank" rel="noreferrer">
              <MessageCircle aria-hidden className="!size-5 text-tile" />
              {g.whatsappReception}
            </a>
          </Button>
          <Button asChild variant="secondary" className="h-auto flex-col gap-1 py-3 text-[12.5px]">
            <a href={telUrl(property.phone)}>
              <Phone aria-hidden className="!size-5 text-cobalt" />
              {g.callReception}
            </a>
          </Button>
          <Button asChild variant="secondary" className="h-auto flex-col gap-1 py-3 text-[12.5px]">
            <a href={`mailto:${property.email}`}>
              <Mail aria-hidden className="!size-5 text-cobalt" />
              {g.emailReception}
            </a>
          </Button>
        </div>
        <p className="mt-3 text-[13px] text-slate">{property.phone}</p>
        <Button asChild className="mt-4 w-full">
          <GuestLink path="/requests">
            <ConciergeBell aria-hidden /> {g.sections.requests}
          </GuestLink>
        </Button>
      </GuestCard>

      {/* Facilities */}
      <GuestCard id="facilities" icon={Sparkles} title={g.sections.facilities}>
        <ul className="divide-y divide-line-soft">
          {facilities.map((f) => (
            <li key={f.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <GuideIcon name={f.icon} className="mt-0.5 size-5 shrink-0 text-cobalt" />
              <div>
                <p className="text-[15px] font-medium">{pick(f.title, locale)}</p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-slate">{pick(f.body, locale)}</p>
              </div>
            </li>
          ))}
        </ul>
      </GuestCard>

      {/* Tours */}
      <GuestCard
        id="tours"
        icon={Ticket}
        title={g.sections.tours}
        action={
          <GuestLink path="/tours" className="text-[13.5px] font-medium text-cobalt">
            {g.seeAllTours}
          </GuestLink>
        }
      >
        <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
          {tours.map((e) => (
            <li key={e.id} className="w-[62%] shrink-0 snap-start">
              <GuestLink path={`/tours#${e.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image src={e.image} alt="" fill sizes="280px" className="object-cover" />
                </div>
                <p className="mt-2 text-[14.5px] font-medium leading-snug">{pick(e.title, locale)}</p>
                <p className="text-[13px] text-slate">
                  {formatMoney(Number(e.price), "EUR", locale)} {t.common.perPerson}
                </p>
              </GuestLink>
            </li>
          ))}
        </ul>
      </GuestCard>

      {/* Explore + transfer row */}
      <div className="grid grid-cols-2 gap-3">
        <GuestLink path="/explore" className="rounded-xl border border-line-soft bg-paper p-4">
          <Compass aria-hidden className="size-6 text-cobalt" strokeWidth={1.7} />
          <p className="mt-3 text-[15px] font-semibold">{g.sections.explore}</p>
          <p className="mt-0.5 text-[12.5px] text-slate">{t.explore.categories.ATTRACTION}, {t.explore.categories.RESTAURANT.toLowerCase()}…</p>
        </GuestLink>
        <GuestLink path="/transfer" className="rounded-xl border border-line-soft bg-paper p-4">
          <Plane aria-hidden className="size-6 text-cobalt" strokeWidth={1.7} />
          <p className="mt-3 text-[15px] font-semibold">{g.sections.transfer}</p>
          <p className="mt-0.5 text-[12.5px] text-slate">IST · SAW</p>
        </GuestLink>
      </div>

      {/* House rules */}
      <GuestCard id="rules" icon={ScrollText} title={g.sections.rules}>
        <div className="flex items-start gap-3 rounded-lg bg-limestone px-3 py-3">
          <Moon aria-hidden className="mt-0.5 size-5 shrink-0 text-cobalt" strokeWidth={1.7} />
          <p className="text-[15px] font-medium">{format(g.quietHours, { start: c.quietHoursStart, end: c.quietHoursEnd })}</p>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          <span className="font-medium">{g.smoking}: </span>
          {pick(c.smokingPolicy, locale)}
        </p>
        <h3 className="mt-4 text-[13.5px] font-semibold">{g.otherRules}</h3>
        <ul className="mt-2 space-y-2.5">
          {rules.map((r) => (
            <li key={r.id} className="flex gap-3">
              <GuideIcon name={r.icon} className="mt-0.5 size-4 shrink-0 text-slate" />
              <p className="text-[14px] leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">{pick(r.title, locale)}. </span>
                {pick(r.body, locale)}
              </p>
            </li>
          ))}
        </ul>
      </GuestCard>

      {/* Feedback */}
      <GuestCard id="feedback" icon={MessageSquareHeart} title={g.sections.feedback}>
        <p className="text-[14px] leading-relaxed text-slate">{g.feedbackIntro}</p>
        <div className="mt-4 grid gap-2">
          <Button asChild>
            <GuestLink path="/feedback">{g.feedbackSubmit}</GuestLink>
          </Button>
          {property.reviewUrl ? (
            <Button asChild variant="secondary">
              <a href={property.reviewUrl} target="_blank" rel="noreferrer">
                {g.reviewCta}
              </a>
            </Button>
          ) : null}
        </div>
      </GuestCard>

      <p className="px-2 pt-2 text-center text-[12px] leading-relaxed text-mist">
        {g.install}
        <br />
        {t.common.demoLabel} · Medya 333
      </p>
    </div>
  );
}
