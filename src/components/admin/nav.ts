import {
  BedDouble,
  ClipboardList,
  LayoutDashboard,
  BookOpenText,
  CalendarCheck,
  PanelsTopLeft,
  QrCode,
  Settings,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import type { Permission } from "@/server/auth";

export const ADMIN_NAV: { href: string; label: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, permission: "overview" },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarCheck, permission: "reservations" },
  { href: "/admin/rooms", label: "Rooms & Beds", icon: BedDouble, permission: "rooms" },
  { href: "/admin/guests", label: "Guests", icon: Users, permission: "guests" },
  { href: "/admin/housekeeping", label: "Housekeeping", icon: Sparkles, permission: "housekeeping" },
  { href: "/admin/tasks", label: "Staff & Tasks", icon: ClipboardList, permission: "tasks" },
  { href: "/admin/experiences", label: "Tours & Activities", icon: Ticket, permission: "experiences" },
  { href: "/admin/guide", label: "Guest Guide", icon: BookOpenText, permission: "guide" },
  { href: "/admin/qr", label: "QR Code", icon: QrCode, permission: "qr" },
  { href: "/admin/content", label: "Website Content", icon: PanelsTopLeft, permission: "content" },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings" },
];
