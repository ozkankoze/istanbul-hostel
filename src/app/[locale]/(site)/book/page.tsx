import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Info } from "lucide-react";
import { BookingFlow, type BookingOption } from "@/components/booking/booking-flow";
import { BookingSearch } from "@/components/site/booking-search";
import { getDictionary } from "@/i18n";
import { isLocale, pick } from "@/i18n/config";
import { toISODate } from "@/lib/dates";
import { searchAvailability } from "@/server/availability";
import { validateStay } from "@/server/booking";
import { getRoomTypes, getSetting } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/book">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: t.booking.title, description: t.booking.intro };
}

export default async function BookPage({ params, searchParams }: PageProps<"/[locale]/book">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const [maxNights, maxGuests, roomTypes] = await Promise.all([
    getSetting<number>("booking.maxNights", 30),
    getSetting<number>("booking.maxGuests", 8),
    getRoomTypes(),
  ]);

  const hasQuery = !!(str("checkIn") && str("checkOut"));
  const stay = hasQuery
    ? validateStay({ checkIn: str("checkIn"), checkOut: str("checkOut"), guests: str("guests") ?? 1 }, t, { maxNights, maxGuests })
    : null;

  let options: BookingOption[] = [];
  if (stay?.ok) {
    const avail = await searchAvailability(stay);
    options = roomTypes.flatMap((rt) => {
      const a = avail.find((x) => x.roomTypeId === rt.id);
      if (!a) return [];
      return [
        {
          id: rt.id,
          slug: rt.slug,
          name: pick(rt.name, locale),
          summary: pick(rt.summary, locale),
          bedSummary: pick(rt.bedSummary, locale),
          image: rt.images[0] ?? "/images/room-mixed-dorm.jpg",
          kind: rt.kind,
          female: rt.genderPolicy === "FEMALE",
          capacity: rt.capacity,
          freeUnits: a.freeUnits,
          unitsNeeded: a.unitsNeeded,
          fits: a.fits,
          nightlyPrice: a.nightlyPrice,
          total: a.total,
        },
      ];
    });
  }

  return (
    <>
      <div className="border-b border-line-soft">
        <div className="container-page pb-10 pt-14 md:pt-20">
          <h1 className="font-display text-[40px] leading-[1.05] md:text-[60px]">{t.booking.title}</h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-slate">{t.booking.intro}</p>
          <p className="mt-6 flex max-w-3xl items-start gap-2.5 rounded-md border border-cobalt/15 bg-cobalt-soft/60 px-4 py-3 text-[14px] leading-relaxed text-cobalt">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {t.booking.requestNotice}
          </p>
          <div className="mt-8">
            <Suspense fallback={null}>
              <BookingSearch
                variant="inline"
                maxGuests={maxGuests}
                room={str("room")}
                initial={
                  stay?.ok
                    ? { checkIn: toISODate(stay.checkIn), checkOut: toISODate(stay.checkOut), guests: stay.guests }
                    : { checkIn: str("checkIn"), checkOut: str("checkOut"), guests: Number(str("guests")) || 1 }
                }
              />
            </Suspense>
            {stay && !stay.ok ? (
              <p role="alert" className="mt-3 text-[14px] text-tulip">
                {stay.message}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div id="results" className="container-page scroll-mt-24 py-12 md:py-16">
        {stay?.ok ? (
          <BookingFlow
            key={`${toISODate(stay.checkIn)}-${toISODate(stay.checkOut)}-${stay.guests}`}
            stay={{ checkIn: toISODate(stay.checkIn), checkOut: toISODate(stay.checkOut), guests: stay.guests, nights: stay.nights }}
            options={options}
            preselect={str("room")}
          />
        ) : (
          <p className="text-[16px] text-slate">{t.booking.chooseDates}</p>
        )}
      </div>
    </>
  );
}
