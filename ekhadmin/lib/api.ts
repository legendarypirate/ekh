export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "enkhekh_staff_token";

export type StaffUser = {
  id: string;
  username?: string;
  role: "clinic" | "district" | "superadmin";
  name: string;
  clinicId?: string | null;
  clinic?: string | null;
  districtId?: string | null;
  clinicIds?: string[];
};

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || "Алдаа гарлаа.");
  return data as T;
}

export function pretty(d?: string | null) {
  if (!d) return "Товлоогүй";
  const x = new Date(`${String(d).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(x.getTime())) return d;
  return `${x.getFullYear()} оны ${x.getMonth() + 1}-р сарын ${x.getDate()}`;
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function shiftIso(ymd: string, n: number) {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000);
}

export function refStatus(r: { status?: string; dueDate?: string }) {
  if (r.status === "completed") return "completed";
  if (r.status === "closed") return "closed";
  if (r.dueDate && r.dueDate < todayIso()) return "overdue";
  return r.status || "pending";
}

export function statusLabel(s: string) {
  return (
    {
      overdue: "Хугацаа хэтэрсэн",
      completed: "Дүүрэгт үзүүлсэн",
      closed: "Хяналт хаагдсан",
      pending: "Хүлээгдэж байна",
    }[s] || s
  );
}

export function tagClass(s: string) {
  if (s === "overdue") return "overdue";
  if (s === "completed") return "done";
  if (s === "pending") return "pending";
  return "neutral";
}

export type Patient = {
  id: string;
  code: string;
  name: string;
  phone?: string;
  clinic?: string;
  clinicId?: string;
  lmp?: string;
  gender?: string;
  doctor?: string;
  gestation?: { label?: string; week?: number };
  referrals?: Array<{ id: string; status: string; dueDate: string; createdOn?: string; reason?: string; followups?: unknown[] }>;
  appointments?: Array<{ id: string; date: string; time?: string; title: string; place?: string; status?: string }>;
  visits?: Array<Record<string, unknown>>;
  questions?: Array<Record<string, unknown>>;
  medications?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};
