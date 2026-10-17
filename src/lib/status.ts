/** Labels and badge tones for statuses used across staff tools (English UI). */
type Tone = "neutral" | "cobalt" | "tile" | "tulip" | "saffron" | "dark" | "outline";

export const HK_STATUS: Record<string, { label: string; tone: Tone; dot: string }> = {
  CLEAN: { label: "Clean", tone: "tile", dot: "bg-tile" },
  DIRTY: { label: "Dirty", tone: "tulip", dot: "bg-tulip" },
  CLEANING: { label: "Cleaning in progress", tone: "saffron", dot: "bg-saffron" },
  INSPECTED: { label: "Inspected / Ready", tone: "cobalt", dot: "bg-cobalt" },
  MAINTENANCE: { label: "Maintenance required", tone: "dark", dot: "bg-ink" },
};

export const OCCUPANCY: Record<string, { label: string; tone: Tone }> = {
  VACANT: { label: "Vacant", tone: "outline" },
  OCCUPIED: { label: "Occupied", tone: "neutral" },
  PARTIAL: { label: "Partly occupied", tone: "neutral" },
  ARRIVING: { label: "Arrival today", tone: "cobalt" },
  DEPARTING: { label: "Departure today", tone: "saffron" },
  BLOCKED: { label: "Blocked", tone: "dark" },
};

export const RES_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "saffron" },
  CONFIRMED: { label: "Confirmed", tone: "tile" },
  DECLINED: { label: "Declined", tone: "tulip" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  COMPLETED: { label: "Completed", tone: "cobalt" },
};

export const TASK_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "To do", tone: "outline" },
  IN_PROGRESS: { label: "In progress", tone: "saffron" },
  DONE: { label: "Done", tone: "tile" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const PRIORITY: Record<string, { label: string; tone: Tone }> = {
  LOW: { label: "Low", tone: "neutral" },
  NORMAL: { label: "Normal", tone: "outline" },
  HIGH: { label: "High", tone: "saffron" },
  URGENT: { label: "Urgent", tone: "tulip" },
};

export const TASK_TYPE: Record<string, string> = {
  CLEANING: "Cleaning",
  INSPECTION: "Inspection",
  MAINTENANCE: "Maintenance",
  CUSTOM: "Other",
};

export const SR_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "New", tone: "saffron" },
  IN_PROGRESS: { label: "In progress", tone: "cobalt" },
  RESOLVED: { label: "Resolved", tone: "tile" },
};

export const SR_TYPE: Record<string, string> = {
  TOWELS: "Fresh towels",
  CLEANING: "Room cleaning",
  MAINTENANCE: "Something broken",
  AMENITIES: "Toiletries / extras",
  RECEPTION: "Call back",
  OTHER: "Other",
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  RECEPTION: "Reception",
  HOUSEKEEPING: "Housekeeping",
};
