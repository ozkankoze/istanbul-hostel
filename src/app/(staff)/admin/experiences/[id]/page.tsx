import { notFound } from "next/navigation";
import { ExperienceAdminForm } from "@/components/admin/experience-form";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { pick } from "@/i18n/config";
import { requirePermission } from "@/server/auth";

export default async function ExperienceEdit({ params }: PageProps<"/admin/experiences/[id]">) {
  await requirePermission("experiences");
  const { id } = await params;
  const e = id === "new" ? null : await db.experience.findUnique({ where: { id } });
  if (id !== "new" && !e) notFound();
  return (
    <>
      <AdminHeader back={{ href: "/admin/experiences", label: "Tours & Activities" }} title={e ? pick(e.title, "en") : "New experience"} />
      <Panel>
        <ExperienceAdminForm
          exp={
            e
              ? {
                  id: e.id,
                  title: e.title,
                  summary: e.summary,
                  description: e.description,
                  meetingPoint: e.meetingPoint,
                  durationMinutes: e.durationMinutes,
                  price: Number(e.price),
                  priceUnit: e.priceUnit,
                  startTime: e.startTime,
                  maxParticipants: e.maxParticipants,
                  availableDays: e.availableDays,
                  image: e.image,
                  isActive: e.isActive,
                  isTransfer: e.isTransfer,
                }
              : {
                  title: {},
                  summary: {},
                  description: {},
                  meetingPoint: {},
                  durationMinutes: 120,
                  price: 25,
                  priceUnit: "PERSON",
                  startTime: "10:00",
                  maxParticipants: 12,
                  availableDays: [1, 3, 5],
                  image: "",
                  isActive: true,
                  isTransfer: false,
                }
          }
        />
      </Panel>
    </>
  );
}
