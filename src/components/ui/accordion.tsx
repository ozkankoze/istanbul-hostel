"use client";

import { Accordion as A } from "radix-ui";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = A.Root;

export function AccordionItem({ className, ...props }: React.ComponentProps<typeof A.Item>) {
  return <A.Item className={cn("border-b border-line", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof A.Trigger>) {
  return (
    <A.Header className="flex">
      <A.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-6 py-5 text-left text-[17px] font-medium text-ink transition-colors hover:text-cobalt cursor-pointer",
          className,
        )}
        {...props}
      >
        {children}
        <Plus className="size-4 shrink-0 text-slate transition-transform duration-200 group-data-[state=open]:rotate-45" />
      </A.Trigger>
    </A.Header>
  );
}

export function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof A.Content>) {
  return (
    <A.Content
      className="overflow-hidden data-[state=closed]:animate-[collapse_200ms_ease-out] data-[state=open]:animate-[expand_220ms_ease-out]"
      {...props}
    >
      <div className={cn("pb-5 pr-10 text-[15px] leading-relaxed text-slate", className)}>{children}</div>
    </A.Content>
  );
}
