"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { createQr, deleteQr } from "@/server/actions/admin/qr";
import { ActionForm } from "./action-form";
import { ConfirmDelete } from "./confirm-delete";

export function NewQrButton() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus aria-hidden /> Extra code
      </Button>
      <DialogContent title="Extra QR code" description="Optional. For example a card on the breakfast table that opens the tours page.">
        <ActionForm action={createQr} success="QR code created" submitLabel="Create QR code" onSuccess={() => setOpen(false)}>
          <Field label="Label" htmlFor="q-label" hint="e.g. Breakfast table, Lobby poster">
            <Input id="q-label" name="label" required />
          </Field>
          <Field label="Opens" htmlFor="q-path" hint="A page on this site. /guest picks the guest's language automatically.">
            <Input id="q-path" name="path" defaultValue="/en/experiences" required />
          </Field>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteQr({ id, label }: { id: string; label: string }) {
  return <ConfirmDelete label={`QR code "${label}"`} action={() => deleteQr(id)} />;
}
