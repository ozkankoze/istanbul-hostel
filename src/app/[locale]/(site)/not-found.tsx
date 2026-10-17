"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { href } from "@/lib/links";

export default function NotFound() {
  const { locale, dict } = useI18n();
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-start justify-center py-24">
      <p className="font-display text-[80px] leading-none text-cobalt/25">404</p>
      <h1 className="mt-4 font-display text-[40px]">{dict.notFound.title}</h1>
      <p className="mt-3 max-w-md text-[16px] text-slate">{dict.notFound.body}</p>
      <Button asChild className="mt-8">
        <Link href={href(locale)}>{dict.notFound.home}</Link>
      </Button>
    </div>
  );
}
