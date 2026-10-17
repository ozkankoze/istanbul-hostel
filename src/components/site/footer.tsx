import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getDictionary } from "@/i18n";
import { pick, type Locale } from "@/i18n/config";
import { href, mapsUrl, telUrl, whatsappUrl } from "@/lib/links";
import { getProperty } from "@/server/queries";

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const p = await getProperty();
  const year = new Date().getFullYear();

  const cols = [
    {
      title: t.footer.stay,
      links: [
        { label: t.nav.rooms, path: "/rooms" },
        { label: t.common.bookYourStay, path: "/book" },
        { label: t.nav.experiences, path: "/experiences" },
        { label: t.nav.guestGuide, path: "/guest" },
      ],
    },
    {
      title: t.footer.hostel,
      links: [
        { label: t.nav.about, path: "/about" },
        { label: t.nav.explore, path: "/explore" },
        { label: t.nav.contact, path: "/contact" },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: t.nav.privacy, path: "/privacy" },
        { label: t.nav.terms, path: "/terms" },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-ink text-paper/75">
      <div className="container-page grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed">{pick(p.tagline, locale) || t.footer.tagline}</p>
          <ul className="mt-6 space-y-2.5 text-[14px]">
            <li>
              <a href={mapsUrl(p.mapQuery)} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2.5 hover:text-paper">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-paper/45" />
                {p.addressLine}, {p.city}
              </a>
            </li>
            <li>
              <a href={telUrl(p.phone)} className="inline-flex items-center gap-2.5 hover:text-paper">
                <Phone aria-hidden className="size-4 text-paper/45" />
                {p.phone}
              </a>
            </li>
            <li>
              <a href={whatsappUrl(p.whatsapp)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 hover:text-paper">
                <MessageCircle aria-hidden className="size-4 text-paper/45" />
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${p.email}`} className="inline-flex items-center gap-2.5 hover:text-paper">
                <Mail aria-hidden className="size-4 text-paper/45" />
                {p.email}
              </a>
            </li>
          </ul>
        </div>
        {cols.map((c) => (
          <div key={c.title} className="md:col-span-2 md:col-start-auto">
            <h2 className="text-[13px] font-semibold text-paper">{c.title}</h2>
            <ul className="mt-4 space-y-2.5 text-[14.5px]">
              {c.links.map((l) => (
                <li key={l.path}>
                  <Link href={href(locale, l.path)} className="hover:text-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="md:col-span-2">
          <h2 className="text-[13px] font-semibold text-paper">{t.contact.reception}</h2>
          <p className="mt-4 text-[14.5px]">{t.contact.receptionHours}</p>
          <Link href="/login" className="mt-6 inline-block text-[13px] text-paper/45 hover:text-paper">
            {t.nav.staffLogin}
          </Link>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="container-page flex flex-col gap-2 py-6 text-[12.5px] text-paper/45 sm:flex-row sm:justify-between">
          <p>© {year} Istanbul Hostel. {t.footer.rights}</p>
          <p>{t.footer.madeBy} · {t.common.demoLabel}</p>
        </div>
      </div>
    </footer>
  );
}
