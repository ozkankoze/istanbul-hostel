import { DeleteFaq, DeleteTestimonial, FaqDialog, HandledButton, HeroForm, TestimonialDialog } from "@/components/admin/content-forms";
import { AdminHeader, Empty, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { pick, type LocalizedText } from "@/i18n/config";
import { cn, formatDateTime } from "@/lib/utils";
import { requirePermission } from "@/server/auth";
import { getContentBlock, getProperty } from "@/server/queries";

export const metadata = { title: "Website Content" };

export default async function ContentAdmin() {
  await requirePermission("content");
  const property = await getProperty();
  const [hero, faqs, testimonials, messages] = await Promise.all([
    getContentBlock<{ title?: LocalizedText; subtitle?: LocalizedText; image?: string }>("home.hero"),
    db.faq.findMany({ where: { propertyId: property.id }, orderBy: { sortOrder: "asc" } }),
    db.testimonial.findMany({ where: { propertyId: property.id }, orderBy: { sortOrder: "asc" } }),
    db.contactMessage.findMany({ where: { propertyId: property.id }, orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 50 }),
  ]);

  return (
    <>
      <AdminHeader title="Website Content" description="Homepage text, frequently asked questions, reviews and messages from the contact form. Room text and photos are edited under Rooms & Beds." />
      <Panel title="Homepage hero">
        <HeroForm hero={{ title: hero?.title ?? {}, subtitle: hero?.subtitle ?? {}, image: hero?.image ?? "/images/hero-istanbul.jpg" }} />
      </Panel>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Frequently asked questions" actions={<FaqDialog />} bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {faqs.map((f) => (
              <li key={f.id} className={cn("flex items-start gap-2 px-4 py-3", !f.isActive && "opacity-50")}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{pick(f.question, "en")}</p>
                  <p className="line-clamp-2 text-[12.5px] text-slate">{pick(f.answer, "en")}</p>
                </div>
                <FaqDialog faq={{ id: f.id, question: f.question, answer: f.answer, sortOrder: f.sortOrder, isActive: f.isActive }} />
                <DeleteFaq id={f.id} />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Guest reviews" actions={<TestimonialDialog />} bodyClassName="p-0">
          <ul className="divide-y divide-line-soft">
            {testimonials.map((t) => (
              <li key={t.id} className={cn("flex items-start gap-2 px-4 py-3", !t.isActive && "opacity-50")}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] italic">“{pick(t.quote, "en")}”</p>
                  <p className="mt-1 text-[12.5px] text-slate">
                    {t.name} · {t.origin} {t.isSample ? <Badge tone="saffron">sample</Badge> : <Badge tone="tile">verified</Badge>}
                  </p>
                </div>
                <TestimonialDialog t={{ id: t.id, name: t.name, origin: t.origin, quote: t.quote, isSample: t.isSample, isActive: t.isActive, sortOrder: t.sortOrder }} />
                <DeleteTestimonial id={t.id} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel className="mt-6" title="Contact form messages" bodyClassName="p-0">
        {messages.length ? (
          <ul className="divide-y divide-line-soft">
            {messages.map((m) => (
              <li key={m.id} className={cn("flex flex-wrap items-start gap-4 px-5 py-4", m.handled && "opacity-60")}>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium">
                    {m.subject} {!m.handled ? <Badge tone="saffron">new</Badge> : null}
                  </p>
                  <p className="text-[13px] text-slate">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-cobalt hover:underline">
                      {m.email}
                    </a>{" "}
                    · {formatDateTime(m.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-[14px]">{m.message}</p>
                </div>
                <HandledButton id={m.id} handled={m.handled} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No messages yet.</Empty>
        )}
      </Panel>
    </>
  );
}
