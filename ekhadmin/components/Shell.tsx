"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const ICONS: Record<string, string> = {
  home: "⌂",
  users: "♟",
  send: "➤",
  message: "✉",
  calendar: "▦",
  chart: "▧",
};

type Item = { href: string; label: string; icon: string; clinicOnly?: boolean; badge?: number };

export function StaffPage({ crumb, children }: { crumb: string; children: React.ReactNode }) {
  return <Shell crumb={crumb}>{children}</Shell>;
}

export default function Shell({ children, crumb }: { children: React.ReactNode; crumb: string }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const [badges, setBadges] = useState({ referrals: 0, transfers: 0, questions: 0 });

  useEffect(() => {
    if (!user || user.role === "superadmin") return;
    api<{ totals: { pendingReferrals: number; pendingTransfers: number; newQuestions: number } }>("/api/dashboard")
      .then((d) =>
        setBadges({
          referrals: d.totals.pendingReferrals || 0,
          transfers: d.totals.pendingTransfers || 0,
          questions: d.totals.newQuestions || 0,
        })
      )
      .catch(() => {});
  }, [user, pathname]);

  if (!ready || !user) {
    return (
      <div className="login-bg">
        <div className="login">
          <div className="kicker">ЭНХЭХ</div>
          <h1>Ачааллаж байна…</h1>
        </div>
      </div>
    );
  }

  const clinicItems: Item[] = [
    { href: "/dashboard", label: "Хяналтын самбар", icon: "home" },
    { href: "/patients", label: user.role === "clinic" ? "Эхийн бүртгэл" : "Ирүүлсэн эхчүүд", icon: "users" },
    { href: "/referrals", label: user.role === "clinic" ? "Дүүрэгт илгээсэн" : "Илгээсэн эхчүүд", icon: "send", badge: badges.referrals },
    { href: "/transfers", label: "Шилжилтийн хүсэлт", icon: "send", clinicOnly: true, badge: badges.transfers },
    { href: "/questions", label: "Эхийн асуултууд", icon: "message", clinicOnly: true, badge: badges.questions },
    { href: "/schedule", label: user.role === "clinic" ? "Хуваарь" : "Үзлэгийн календарь", icon: "calendar" },
    { href: "/reports", label: "Тайлан / LOG", icon: "chart" },
  ];

  const saItems: Item[] = [
    { href: "/admin", label: "Ерөнхий самбар", icon: "home" },
    { href: "/admin/clinics", label: "Хорооны байгууллага", icon: "users" },
    { href: "/admin/doctors", label: "Дүүргийн эмч нар", icon: "users" },
    { href: "/admin/accounts", label: "Нэвтрэх эрхүүд", icon: "users" },
    { href: "/admin/audit", label: "Үйлдлийн LOG", icon: "chart" },
  ];

  const items = (user.role === "superadmin" ? saItems : clinicItems).filter((i) => !i.clinicOnly || user.role === "clinic");
  const isSa = user.role === "superadmin";

  return (
    <div className={isSa ? "sa-shell" : "app"}>
      <aside className={isSa ? "sa-sidebar" : "side"}>
        <div className={isSa ? "sa-brand" : "brand"}>
          <span className={isSa ? "sa-logo" : "brand-mark"}>{isSa ? "♡" : "✚"}</span>
          <div>
            <strong>{isSa ? "ЭнхЭх." : user.role === "clinic" ? "Хорооны эмнэлэг" : "Дүүргийн эмнэлэг"}</strong>
            <small>{isSa ? "SUPER ADMIN" : "ЖИРЭМСНИЙ ХЯНАЛТ · WEB ADMIN"}</small>
          </div>
        </div>
        <div className={isSa ? "sa-navlabel" : "navtitle"}>{isSa ? "УДИРДЛАГЫН ЦЭС" : user.role === "clinic" ? "ХОРООНЫ ХЯНАЛТ" : "ДҮҮРГИЙН ХЯНАЛТ"}</div>
        <nav className={isSa ? "sa-nav" : "nav"}>
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={active ? (isSa ? "selected" : "active") : ""}>
                <span>{ICONS[item.icon]}</span> {item.label}
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className={isSa ? "sa-sidefoot" : "sidefoot"}>
          <div className={isSa ? "sa-identity" : "side-clinic"}>
            {isSa ? <div className="sa-identity-avatar">SA</div> : null}
            <div>
              <b>{user.name}</b>
              <small>{user.role === "district" ? `Хариуцсан хороо: ${(user.clinicIds || []).length}` : user.clinic || user.username}</small>
            </div>
          </div>
          <button type="button" className={isSa ? "sa-logout" : "exit"} onClick={logout}>
            Гарах
          </button>
        </div>
      </aside>
      <div className={isSa ? "sa-workspace" : "workspace"}>
        <header className={isSa ? "sa-top" : "top"}>
          <div className={isSa ? undefined : "crumb"}>
            {isSa ? (
              <>
                ЭнхЭх <span> / </span> Удирдлага <span> / </span> {crumb}
              </>
            ) : (
              <>
                Жирэмсний хяналтын систем / <b>{crumb}</b>
              </>
            )}
          </div>
          <div className={isSa ? "sa-topright" : "top-right"}>
            <span className={isSa ? "sa-super-chip" : "rolechip"}>
              {user.role === "clinic" ? "Хорооны эмч" : user.role === "district" ? "Дүүргийн эмч" : "Super Admin"}
            </span>
            <span className={isSa ? "sa-top-avatar" : "avatar"}>{user.role === "clinic" ? "Х" : user.role === "district" ? "Д" : "SA"}</span>
          </div>
        </header>
        <main className={isSa ? "sa-content" : "content"}>
          {children}
          <div className={isSa ? "sa-footer" : "footer"}>ЭнхЭх · Next.js admin · API холболт · Demo</div>
        </main>
      </div>
    </div>
  );
}
