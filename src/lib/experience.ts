import type { Dictionary } from "@/i18n/dictionaries/en";

export function formatDuration(minutes: number, t: Pick<Dictionary, "common">) {
  if (minutes < 60) return `${minutes} ${t.common.minutes}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!m) return `${h} ${t.common.hours}`;
  // 150 → "2.5 h"
  if (m === 30) return `${h}.5 ${t.common.hours}`;
  return `${h} ${t.common.hours} ${m} ${t.common.minutes}`;
}

export function formatDays(days: number[], t: Pick<Dictionary, "days" | "experiences">) {
  if (days.length === 7) return t.experiences.everyDay;
  return [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => t.days[d]).join(", ");
}
