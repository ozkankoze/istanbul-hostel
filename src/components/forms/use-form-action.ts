"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/server/actions/types";

/** Small helper for client forms backed by server actions. */
export function useFormAction<T>() {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<T | null>(null);

  function run(fn: () => Promise<ActionResult<T>>, onOk?: (data: T) => void, onError?: (error: string) => void) {
    start(async () => {
      try {
        const res = await fn();
        if (res.ok) {
          setErrors({});
          setFormError(null);
          setResult(res.data);
          onOk?.(res.data);
        } else {
          setErrors(res.fieldErrors ?? {});
          setFormError(res.error);
          onError?.(res.error);
        }
      } catch {
        setFormError("Something went wrong. Please try again.");
      }
    });
  }

  return { pending, errors, formError, result, setResult, run, setErrors };
}
