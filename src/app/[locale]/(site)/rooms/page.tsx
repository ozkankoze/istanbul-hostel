import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, Check, Users } from "lucide-react";
import { PageHeader } from "@/components/site/section";
import { FromPrice } from "@/components/site/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { format, isLocale, pick } from "@/i18n/config";
import { href } from "@/lib/links";
import { cn } from "@/lib/utils";
import { getRoomTypes } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/rooms">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: t.rooms.title, description: t.rooms.intro };
}

export default async function RoomsPage({ params }: PageProps<"/[locale]/rooms">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const roomTypes = await getRoomTypes();

  return (
    <>
      <PageHeader title={t.rooms.title} intro={t.rooms.intro}>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-ink-soft">
          {t.rooms.includedList.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Check aria-hidden className="size-4 text-tile" /> {item}
            </li>
          ))}
        </ul>
      </PageHeader>

      <div className="container-page divide-y divide-line-soft">
        {roomTypes.map((room, i) => {
          const name = pick(room.name, locale);
          return (
            <article key={room.id} className="grid items-center gap-8 py-14 md:grid-cols-12 md:gap-12 md:py-20">
              <Link
                href={href(locale, `/rooms/${room.slug}`)}
                className={cn("group relative block aspect-[4/3] overflow-hidden rounded-md md:col-span-7", i % 2 === 1 && "md:order-2")}
              >
                <Image
                  src={room.images[0] ?? "/images/room-mixed-dorm.jpg"}
                  alt={name}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 768px) 58vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </Link>
              <div className="md:col-span-5">
                <div className="flex flex-wrap gap-2">
                  <Badge>{room.kind === "DORM" ? t.rooms.dorm : t.rooms.private}</Badge>
                  {room.genderPolicy === "FEMALE" ? <Badge tone="tulip">{t.rooms.femaleOnly}</Badge> : null}
                </div>
                <h2 className="mt-4 font-display text-[34px] leading-tight md:text-[40px]">{name}</h2>
                <p className="mt-3 text-[16px] leading-relaxed text-slate">{pick(room.summary, locale)}</p>
                <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-ink-soft">
                  <div className="inline-flex items-center gap-1.5">
                    <dt className="sr-only">{t.rooms.bedSetup}</dt>
                    <BedDouble aria-hidden className="size-4 text-slate" />
                    <dd>{pick(room.bedSummary, locale)}</dd>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <dt className="sr-only">{t.search.guests}</dt>
                    <Users aria-hidden className="size-4 text-slate" />
                    <dd>
                      {room.kind === "DORM"
                        ? format(t.rooms.capacityDorm, { count: room.capacity })
                        : format(t.rooms.capacityPrivate, { count: room.capacity })}
                    </dd>
                  </div>
                  {room.sizeSqm ? <dd>{format(t.rooms.size, { count: room.sizeSqm })}</dd> : null}
                </dl>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-line pt-6">
                  <FromPrice value={Number(room.basePrice)} locale={locale} fromLabel={t.common.from} unitLabel={t.common.perNight} />
                  <div className="flex gap-2">
                    <Button asChild variant="secondary">
                      <Link href={href(locale, `/rooms/${room.slug}`)}>{t.common.viewDetails}</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`${href(locale, "/book")}?room=${room.slug}`}>{t.rooms.bookThis}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="container-page pb-16 text-[13px] text-mist">{t.rooms.priceNote}</p>
    </>
  );
}
