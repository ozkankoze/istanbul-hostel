import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { DeleteGuideItem, DeletePlace, GuideConfigForm, GuideItemDialog, PlaceDialog, ServiceRequestButtons } from "@/components/admin/guide-forms";
import { AdminHeader, Empty, Panel, Table } from "@/components/admin/ui";
import { GuideIcon } from "@/components/site/guide-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { pick } from "@/i18n/config";
import { SR_STATUS, SR_TYPE } from "@/lib/status";
import { cn, formatDateTime } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { getProperty } from "@/server/queries";

export const metadata = { title: "Guest Guide" };

const TABS = {
  essentials: "Essentials",
  info: "Facilities, rules & transport",
  places: "Local recommendations",
  requests: "Guest requests",
  feedback: "Feedback",
} as const;

export default async function GuideAdmin({ searchParams }: PageProps<"/admin/guide">) {
  await requirePermission("guide");
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" && sp.tab in TABS ? (sp.tab as keyof typeof TABS) : "essentials";
  const property = await getProperty();
  const openRequests = await db.serviceRequest.count({ where: { status: { not: "RESOLVED" } } });

  return (
    <>
      <AdminHeader
        title="Guest Guide"
        description="Everything guests see after scanning the QR code. Changes are live immediately."
        actions={
          <Button asChild variant="secondary">
            <a href="/en/guest" target="_blank">
              Open guest guide <ExternalLink aria-hidden />
            </a>
          </Button>
        }
      />
      <nav className="-mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-line px-1" aria-label="Guide sections">
        {Object.entries(TABS).map(([k, label]) => (
          <Link
            key={k}
            href={k === "essentials" ? "/admin/guide" : `/admin/guide?tab=${k}`}
            aria-current={tab === k ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-[14px] transition-colors",
              tab === k ? "border-cobalt font-medium text-ink" : "border-transparent text-slate hover:text-ink",
            )}
          >
            {label}
            {k === "requests" && openRequests ? <Badge tone="saffron" className="ml-1.5">{openRequests}</Badge> : null}
          </Link>
        ))}
      </nav>

      {tab === "essentials" ? <Essentials propertyId={property.id} checkIn={property.checkInTime} checkOut={property.checkOutTime} /> : null}
      {tab === "info" ? <InfoItems propertyId={property.id} /> : null}
      {tab === "places" ? <Places propertyId={property.id} /> : null}
      {tab === "requests" ? <Requests /> : null}
      {tab === "feedback" ? <Feedback reviewUrl={property.reviewUrl} /> : null}
    </>
  );
}

async function Essentials({ propertyId, checkIn, checkOut }: { propertyId: string; checkIn: string; checkOut: string }) {
  const c = await db.guideConfig.findUnique({ where: { propertyId } });
  return (
    <Panel>
      <GuideConfigForm
        c={{
          welcomeNote: c?.welcomeNote ?? {},
          wifiNetwork: c?.wifiNetwork ?? "",
          wifiPassword: c?.wifiPassword ?? "",
          breakfastStart: c?.breakfastStart ?? "07:30",
          breakfastEnd: c?.breakfastEnd ?? "10:30",
          breakfastLocation: c?.breakfastLocation ?? {},
          breakfastMenu: c?.breakfastMenu ?? {},
          luggageInfo: c?.luggageInfo ?? {},
          quietHoursStart: c?.quietHoursStart ?? "23:00",
          quietHoursEnd: c?.quietHoursEnd ?? "08:00",
          smokingPolicy: c?.smokingPolicy ?? {},
          checkoutSteps: c?.checkoutSteps ?? {},
          receptionHours: c?.receptionHours ?? {},
          checkInTime: checkIn,
          checkOutTime: checkOut,
        }}
      />
    </Panel>
  );
}

