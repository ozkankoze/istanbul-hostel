"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import { locales, localeNames } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { switchLocalePath } from "@/lib/links";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ tone = "ink", className }: { tone?: "ink" | "light"; className?: string }) {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams();
  const qs = search.toString();

  return (
    <nav aria-label={dict.common.language} className={cn("flex items-center gap-1", className)}>
      <Globe aria-hidden className={cn("mr-1 size-3.5", tone === "light" ? "text-paper/70" : "text-mist")} />
      {locales.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={`${switchLocalePath(pathname, l)}${qs ? `?${qs}` : ""}`}
            hrefLang={l}
            lang={l}
            aria-current={active ? "true" : undefined}
            title={localeNames[l]}
            scroll={false}
            className={cn(
              "rounded-sm px-1.5 py-1 text-[12.5px] font-semibold tracking-wide transition-colors",
              tone === "light"
                ? active
                  ? "text-paper"
                  : "text-paper/55 hover:text-paper"
                : active
                  ? "text-ink"
                  : "text-mist hover:text-ink",
            )}
          >
            {l.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
