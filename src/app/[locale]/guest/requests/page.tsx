import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { GuestCard } from "@/components/guest/card";
import { ServiceRequestForm } from "@/components/guest/request-form";
import { GuestSignOut } from "@/components/guest/sign-out";
import { GuestSubHeader } from "@/components/guest/sub-header";
import { VerifyForm } from "@/components/guest/verify-form";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { getDictionary } from "@/i18n";
import { format, isLocale, pick } from "@/i18n/config";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getGuestSession } from "@/server/guest-session";

export default async function RequestsPage({ params }: PageProps<"/[locale]/guest/requests">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const g = t.guest;
  const stay = await getGuestSession();
  const requests = stay
    ? await db.serviceRequest.findMany({
        where: { reservationId: stay.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { room: { select: { number: true } } },
      })
    : [];
  const rooms = stay ? [...new Map(stay.allocations.map((a) => [a.room.id, a.room])).values()] : [];

  return (
    <>
      <Suspense fallback={null}>
        <GuestSubHeader title={g.sections.requests} back={g.back} intro={g.requestsIntro} />
      </Suspense>
      {!stay ? (
        <GuestCard icon={ShieldCheck} title={g.verifyTitle}>
          <p className="mb-4 text-[14px] leading-relaxed text-slate">{g.verifyIntro}</p>
          <VerifyForm />
        </GuestCard>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-tile/25 bg-tile-soft/70 p-4">
            <BadgeCheck aria-hidden className="size-6 shrink-0 text-tile" />
            <div className="flex-1">
              <p className="text-[14.5px] font-semibold">
                {g.verified} · {stay.reference}
              </p>
              <p className="text-[13px] text-slate">
                {pick(stay.roomType.name, locale)}
                {rooms.length ? ` · ${rooms.map((r) => format(g.roomLabel, { room: r.number })).join(", ")}` : ""}
                {" · "}
                {format(g.verifiedFor, { name: stay.guest.firstName, date: formatDate(stay.checkOut, locale, { year: undefined }) })}
              </p>
            </div>
          </div>
          <GuestCard title={g.requestType}>
            <ServiceRequestForm rooms={rooms} />
          </GuestCard>
          <GuestCard title={g.yourRequests}>
            {requests.length ? (
              <ul className="divide-y divide-line-soft">
                {requests.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-[14.5px] font-medium">{g.requestTypes[r.type]}</p>
                      <p className="text-[12.5px] text-slate">
                        {formatDateTime(r.createdAt, locale)} · {r.reference}
                        {r.room ? ` · ${r.room.number}` : ""}
                      </p>
                    </div>
                    <Badge tone={r.status === "RESOLVED" ? "tile" : r.status === "IN_PROGRESS" ? "cobalt" : "saffron"} dot>
                      {g.requestStatus[r.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-slate">{g.noRequests}</p>
            )}
          </GuestCard>
          <div className="text-center">
            <GuestSignOut label={g.signOut} />
          </div>
        </div>
      )}
    </>
  );
}
