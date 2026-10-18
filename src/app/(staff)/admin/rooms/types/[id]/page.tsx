import { notFound } from "next/navigation";
import { RoomTypeForm } from "@/components/admin/room-type-form";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { pick } from "@/i18n/config";
import { requirePermission } from "@/server/auth";

export default async function RoomTypeEdit({ params }: PageProps<"/admin/rooms/types/[id]">) {
  await requirePermission("rooms");
  const { id } = await params;
  const t =
    id === "new"
      ? null
      : await db.roomType.findUnique({ where: { id } });
  if (id !== "new" && !t) notFound();

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/rooms", label: "Rooms & Beds" }}
        title={t ? pick(t.name, "en") : "New room type"}
        description="Text is shown on the public website in English and Bosnian. Untranslated fields fall back to English."
      />
      <Panel>
        <RoomTypeForm
          type={
            t
              ? {
                  id: t.id,
                  name: t.name,
                  summary: t.summary,
                  description: t.description,
                  bedSummary: t.bedSummary,
                  basePrice: Number(t.basePrice),
                  capacity: t.capacity,
                  sizeSqm: t.sizeSqm,
                  amenities: t.amenities,
                  images: t.images,
                  isActive: t.isActive,
                  kind: t.kind,
                  genderPolicy: t.genderPolicy,
                }
              : {
                  name: {},
                  summary: {},
                  description: {},
                  bedSummary: {},
                  basePrice: 30,
                  capacity: 2,
                  sizeSqm: null,
                  amenities: ["wifi", "towels"],
                  images: [],
                  isActive: true,
                  kind: "PRIVATE",
                  genderPolicy: "MIXED",
                }
          }
        />
      </Panel>
    </>
  );
}
