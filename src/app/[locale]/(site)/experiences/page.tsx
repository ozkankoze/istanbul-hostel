import { notFound } from "next/navigation";
import { ExperienceCard } from "@/components/site/experience-card";
import { PageHeader } from "@/components/site/section";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getExperiences } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/experiences">) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { title: t.experiences.title, description: t.experiences.intro };
}

export default async function ExperiencesPage({ params }: PageProps<"/[locale]/experiences">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const experiences = await getExperiences();

  return (
    <>
      <PageHeader title={t.experiences.title} intro={t.experiences.intro}>
        <p className="mt-4 text-[13px] text-mist">{t.experiences.demoNote}</p>
      </PageHeader>
      <div className="container-page grid gap-x-8 gap-y-14 py-14 sm:grid-cols-2 lg:grid-cols-3 md:py-20">
        {experiences.map((e) => (
          <ExperienceCard key={e.id} exp={e} locale={locale} t={t} />
        ))}
      </div>
    </>
  );
}
