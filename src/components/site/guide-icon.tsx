import {
  CarTaxiFront,
  ChefHat,
  ConciergeBell,
  CreditCard,
  Info,
  KeyRound,
  Laptop,
  Lock,
  Plane,
  Recycle,
  Ship,
  Sofa,
  Sunset,
  TrainFront,
  TramFront,
  Users,
  WashingMachine,
  Wine,
  type LucideIcon,
} from "lucide-react";

/** Icons admins can pick for guide items. */
export const guideIcons: Record<string, LucideIcon> = {
  "chef-hat": ChefHat,
  "washing-machine": WashingMachine,
  sofa: Sofa,
  lock: Lock,
  "concierge-bell": ConciergeBell,
  sunset: Sunset,
  laptop: Laptop,
  users: Users,
  wine: Wine,
  "key-round": KeyRound,
  recycle: Recycle,
  "credit-card": CreditCard,
  "tram-front": TramFront,
  "train-front": TrainFront,
  ship: Ship,
  plane: Plane,
  "car-taxi-front": CarTaxiFront,
  info: Info,
};

export function GuideIcon({ name, className }: { name: string; className?: string }) {
  const Icon = guideIcons[name] ?? Info;
  return <Icon aria-hidden className={className} strokeWidth={1.6} />;
}
