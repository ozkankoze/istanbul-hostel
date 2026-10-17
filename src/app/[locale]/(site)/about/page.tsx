import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { href } from "@/lib/links";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: t.about.title, description: t.about.lead };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <>
      <div className="container-page grid gap-10 pb-16 pt-14 md:grid-cols-12 md:pb-24 md:pt-20">
        <div className="md:col-span-7">
          <p className="text-[14px] text-slate">{t.about.title}</p>
          <h1 className="mt-3 font-display text-[40px] leading-[1.06] md:text-[60px]">{t.about.lead}</h1>
        </div>
      </div>
      <div className="relative h-[52vh] min-h-[340px] w-full overflow-hidden">
        <Image src="/images/about-istanbul.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      </div>
      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-24">
        <h2 className="font-display text-[30px] md:col-span-4 md:text-[38px]">{t.about.storyTitle}</h2>
        <div className="space-y-5 text-[17px] leading-[1.8] text-ink-soft md:col-span-7 md:col-start-6">
          {t.about.story.map((p) => (
            <p key={p.slice(0, 20)}>{p}</p>
          ))}
        </div>
      </div>
      <div className="bg-paper py-16 md:py-24">
        <div className="container-page">
          <h2 className="font-display text-[30px] md:text-[38px]">{t.about.valuesTitle}</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {t.about.values.map((v) => (
              <div key={v.title} className="border-t border-line pt-6">
                <h3 className="text-[18px] font-semibold">{v.title}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-slate">{v.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {["/images/breakfast.jpg", "/images/kitchen.jpg", "/images/terrace.jpg"].map((src) => (
              <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-md">
                <Image src={src} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-8">
            <p className="text-[13px] text-mist">{t.about.teamNote}</p>
            <Button asChild size="lg">
              <Link href={href(locale, "/book")}>{t.common.bookYourStay}</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
