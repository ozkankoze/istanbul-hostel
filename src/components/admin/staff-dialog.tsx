"use client";

import { useState } from "react";
import { Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { saveStaff } from "@/server/actions/admin/people";
import { ActionForm } from "./action-form";
import { Toggle } from "./toggle";

type Staff = { id: string; name: string; email: string; role: string; phone: string | null; isActive: boolean };

export function StaffDialog({ user }: { user?: Staff }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {user ? (
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
          <Pencil aria-hidden /> Edit
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <UserPlus aria-hidden /> Add team member
        </Button>
      )}
      <DialogContent title={user ? `Edit ${user.name}` : "Add team member"} description="Roles decide which parts of the dashboard each person can open.">
        <ActionForm action={saveStaff} success={user ? "Account updated" : "Account created"} onSuccess={() => setOpen(false)}>
          {user ? <input type="hidden" name="id" value={user.id} /> : null}
          <Field label="Full name" htmlFor="s-name">
            <Input id="s-name" name="name" defaultValue={user?.name} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email (sign-in)" htmlFor="s-email">
              <Input id="s-email" name="email" type="email" defaultValue={user?.email} required autoComplete="off" />
            </Field>
            <Field label="Phone" htmlFor="s-phone">
              <Input id="s-phone" name="phone" defaultValue={user?.phone ?? ""} />
            </Field>
          </div>
          <Field label="Role" htmlFor="s-role" hint="Admin: everything · Manager: all but staff & settings · Reception: bookings, guests, tours, guide · Housekeeping: cleaning app only">
            <Select id="s-role" name="role" defaultValue={user?.role ?? "HOUSEKEEPING"}>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Manager</option>
              <option value="RECEPTION">Reception</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
            </Select>
          </Field>
          <Field label={user ? "New password (leave empty to keep)" : "Password"} htmlFor="s-pw" hint="At least 10 characters with a letter and a number.">
            <Input id="s-pw" name="password" type="password" autoComplete="new-password" required={!user} minLength={10} />
          </Field>
          <Toggle name="isActive" defaultChecked={user?.isActive ?? true} label="Active" description="Inactive accounts can't sign in and are signed out everywhere." />
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
