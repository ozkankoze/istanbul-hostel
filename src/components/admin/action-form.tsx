"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/actions/types";

type FormAction<T> = (prev: unknown, fd: FormData) => Promise<ActionResult<T>>;

/** A form bound to a server action with toast feedback and inline errors. */
export function ActionForm<T>({
  action,
  children,
  submitLabel = "Save changes",
  success = "Saved",
  onSuccess,
  className,
  footer,
  resetOnSuccess,
}: {
  action: FormAction<T>;
  children: React.ReactNode;
  submitLabel?: string;
  success?: string | ((data: T) => string);
  onSuccess?: (data: T) => void;
  className?: string;
  footer?: React.ReactNode;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const handled = useRef<unknown>(null);

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    if (state.ok) {
      const data = state.data as T & { warning?: string | null };
      toast.success(typeof success === "function" ? success(state.data) : success);
      if (data && typeof data === "object" && data.warning) toast.warning(data.warning);
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state.data);
      router.refresh();
    }
  }, [state, success, onSuccess, router, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className ?? "space-y-4"}>
      {children}
      {state && !state.ok ? (
        <p role="alert" className="rounded-md bg-tulip-soft px-3 py-2 text-[14px] text-tulip">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        {footer}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
