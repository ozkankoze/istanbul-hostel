"use client";

import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;
export const SheetTitle = D.Title;
export const SheetDescription = D.Description;

export function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof D.Content> & { side?: "right" | "left" | "bottom" }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <D.Content
        className={cn(
          "fixed z-50 flex flex-col bg-paper shadow-float focus:outline-none",
          side === "right" && "inset-y-0 right-0 w-[min(88vw,380px)] data-[state=open]:animate-[slide-in-right_260ms_cubic-bezier(.2,.7,.2,1)]",
          side === "left" && "inset-y-0 left-0 w-[min(88vw,300px)] data-[state=open]:animate-[slide-in-left_260ms_cubic-bezier(.2,.7,.2,1)]",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-xl data-[state=open]:animate-[slide-in-up_260ms_cubic-bezier(.2,.7,.2,1)]",
          className,
        )}
        {...props}
      >
        {children}
        <D.Close className="absolute right-4 top-4 rounded-md p-1.5 text-slate hover:bg-ink/5 hover:text-ink cursor-pointer">
          <X className="size-5" />
          <span className="sr-only">Close</span>
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}
