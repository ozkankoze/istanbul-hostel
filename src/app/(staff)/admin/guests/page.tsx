import Link from "next/link";
import { Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { AdminHeader, Empty, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { propertyToday } from "@/lib/dates";
import { formatDate, formatMoney } from "@/lib/utils";
import { requirePermission } from "@/server/auth";

export const metadata = { title: "Guests" };

export default async function GuestsPage({ searchParams }: PageProps<"/admin/guests">) {
  await requirePermission("guests");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const today = propertyToday();
  const where: Prisma.GuestWhereInput = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};
  const guests = await db.guest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reservations: { orderBy: { checkIn: "desc" }, select: { checkIn: true, checkOut: true, status: true, totalPrice: true } } },
  });

  return (
    <>
      <AdminHeader title="Guests" description="Everyone who has requested or made a reservation. Guest details are personal data — share only what's needed." />
      <Panel bodyClassName="p-0">
        <form className="flex gap-2 border-b border-line-soft p-3" action="/admin/guests">
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
            <Input name="q" defaultValue={q} placeholder="Search by name, email or country" className="h-10 pl-9" aria-label="Search guests" />
          </div>
          <Button type="submit" variant="dark" className="h-10">
            Search
          </Button>
        </form>
        {guests.length ? (
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Country</th>
                <th>Stays</th>
                <th>Last stay</th>
                <th className="text-right">Total confirmed</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => {
                const confirmed = g.reservations.filter((r) => r.status === "CONFIRMED" || r.status === "COMPLETED");
                const last = g.reservations[0];
                const inHouse = g.reservations.some((r) => r.status === "CONFIRMED" && r.checkIn <= today && r.checkOut > today);
                return (
                  <tr key={g.id}>
                    <td>
                      <Link href={`/admin/guests/${g.id}`} className="font-medium text-cobalt hover:underline">
                        {g.firstName} {g.lastName}
                      </Link>
                      {inHouse ? <Badge tone="tile" className="ml-2">In house</Badge> : null}
                    </td>
                    <td className="text-[13px]">
                      <span className="block">{g.email}</span>
                      <span className="text-slate">{g.phone ?? "—"}</span>
                    </td>
                    <td>{g.country ?? "—"}</td>
                    <td>{g.reservations.length}</td>
                    <td>{last ? formatDate(last.checkIn) : "—"}</td>
                    <td className="text-right tabular-nums">{formatMoney(confirmed.reduce((n, r) => n + Number(r.totalPrice), 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <Empty>No guests found.</Empty>
        )}
      </Panel>
    </>
  );
}
