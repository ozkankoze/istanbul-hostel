import Link from "next/link";
import { BedDouble, CalendarDays, ExternalLink, MessageCircle, Phone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/utils";
import type { BookingCard } from "@/server/staff-bookings";
import { BookingActions } from "./booking-actions";

function digits(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function BookingList({ items, empty, departing }: { items: BookingCard[]; empty: string; departing?: boolean }) {
  if (!items.length) return <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[14px] text-slate">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((b) => (
        <li key={b.id} className="rounded-xl border border-line bg-paper p-4 shadow-[0_1px_2px_rgba(30,34,39,.04)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold">{b.guestName}</p>
              <p className="text-[13px] text-slate">
                <span className="font-mono">{b.reference}</span>
                {b.country ? ` · ${b.country}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-right text-[15px] font-semibold">{formatMoney(b.total)}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13.5px] text-ink/85">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4 text-slate" aria-hidden />
              {formatDate(b.checkIn, "en", { day: "numeric", month: "short" })} → {formatDate(b.checkOut, "en", { day: "numeric", month: "short" })} · {b.nights}{" "}
              {b.nights === 1 ? "night" : "nights"}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4 text-slate" aria-hidden />
              {b.guests} {b.guests === 1 ? "guest" : "guests"}
            </span>
            <span className="flex items-center gap-1.5">
              <BedDouble className="size-4 text-slate" aria-hidden />
              {b.roomType}
              {b.rooms.length ? ` · Room ${b.rooms.join(", ")}` : ""}
            </span>
          </div>

          {b.specialRequests ? (
            <p className="mt-3 rounded-lg bg-saffron/10 px-3 py-2 text-[13.5px] text-ink/90">“{b.specialRequests}”</p>
          ) : null}
          {b.isDemo ? (
            <Badge tone="neutral" className="mt-3">
              Demo booking
            </Badge>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <BookingActions id={b.id} status={b.status} reference={b.reference} departing={departing} />
            {b.phone ? (
              <>
                <a href={`tel:${b.phone.replace(/\s/g, "")}`} aria-label={`Call ${b.guestName}`} className="flex size-10 items-center justify-center rounded-lg border border-line bg-white text-ink hover:bg-limestone">
                  <Phone className="size-[18px]" aria-hidden />
                </a>
                <a
                  href={`https://wa.me/${digits(b.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${b.guestName}`}
                  className="flex size-10 items-center justify-center rounded-lg border border-line bg-white text-tile hover:bg-limestone"
                >
                  <MessageCircle className="size-[18px]" aria-hidden />
                </a>
              </>
            ) : null}
            <Link href={`/admin/reservations/${b.id}`} className="ml-auto flex items-center gap-1 text-[13px] font-medium text-cobalt">
              Details <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
