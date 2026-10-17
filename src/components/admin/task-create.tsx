"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createTask } from "@/server/actions/housekeeping";
import { ActionForm } from "./action-form";

export function NewTaskButton({ rooms, staff }: { rooms: { id: string; number: string }[]; staff: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden /> New task
      </Button>
      <DialogContent title="New task" description="Assign cleaning, inspections, repairs or anything else to the team.">
        <ActionForm
          action={async (_: unknown, fd: FormData) => createTask(Object.fromEntries(fd))}
          success="Task created"
          submitLabel="Create task"
          onSuccess={() => setOpen(false)}
        >
          <Field label="Title" htmlFor="t-title">
            <Input id="t-title" name="title" required placeholder="e.g. Deep clean dorm 102" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" htmlFor="t-type">
              <Select id="t-type" name="type" defaultValue="CLEANING">
                <option value="CLEANING">Cleaning</option>
                <option value="INSPECTION">Inspection</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="CUSTOM">Other</option>
              </Select>
            </Field>
            <Field label="Priority" htmlFor="t-priority">
              <Select id="t-priority" name="priority" defaultValue="NORMAL">
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room" htmlFor="t-room">
              <Select id="t-room" name="roomId" defaultValue="">
                <option value="">No specific room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.number}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Assign to" htmlFor="t-assignee">
              <Select id="t-assignee" name="assignedToId" defaultValue="">
                <option value="">Unassigned</option>
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Due" htmlFor="t-due" hint="Istanbul time">
            <Input id="t-due" name="dueAt" type="datetime-local" />
          </Field>
          <Field label="Details" htmlFor="t-desc">
            <Textarea id="t-desc" name="description" rows={3} />
          </Field>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
