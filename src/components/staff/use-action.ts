"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/server/actions/types";

/** Run a server action, toast the outcome and refresh server data. */
export function useStaffAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  function run<T>(fn: () => Promise<ActionResult<T>>, success?: string, after?: (data: T) => void) {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        if (success) toast.success(success);
        after?.(res.data);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }
  return { pending, run };
}
