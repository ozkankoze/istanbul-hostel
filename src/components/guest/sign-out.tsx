"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { signOutGuest } from "@/server/actions/guest";

export function GuestSignOut({ label }: { label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="link"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await signOutGuest();
          router.refresh();
        })
      }
    >
      {label}
    </Button>
  );
}
