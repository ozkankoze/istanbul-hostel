"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/server/actions/admin/uploads";

/**
 * Manages one or several image URLs. Values are submitted as hidden inputs named `name`.
 * The first image is used as the cover.
 */
export function ImageField({ name, initial, multiple = false }: { name: string; initial: string[]; multiple?: boolean }) {
  const [images, setImages] = useState<string[]>(initial);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    start(async () => {
      for (const file of Array.from(files).slice(0, multiple ? 6 : 1)) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await uploadImage(fd);
        if (res.ok) setImages((prev) => (multiple ? [...prev, res.data.url] : [res.data.url]));
        else toast.error(res.error);
      }
      if (input.current) input.current.value = "";
    });
  }

  return (
    <div>
      {images.map((src) => (
        <input key={src} type="hidden" name={name} value={src} />
      ))}
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div key={src} className="group relative size-24 overflow-hidden rounded-md border border-line bg-limestone">
            <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            {multiple && i === 0 ? <span className="absolute left-1 top-1 rounded-sm bg-ink/80 px-1 text-[10px] text-paper">Cover</span> : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-ink/70 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              {multiple && i > 0 ? (
                <button type="button" aria-label="Use as cover" onClick={() => setImages((p) => [src, ...p.filter((x) => x !== src)])} className="rounded-sm bg-paper/90 p-1 text-ink cursor-pointer">
                  <Star aria-hidden className="size-3.5" />
                </button>
              ) : null}
              <button type="button" aria-label="Remove image" onClick={() => setImages((p) => p.filter((x) => x !== src))} className="rounded-sm bg-paper/90 p-1 text-tulip cursor-pointer">
                <Trash2 aria-hidden className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {multiple || images.length === 0 ? (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={pending}
            className={cn("flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line bg-paper text-[12px] text-slate hover:border-cobalt hover:text-cobalt cursor-pointer", pending && "opacity-60")}
          >
            <ImagePlus aria-hidden className="size-5" />
            {pending ? "Uploading…" : "Upload"}
          </button>
        ) : (
          <button type="button" onClick={() => input.current?.click()} disabled={pending} className="self-end text-[13px] font-medium text-cobalt cursor-pointer">
            {pending ? "Uploading…" : "Replace"}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} className="sr-only" onChange={(e) => onFiles(e.target.files)} tabIndex={-1} aria-hidden />
      <p className="mt-1.5 text-[12px] text-mist">JPEG, PNG, WebP or AVIF up to 5 MB.</p>
    </div>
  );
}
