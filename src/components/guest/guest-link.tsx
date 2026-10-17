"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { href } from "@/lib/links";

/** Link inside the guest portal that keeps the ?room= context from the QR code. */
export function GuestLink({
  path,
  children,
  ...rest
}: { path: string } & Omit<React.ComponentProps<typeof Link>, "href">) {
  const { locale } = useI18n();
  const sp = useSearchParams();
  const room = sp.get("room");
  const base = href(locale, `/guest${path === "/" ? "" : path}`);
  const [p, hash] = base.split("#");
  const url = `${p}${room ? `?room=${encodeURIComponent(room)}` : ""}${hash ? `#${hash}` : ""}`;
  return (
    <Link href={url} {...rest}>
      {children}
    </Link>
  );
}
