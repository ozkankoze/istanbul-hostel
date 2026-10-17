import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { BlockDatesForm, RemoveBlockButton, RoomDialog } from "@/components/admin/room-forms";
import { AdminHeader, Empty, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { propertyToday, toISODate } from "@/lib/dates";
import { pick } from "@/i18n/config";
import { HK_STATUS } from "@/lib/status";
import { formatDate, formatMoney } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { getProperty } from "@/server/queries";

export const metadata = { title: "Rooms & Beds" };

export default async function RoomsAdmin() {
  await requirePermission("rooms");
  const property = await getProperty();
  const today = propertyToday();
  const [types, rooms, blocks] = await Promise.all([
    db.roomType.findMany({ where: { propertyId: property.id }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { rooms: true } } } }),
    db.room.findMany({
      where: { propertyId: property.id },
      orderBy: { number: "asc" },
      include: { roomType: { select: { name: true, kind: true } }, beds: { where: { isActive: true }, select: { id: true } } },
    }),
    db.blockedDate.findMany({ where: { endDate: { gte: today } }, orderBy: { startDate: "asc" }, include: { room: { select: { number: true } } } }),
  ]);
  const typeOpts = types.map((t) => ({ id: t.id, name: pick(t.name, "en"), kind: t.kind, capacity: t.capacity }));

  return (
    <>
      <AdminHeader title="Rooms & Beds" description="Room types and prices shown on the website, the physical rooms and beds behind them, and dates that can't be booked." />

      <Panel
        title="Room types & prices"
        description="What guests see and book on the website"
        actions={
          <Button asChild size="sm" variant="secondary">
            <Link href="/admin/rooms/types/new">
              <Plus aria-hidden /> New room type
            </Link>
          </Button>
        }
        bodyClassName="p-0"
      >
        <ul className="divide-y divide-line-soft">
          {types.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-limestone">
                {t.images[0] ? <Image src={t.images[0]} alt="" fill sizes="80px" className="object-cover" /> : null}
              </div>
              <div className="min-w-48 flex-1">
                <p className="font-medium">
                  {pick(t.name, "en")} {!t.isActive ? <Badge tone="neutral">Hidden</Badge> : null}
                </p>
                <p className="text-[13px] text-slate">
                  {t.kind === "DORM" ? `Dorm · ${t.capacity} beds per room` : `Private · up to ${t.capacity} guests`} · {t._count.rooms} room{t._count.rooms === 1 ? "" : "s"}
                  {t.genderPolicy === "FEMALE" ? " · women only" : ""}
                </p>
              </div>
              <p className="w-28 text-right">
                <span className="text-[17px] font-semibold">{formatMoney(Number(t.basePrice))}</span>
                <span className="text-[12.5px] text-slate"> / night</span>
              </p>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/admin/rooms/types/${t.id}`}>
                  <Pencil aria-hidden /> Edit
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-6" title={`Rooms (${rooms.length})`} description="Physical rooms and their beds" actions={<RoomDialog types={typeOpts} />} bodyClassName="p-0">
        <Table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Type</th>
              <th>Floor</th>
              <th>Beds</th>
              <th>Housekeeping</th>
              <th>Bookable</th>
              <th className="w-px" />
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => {
              const s = HK_STATUS[r.housekeepingStatus]!;
              return (
                <tr key={r.id}>
                  <td className="text-[16px] font-semibold">{r.number}</td>
                  <td>{pick(r.roomType.name, "en")}</td>
                  <td>{r.floor}</td>
                  <td>{r.roomType.kind === "DORM" ? r.beds.length : "Whole room"}</td>
                  <td>
                    <Badge tone={s.tone} dot>
                      {s.label}
                    </Badge>
                  </td>
                  <td>{r.isActive ? <Badge tone="tile">Yes</Badge> : <Badge>No</Badge>}</td>
                  <td>
                    <RoomDialog
                      types={typeOpts}
                      room={{ id: r.id, number: r.number, floor: r.floor, roomTypeId: r.roomTypeId, beds: r.beds.length, isActive: r.isActive }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>

      <Panel className="mt-6" title="Blocked dates" description="Maintenance, renovation or private use. Blocked rooms disappear from availability for those nights.">
        <BlockDatesForm rooms={rooms.map((r) => ({ id: r.id, number: r.number }))} today={toISODate(today)} />
        <div className="mt-5 border-t border-line-soft pt-2">
          {blocks.length ? (
            <ul className="divide-y divide-line-soft">
              {blocks.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-[14px]">
                  <span>
                    <span className="font-semibold">Room {b.room.number}</span> · {formatDate(b.startDate)} – {formatDate(b.endDate)}{" "}
                    <span className="text-slate">· {b.reason}</span>
                  </span>
                  <RemoveBlockButton id={b.id} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No upcoming blocked dates.</Empty>
          )}
        </div>
      </Panel>
    </>
  );
}
