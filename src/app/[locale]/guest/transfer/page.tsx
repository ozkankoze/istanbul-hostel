import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TransferForm } from "@/components/forms/transfer-form";
import { GuestCard } from "@/components/guest/card";
import { GuestSubHeader } from "@/components/guest/sub-header";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getSetting } from "@/server/queries";

export default async function GuestTransfer({ params }: PageProps<"/[locale]/guest/transfer">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const [IST, SAW] = await Promise.all([getSetting<number>("transfer.priceIST", 45), getSetting<number>("transfer.priceSAW", 55)]);
  return (
    <>
      <Suspense fallback={null}>
        <GuestSubHeader title={t.guest.sections.transfer} back={t.guest.back} intro={t.guest.transferIntro} />
      </Suspense>
      <GuestCard title={t.experiences.transferCta}>
        <TransferForm prices={{ IST, SAW }} />
      </GuestCard>
    </>
  );
}
