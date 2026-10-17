import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { PageHeader } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { mapsUrl, telUrl, whatsappUrl } from "@/lib/links";
import { getProperty } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: t.contact.title, description: t.contact.intro };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const p = await getProperty();

  const rows = [
    { icon: MapPin, label: t.contact.address, value: `${p.addressLine}, ${p.city}, ${p.country}`, href: mapsUrl(p.mapQuery), external: true },
    { icon: Phone, label: t.contact.phone, value: p.phone, href: telUrl(p.phone) },
    { icon: MessageCircle, label: t.contact.whatsapp, value: p.whatsapp, href: whatsappUrl(p.whatsapp), external: true },
    { icon: Mail, label: t.contact.emailLabel, value: p.email, href: `mailto:${p.email}` },
    { icon: Clock, label: t.contact.reception, value: t.contact.receptionHours },
  ];

  return (
    <>
      <PageHeader title={t.contact.title} intro={t.contact.intro} />
      <div className="container-page grid gap-14 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <dl className="divide-y divide-line border-y border-line">
            {rows.map((r) => (
              <div key={r.label} className="flex gap-4 py-5">
                <r.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-cobalt" strokeWidth={1.6} />
                <div>
                  <dt className="text-[12.5px] text-slate">{r.label}</dt>
                  <dd className="mt-0.5 text-[16px]">
                    {r.href ? (
                      <a
                        href={r.href}
                        {...(r.external ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="hover:text-cobalt"
                      >
                        {r.value}
                      </a>
                    ) : (
                      r.value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          {p.isDemo ? (
            <p className="mt-5 flex items-start gap-2 text-[13px] text-slate">
              <Badge tone="saffron">{t.common.demoLabel}</Badge>
              <span>{t.contact.demoContact}</span>
            </p>
          ) : null}
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <h2 className="font-display text-[30px]">{t.contact.formTitle}</h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </div>
    </>
  );
}
