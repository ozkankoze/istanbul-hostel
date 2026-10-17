import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Dictionary } from "@/i18n";
import { pick, type Locale } from "@/i18n/config";
import { href } from "@/lib/links";
import { formatMoney } from "@/lib/utils";
import { formatDuration } from "@/lib/experience";

export type ExperienceLike = {
  slug: string;
  title: unknown;
  summary: unknown;
  durationMinutes: number;
  price: unknown;
  priceUnit: string;
  image: string;
  isTransfer: boolean;
};

export function ExperienceCard({ exp, locale, t }: { exp: ExperienceLike; locale: Locale; t: Dictionary }) {
  const title = pick(exp.title, locale);
  return (
    <Link href={href(locale, `/experiences/${exp.slug}`)} className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-limestone-deep">
        <Image
          src={exp.image}
          alt={title}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 85vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="font-display text-[22px] leading-tight transition-colors group-hover:text-cobalt">{title}</h3>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-slate">{pick(exp.summary, locale)}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-[13.5px]">
          <span className="inline-flex items-center gap-1.5 text-slate">
            <Clock aria-hidden className="size-3.5" />
            {formatDuration(exp.durationMinutes, t)}
          </span>
          <span className="font-medium text-ink">
            {formatMoney(Number(exp.price), "EUR", locale)}{" "}
            <span className="font-normal text-slate">{exp.priceUnit === "GROUP" ? t.common.perGroup : t.common.perPerson}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
