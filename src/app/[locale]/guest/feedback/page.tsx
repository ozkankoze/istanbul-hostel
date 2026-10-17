import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { GuestCard } from "@/components/guest/card";
import { FeedbackForm } from "@/components/guest/feedback-form";
import { GuestSubHeader } from "@/components/guest/sub-header";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getGuestSession } from "@/server/guest-session";
import { getProperty } from "@/server/queries";

export default async function GuestFeedback({ params, searchParams }: PageProps<"/[locale]/guest/feedback">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const sp = await searchParams;
  const [property, stay] = await Promise.all([getProperty(), getGuestSession()]);
  const room = typeof sp.room === "string" ? sp.room.slice(0, 10) : stay?.allocations[0]?.room.number;
  return (
    <>
      <Suspense fallback={null}>
        <GuestSubHeader title={t.guest.sections.feedback} back={t.guest.back} intro={t.guest.feedbackIntro} />
      </Suspense>
      <div className="space-y-4">
        <GuestCard title={t.guest.feedbackSubmit}>
          <FeedbackForm roomNumber={room} defaultName={stay?.guest.firstName} />
        </GuestCard>
        {property.reviewUrl ? (
          <Button asChild variant="secondary" size="lg" className="w-full">
            <a href={property.reviewUrl} target="_blank" rel="noreferrer">
              {t.guest.reviewCta} <ExternalLink aria-hidden />
            </a>
          </Button>
        ) : null}
      </div>
    </>
  );
}