async function InfoItems({ propertyId }: { propertyId: string }) {
  const items = await db.guideItem.findMany({ where: { propertyId }, orderBy: [{ section: "asc" }, { sortOrder: "asc" }] });
  const groups = [
    { section: "FACILITY" as const, title: "Facilities" },
    { section: "RULE" as const, title: "House rules" },
    { section: "TRANSPORT" as const, title: "Transport instructions" },
  ];
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {groups.map((g) => (
        <Panel key={g.section} title={g.title} actions={<GuideItemDialog section={g.section} />} bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {items
              .filter((i) => i.section === g.section)
              .map((i) => (
                <li key={i.id} className={cn("flex items-start gap-3 px-4 py-3", !i.isActive && "opacity-50")}>
                  <GuideIcon name={i.icon} className="mt-0.5 size-4 shrink-0 text-cobalt" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{pick(i.title, "en")}</p>
                    <p className="line-clamp-2 text-[12.5px] text-slate">{pick(i.body, "en")}</p>
                  </div>
                  <GuideItemDialog section={g.section} item={{ id: i.id, section: i.section, icon: i.icon, title: i.title, body: i.body, sortOrder: i.sortOrder, isActive: i.isActive }} />
                  <DeleteGuideItem id={i.id} label={pick(i.title, "en")} />
                </li>
              ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}

async function Places({ propertyId }: { propertyId: string }) {
  const places = await db.place.findMany({ where: { propertyId }, orderBy: { sortOrder: "asc" } });
  return (
    <Panel title="Local recommendations" description="Shown on Explore Istanbul and in the guest guide" actions={<PlaceDialog />} bodyClassName="p-0">
      <ul className="divide-y divide-line-soft">
        {places.map((p) => (
          <li key={p.id} className={cn("flex items-center gap-4 px-4 py-3", !p.isActive && "opacity-50")}>
            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-limestone">
              {p.image ? <Image src={p.image} alt="" fill sizes="64px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-medium">{p.name}</p>
              <p className="text-[12.5px] text-slate">
                {p.category.toLowerCase()} · {p.area}
                {p.walkingMinutes ? ` · ${p.walkingMinutes} min walk` : ""}
              </p>
            </div>
            <PlaceDialog
              place={{
                id: p.id,
                name: p.name,
                category: p.category,
                area: p.area,
                description: p.description,
                walkingMinutes: p.walkingMinutes,
                transitNote: p.transitNote ?? {},
                mapQuery: p.mapQuery,
                image: p.image,
                sortOrder: p.sortOrder,
                isActive: p.isActive,
              }}
            />
            <DeletePlace id={p.id} label={p.name} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

async function Requests() {
  const requests = await db.serviceRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { room: { select: { number: true } }, reservation: { select: { id: true, reference: true, guest: { select: { firstName: true, lastName: true } } } } },
  });
  return (
    <Panel description="Sent by verified guests from the QR guide. Maintenance and cleaning requests also create a housekeeping task." bodyClassName="p-0" title="Guest requests">
      {requests.length ? (
        <Table>
          <thead>
            <tr>
              <th>When</th>
              <th>Room</th>
              <th>Request</th>
              <th>Guest</th>
              <th>Status</th>
              <th className="w-px" />
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap text-[13px] text-slate">{formatDateTime(r.createdAt)}</td>
                <td className="font-semibold">{r.room?.number ?? "—"}</td>
                <td>
                  <span className="block font-medium">{SR_TYPE[r.type]}</span>
                  <span className="text-[13px] text-slate">{r.message}</span>
                </td>
                <td className="text-[13px]">
                  {r.reservation ? (
                    <Link href={`/admin/reservations/${r.reservation.id}`} className="text-cobalt hover:underline">
                      {r.reservation.guest.firstName} {r.reservation.guest.lastName}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <Badge tone={SR_STATUS[r.status]!.tone} dot>
                    {SR_STATUS[r.status]!.label}
                  </Badge>
                </td>
                <td>
                  <ServiceRequestButtons id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Empty>No guest requests yet.</Empty>
      )}
    </Panel>
  );
}

async function Feedback({ reviewUrl }: { reviewUrl: string | null }) {
  const feedback = await db.feedback.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <Panel title="Feedback" description="Private messages from the guest guide — only staff see these." actions={reviewUrl ? <a href={reviewUrl} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-cobalt">Public review page ↗</a> : null} bodyClassName="p-0">
      {feedback.length ? (
        <ul className="divide-y divide-line-soft">
          {feedback.map((f) => (
            <li key={f.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex" aria-label={`${f.rating} out of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} aria-hidden className={cn("size-4", n <= f.rating ? "fill-saffron text-saffron" : "text-line")} />
                  ))}
                </span>
                <span className="text-[13px] text-slate">
                  {f.name ?? "Anonymous"}
                  {f.roomNumber ? ` · room ${f.roomNumber}` : ""} · {formatDateTime(f.createdAt)}
                </span>
                {f.isDemo ? <Badge tone="saffron">demo</Badge> : null}
              </div>
              <p className="mt-2 text-[14.5px]">{f.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No feedback yet.</Empty>
      )}
    </Panel>
  );
}
