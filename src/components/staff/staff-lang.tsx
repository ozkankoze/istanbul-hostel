"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { setStaffLang } from "@/server/actions/staff-lang";
import { STAFF_TEXT, type StaffLang } from "./staff-text";

const Ctx = createContext<StaffLang>("en");

export function StaffLangProvider({ lang, children }: { lang: StaffLang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

/** Staff copy for the current language. Outside the staff app (e.g. admin) this is English. */
export function useStaffText() {
  const lang = useContext(Ctx);
  return { lang, t: STAFF_TEXT[lang] };
}

export function StaffLangSwitch({ lang }: { lang: StaffLang }) {
  const router = useRouter();
  async function choose(l: StaffLang) {
    if (l === lang) return;
    await setStaffLang(l);
    router.refresh();
  }
  return (
    <div role="group" aria-label={STAFF_TEXT[lang].language} className="flex rounded-md bg-white/15 p-0.5 text-[11.5px] font-semibold">
      {(["en", "sr"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => choose(l)}
          className={cn("rounded px-1.5 py-1 uppercase", lang === l ? "bg-paper text-cobalt" : "text-paper/80 hover:text-paper")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
