import Image from "next/image";
import Link from "next/link";
import { BedDouble, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/i18n";
import { format, pick, type Locale } from "@/i18n/config";
import { href } from "@/lib/links";
import { FromPrice } from "./price";

export type RoomTypeLike = {
  slug: string;
  name: unknown;
  summary: unknown;
  kind: "DORM" | "PRIVATE";
  genderPolicy: "MIXED" | "FEMALE";
  capacity: number;
  basePrice: unknown;
  images: string[];
};

export function RoomTile({
  room,
  locale,
  t,
  priority,
  sizes = "(min-width: 1024px) 45vw, 100vw",
}: {
  room: RoomTypeLike;
  locale: Locale;
  t: Dictionary;
  priority?: boolean;
  sizes?: string;
}) {
  const name = pick(room.name, locale);
  return (
    <Link href={href(locale, `/rooms/${room.slug}`)} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-limestone-deep">
        <Image
          src={room.images[0] ?? "/images/room-mixed-dorm.jpg"}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge tone="dark" className="bg-ink/80 backdrop-blur-sm">
            {room.kind === "DORM" ? t.rooms.dorm : t.rooms.private}
          </Badge>
          {room.genderPolicy === "FEMALE" ? (
            <Badge className="bg-paper/90 text-ink backdrop-blur-sm">{t.rooms.femaleOnly}</Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-[24px] leading-tight transition-colors group-hover:text-cobalt">{name}</h3>
          <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-slate">{pick(room.summary, locale)}</p>
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-slate">
            {room.kind === "DORM" ? <BedDouble aria-hidden className="size-4" /> : <Users aria-hidden className="size-4" />}
            {room.kind === "DORM"
              ? format(t.rooms.capacityDorm, { count: room.capacity })
              : format(t.rooms.capacityPrivate, { count: room.capacity })}
          </p>
        </div>
        <FromPrice
          value={Number(room.basePrice)}
          locale={locale}
          fromLabel={t.common.from}
          unitLabel={t.common.perNight}
          className="shrink-0 whitespace-nowrap text-right"
        />
      </div>
    </Link>
  );
}
