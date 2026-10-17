import { Info } from "lucide-react";

export function DemoBanner({ text }: { text: string }) {
  return (
    <div className="bg-ink text-paper/80">
      <p className="container-page flex items-center justify-center gap-2 py-2 text-center text-[12.5px] leading-snug">
        <Info aria-hidden className="size-3.5 shrink-0 text-paper/50" />
        {text}
      </p>
    </div>
  );
}
