import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { InternalNote } from "@/components/admin/internal-note";
import { ReservationActions } from "@/components/admin/reservation-actions";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { nightsBetween } from "@/lib/dates";
import { pick } from "@/i18n/config";
import { RES_STATUS } from "@/lib/status";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { requirePermission } from "@/server/auth";

export default async function ReservationDetail({ params }: PageProps<"/admin/reservations/[id]">) {
  await requirePermission("reservations");
  const { id } = await params;
  const r = await db.reservation.findUnique({
    where: { id },
    include: {
      guest: true,
      roomType: true,
      allocations: { include: { room: { select: { number: true } }, bed: { select: { label: true } } } },
      serviceRequests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!r) notFound();
  const history = await db.auditLog.findMany({ where: { entity: "Reservation", entityId: r.id }, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } });
  const otherStays = await db.reservation.count({ where: { guestId: r.guestId, id: { not: r.id } } });
  const s = RES_STATUS[r.status]!;
  const nights = nightsBetween(r.checkIn, r.checkOut);

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/reservations", label: "Reservations" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{r.reference}</span>
            <Badge tone={s.tone} dot>
              {s.label}
            </Badge>
          </span>
        }
        description={`Requested ${formatDateTime(r.createdAt)} via ${r.source.toLowerCase().replace("_", " ")} · language ${r.locale.toUpperCase()}`}
        actions={<ReservationActions id={r.id} status={r.status} reference={r.reference} size="md" />}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Stay">
            <dl className="grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-[12.5px] text-slate">Check-in</dt>
                <dd className="mt-0.5 text-[15px] font-medium">{formatDate(r.checkIn, "en", { weekday: "short" })}</dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-slate">Check-out</dt>
                <dd className="mt-0.5 text-[15px] font-medium">{formatDate(r.checkOut, "en", { weekday: "short" })}</dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-slate">Length</dt>
                <dd className="mt-0.5 text-[15px] font-medium">
                  {nights} night{nights > 1 ? "s" : ""} · {r.guests} guest{r.guests > 1 ? "s" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-slate">Room type</dt>
                <dd className="mt-0.5 text-[15px] font-medium">{pick(r.roomType.name, "en")}</dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-slate">Units</dt>
                <dd className="mt-0.5 text-[15px] font-medium">
                  {r.units} {r.roomType.kind === "DORM" ? "bed" : "room"}
                  {r.units > 1 ? "s" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[12.5px] text-slate">Price</dt>
                <dd className="mt-0.5 text-[15px] font-medium">
                  {formatMoney(Number(r.totalPrice))}{" "}
                  <span className="text-[13px] font-normal text-slate">
                    ({formatMoney(Number(r.nightlyPrice))} × {r.units} × {nights})
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-line-soft pt-4">
              <p className="text-[12.5px] text-slate">Assigned beds</p>
              {r.allocations.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.allocations.map((a) => (
                    <Badge key={a.id} tone="dark">
                      Room {a.room.number}
                      {r.roomType.kind === "DORM" && a.bed ? ` · bed ${a.bed.label}` : ""}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-[14px] text-slate">
                  {r.status === "PENDING" ? "Beds are assigned automatically when you confirm." : "No beds assigned."}
                </p>
              )}
            </div>
            {r.specialRequests ? (
              <div className="mt-5 rounded-md bg-limestone px-4 py-3">
                <p className="text-[12.5px] text-slate">Guest&apos;s notes</p>
                <p className="mt-1 whitespace-pre-line text-[14.5px]">{r.specialRequests}</p>
              </div>
            ) : null}
            {r.statusReason ? <p className="mt-3 text-[13.5px] text-slate">Reason: {r.statusReason}</p> : null}
          </Panel>
          <Panel title="Internal note" description="Only visible to staff">
            <InternalNote id={r.id} initial={r.internalNote ?? ""} />
          </Panel>
          {r.serviceRequests.length ? (
            <Panel title="Guest guide requests">
              <ul className="space-y-2 text-[14px]">
                {r.serviceRequests.map((sr) => (
                  <li key={sr.id} className="flex justify-between gap-4">
                    <span>{sr.message}</span>
                    <span className="shrink-0 text-[12.5px] text-slate">{formatDateTime(sr.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
        <div className="space-y-6">
          <Panel title="Guest" actions={<Link href={`/admin/guests/${r.guestId}`} className="text-[13px] font-medium text-cobalt">Profile</Link>}>
            <p className="text-[16px] font-semibold">
              {r.guest.firstName} {r.guest.lastName}
            </p>
            {r.guest.country ? <p className="text-[13.5px] text-slate">{r.guest.country}</p> : null}
            <ul className="mt-4 space-y-2 text-[14px]">
              <li>
                <a href={`mailto:${r.guest.email}`} className="inline-flex items-center gap-2 text-cobalt hover:underline">
                  <Mail aria-hidden className="size-4" /> {r.guest.email}
                </a>
              </li>
              {r.guest.phone ? (
                <li>
                  <a href={`tel:${r.guest.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 text-cobalt hover:underline">
                    <Phone aria-hidden className="size-4" /> {r.guest.phone}
                  </a>
                </li>
              ) : null}
            </ul>
            <p className="mt-4 text-[13px] text-slate">{otherStays ? `${otherStays} other reservation${otherStays > 1 ? "s" : ""}` : "First stay with us"}</p>
          </Panel>
          <Panel title="History">
            {history.length ? (
              <ol className="space-y-3 border-l border-line pl-4">
                {history.map((h) => (
                  <li key={h.id} className="text-[13.5px]">
                    <p>{h.summary}</p>
                    <p className="text-[12px] text-mist">
                      {h.user?.name ?? "System"} · {formatDateTime(h.createdAt)}
                    </p>
                  </li>
                ))}
                <li className="text-[13.5px]">
                  <p>Request received</p>
                  <p className="text-[12px] text-mist">{formatDateTime(r.createdAt)}</p>
                </li>
              </ol>
            ) : (
              <p className="text-[13.5px] text-slate">Request received {formatDateTime(r.createdAt)}. No changes yet.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
