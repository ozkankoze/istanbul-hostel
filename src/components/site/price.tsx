import { formatMoney } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

export function FromPrice({
  value,
  locale,
  fromLabel,
  unitLabel,
  className,
}: {
  value: number;
  locale: Locale;
  fromLabel: string;
  unitLabel: string;
  className?: string;
}) {
  return (
    <p className={className}>
      <span className="text-[13px] text-slate">{fromLabel} </span>
      <span className="font-display text-[22px] leading-none text-ink">{formatMoney(value, "EUR", locale)}</span>
      <span className="text-[13px] text-slate"> {unitLabel}</span>
    </p>
  );
}
