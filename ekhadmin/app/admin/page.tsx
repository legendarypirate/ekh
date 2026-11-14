"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StaffPage } from "@/components/Shell";
import { api } from "@/lib/api";

type Clinic = { id: string; name: string; organization: string; ward: string; districtName: string; active: boolean };
type Account = { id: string; name: string; role: string; username: string; active: boolean };
type Log = { id: string; at?: string; actor?: string; action?: string };

export default function SuperAdminHome() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [patients, setPatients] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ clinics: Clinic[] }>("/api/clinics"),
      api<{ accounts: Account[] }>("/api/clinics/accounts"),
      api<{ logs: Log[] }>("/api/clinics/audit"),
      api<{ patients: unknown[] }>("/api/patients"),
    ])
      .then(([c, a, l, p]) => {
        setClinics(c.clinics);
        setAccounts(a.accounts);
        setLogs(l.logs.slice(0, 8));
        setPatients(p.patients.length);
      })
      .catch((e) => setError(e.message));
  }, []);

  const doctors = accounts.filter((a) => a.role === "district");

  return (
    <StaffPage crumb="Ерөнхий самбар">
      <div className="sa-head">
        <div>
          <div className="sa-eyebrow">SUPER ADMIN</div>
          <h1>Системийн ерөнхий самбар</h1>
          <p>Хорооны байгууллага, дүүргийн эмч, нэвтрэх эрх, үйлдлийн LOG-ийг эндээс удирдана.</p>
        </div>
        <Link className="sa-button prime" href="/admin/clinics">＋ Хороо нэмэх</Link>
      </div>
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="sa-metrics">
        <div className="sa-card sa-metric"><div className="sa-metric-icon">⌂</div><small>Хороо</small><strong>{clinics.length}</strong><p>{clinics.filter((c) => c.active).length} идэвхтэй</p></div>
        <div className="sa-card sa-metric"><div className="sa-metric-icon blue">♟</div><small>Дүүргийн эмч</small><strong>{doctors.length}</strong><p>Хариуцсан эмч нар</p></div>
        <div className="sa-card sa-metric"><div className="sa-metric-icon orange">◉</div><small>Эрх</small><strong>{accounts.length}</strong><p>Нийт нэвтрэх эрх</p></div>
        <div className="sa-card sa-metric"><div className="sa-metric-icon pink">♡</div><small>Эхчүүд</small><strong>{patients}</strong><p>Бүртгэлтэй эх</p></div>
      </div>
      <div className="sa-overview-columns">
        <section className="sa-card sa-pad">
          <div className="sa-sectiontitle"><h2>Хорооны хамрах хүрээ</h2><Link href="/admin/clinics">Бүгд</Link></div>
          {clinics.map((c) => (
            <div className="sa-coverage-row" key={c.id}>
              <div className="sa-ward">{c.ward}</div>
              <div className="sa-grow">
                <strong>{c.name}</strong>
                <small>{c.organization}</small>
              </div>
              <span className={`sa-status ${c.active ? "on" : "off"}`}><span className="sa-dot" />{c.active ? "Идэвхтэй" : "Идэвхгүй"}</span>
            </div>
          ))}
        </section>
        <section className="sa-card sa-pad">
          <div className="sa-sectiontitle"><h2>Сүүлийн үйлдлүүд</h2><Link href="/admin/audit">LOG</Link></div>
          {logs.map((l) => (
            <div className="sa-event" key={l.id}>
              <div className="sa-event-icon">✓</div>
              <div>
                <b>{l.action}</b>
                <small>{l.actor} · {String(l.at || "").slice(0, 16).replace("T", " ")}</small>
              </div>
            </div>
          ))}
        </section>
      </div>
    </StaffPage>
  );
}
