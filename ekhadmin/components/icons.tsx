"use client";

import type { LucideIcon, LucideProps } from "lucide-react";
import {
  ArrowLeftRight,
  CalendarDays,
  CircleCheck,
  ClipboardCheck,
  ClipboardPlus,
  Clock3,
  FileChartColumn,
  HeartPulse,
  Hospital,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircleQuestionMark,
  Send,
  Smartphone,
  Stethoscope,
  TriangleExclamationPoint,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";

export const ICON = {
  stroke: 1.85,
  menu: 20,
  card: 22,
} as const;

export const NAV_ICONS = {
  dashboard: LayoutDashboard,
  patients: UserRoundPlus,
  patientsIncoming: UsersRound,
  referrals: Send,
  transfers: ArrowLeftRight,
  questions: MessageCircleQuestionMark,
  schedule: CalendarDays,
  reports: FileChartColumn,
  clinics: Hospital,
  doctors: Stethoscope,
  accounts: KeyRound,
  audit: FileChartColumn,
  logout: LogOut,
  brand: HeartPulse,
} satisfies Record<string, LucideIcon>;

export const STAT_ICONS = {
  registered: UsersRound,
  waiting: Clock3,
  overdue: TriangleExclamationPoint,
  completed: ClipboardCheck,
} satisfies Record<string, LucideIcon>;

export const FLOW_ICONS = {
  register: ClipboardPlus,
  visit: Stethoscope,
  confirm: CircleCheck,
  app: Smartphone,
} satisfies Record<string, LucideIcon>;

export function MenuIcon({ icon: Icon, ...props }: { icon: LucideIcon } & LucideProps) {
  return <Icon size={ICON.menu} strokeWidth={ICON.stroke} nonScalingStroke aria-hidden {...props} />;
}

export function CardIcon({ icon: Icon, ...props }: { icon: LucideIcon } & LucideProps) {
  return <Icon size={ICON.card} strokeWidth={ICON.stroke} nonScalingStroke aria-hidden {...props} />;
}
