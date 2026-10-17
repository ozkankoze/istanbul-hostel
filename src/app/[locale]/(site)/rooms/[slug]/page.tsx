import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  AirVent,
  Bath,
  BedDouble,
  Check,
  ChevronLeft,
  Coffee,
  Eye,
  Lamp,
  Laptop,
  Lock,
  PlugZap,
  Scissors,
  ShowerHead,
  Sparkles,
  Sun,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { BookingSearch } from "@/components/site/booking-search";
import { RoomTile } from "@/components/site/room-tile";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/i18n";
import { format, isLocale, pick } from "@/i18n/config";
import { href } from "@/lib/links";
import { formatMoney } from "@/lib/utils";
import { getRoomTypeBySlug, getRoomTypes, getSetting } from "@/server/queries";

const amenityIcons: Record<string, LucideIcon> = {
  wifi: Wifi,
  locker: Lock,
  curtain: Eye,
  readingLight: Lamp,
  outlet: PlugZap,
  ac: AirVent,
  ensuite: ShowerHead,
  sharedBath: Bath,
  towels: Sparkles,
  desk: Laptop,
  view: Eye,
  kettle: Coffee,
  balcony: Sun,
  hairdryer: Scissors,
  mirror: Sparkles,
  blackout: BedDouble,
};

export async function generateMetadata({ params }: PageProps<"/[locale]/rooms/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const room = await getRoomTypeBySlug(slug);
  if (!room) return {};
  return {
    title: pick(room.name, locale),
    description: pick(room.summary, locale),
    openGraph: { images: room.images.slice(0, 1) },
  };
}

export default async function RoomDetailPage({ params }: PageProps<"/[locale]/rooms/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [room, all, maxGuests] = await Promise.all([
    getRoomTypeBySlug(slug),
    getRoomTypes(),
    getSetting<number>("booking.maxGuests", 8),
  ]);
  if (!room) notFound();
  const name = pick(room.name, locale);
  const others = all.filter((r) => r.id !== room.id).slice(0, 2);
  const [main, ...rest] = room.images;
  const amenityLabels = t.amenities as Record<string, string>;

  return (
    <>
      <div className="container-page pt-8">
        <Link href={href(locale, "/rooms")} className="inline-flex items-center gap-1 text-[14px] text-slate hover:text-ink">
          <ChevronLeft aria-hidden className="size-4" /> {t.rooms.title}
        </Link>
      </div>

      <div className="container-page mt-6 grid gap-3 md:grid-cols-3 md:grid-rows-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[520px]">
          <Image src={main ?? "/images/room-mixed-dorm.jpg"} alt={name} fill priority sizes="(min-width: 768px) 66vw, 100vw" className="object-cover" />
        </div>
        {rest.slice(0, 2).map((src, i) => (
          <div key={src + i} className="relative hidden aspect-[4/3] overflow-hidden rounded-md md:block md:aspect-auto">
            <Image src={src} alt="" fill sizes="33vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="container-page grid gap-12 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-7">
          <div className="flex flex-wrap gap-2">
            <Badge>{room.kind === "DORM" ? t.rooms.dorm : t.rooms.private}</Badge>
            {room.genderPolicy === "FEMALE" ? <Badge tone="tulip">{t.rooms.femaleOnly}</Badge> : null}
          </div>
          <h1 className="mt-4 font-display text-[40px] leading-[1.05] md:text-[56px]">{name}</h1>
          <p className="mt-4 text-[18px] leading-relaxed text-ink-soft">{pick(room.summary, locale)}</p>
          <p className="mt-6 text-[16px] leading-[1.75] text-slate">{pick(room.description, locale)}</p>

          <dl className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-3">
            <div>
              <dt className="text-[12.5px] text-slate">{t.rooms.bedSetup}</dt>
              <dd className="mt-1 text-[15px] font-medium">{pick(room.bedSummary, locale)}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] text-slate">{t.search.guests}</dt>
              <dd className="mt-1 text-[15px] font-medium">
                {room.kind === "DORM"
                  ? format(t.rooms.capacityDorm, { count: room.capacity })
                  : format(t.rooms.capacityPrivate, { count: room.capacity })}
              </dd>
            </div>
            {room.sizeSqm ? (
              <div>
                <dt className="text-[12.5px] text-slate">m²</dt>
                <dd className="mt-1 text-[15px] font-medium">{format(t.rooms.size, { count: room.sizeSqm })}</dd>
              </div>
            ) : null}
          </dl>

          <h2 className="mt-12 font-display text-[26px]">{t.rooms.amenitiesTitle}</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-3">
            {room.amenities.map((a) => {
              const Icon = amenityIcons[a] ?? Check;
              return (
                <li key={a} className="flex items-center gap-2.5 text-[15px] text-ink-soft">
                  <Icon aria-hidden className="size-4 text-cobalt" strokeWidth={1.7} />
                  {amenityLabels[a] ?? a}
                </li>
              );
            })}
          </ul>

          <h2 className="mt-12 font-display text-[26px]">{t.rooms.included}</h2>
          <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {t.rooms.includedList.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[15px] text-ink-soft">
                <Check aria-hidden className="size-4 text-tile" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="md:col-span-5 md:pl-6">
          <div className="sticky top-24 rounded-lg border border-line bg-paper p-6">
            <p>
              <span className="text-[13px] text-slate">{t.common.from} </span>
              <span className="font-display text-[34px] leading-none">{formatMoney(Number(room.basePrice), "EUR", locale)}</span>
              <span className="text-[14px] text-slate"> {t.common.perNight}</span>
            </p>
            <p className="mt-2 text-[13px] text-slate">{t.booking.requestNotice}</p>
            <div className="mt-6">
              <Suspense fallback={null}>
                <BookingSearch variant="inline" room={room.slug} maxGuests={maxGuests} className="md:flex-col [&>div]:p-3 [&_label]:md:border-r-0 [&_label]:md:border-b [&_label]:md:max-w-none" />
              </Suspense>
            </div>
            <p className="mt-4 text-[12px] text-mist">{t.rooms.priceNote}</p>
          </div>
        </aside>
      </div>

      {others.length ? (
        <section className="border-t border-line-soft bg-paper py-16 md:py-20">
          <div className="container-page">
            <h2 className="font-display text-[30px] md:text-[38px]">{t.rooms.otherRooms}</h2>
            <div className="mt-10 grid gap-10 md:grid-cols-2">
              {others.map((r) => (
                <RoomTile key={r.id} room={r} locale={locale} t={t} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
