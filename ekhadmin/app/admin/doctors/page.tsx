"use client";

import { FormEvent, useEffect, useState } from "react";
import { StaffPage } from "@/components/Shell";
import { api } from "@/lib/api";

type Clinic = { id: string; name: string; ward: string; districtId: string; active: boolean };
type Account = { id: string; name: string; username: string; role: string; districtId?: string; clinicIds?: string[]; active: boolean };

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Account[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [a, c] = await Promise.all([
      api<{ accounts: Account[] }>("/api/clinics/accounts"),
      api<{ clinics: Clinic[] }>("/api/clinics"),
    ]);
    setDoctors(a.accounts.filter((x) => x.role === "district"));
    setClinics(c.clinics);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const clinicIds = f.getAll("clinicIds").map(String);
    await api("/api/clinics/accounts", {
      method: "POST",
      body: JSON.stringify({
        username: f.get("username"),
        name: f.get("name"),
        password: f.get("password"),
        districtId: f.get("districtId"),
        clinicIds,
      }),
    });
    setOpen(false);
    await load();
  }

  return (
    <StaffPage crumb="Дүүргийн эмч нар">
      <div className="sa-head">
        <div>
          <div className="sa-eyebrow">ДҮҮРГИЙН ЭМЧ</div>
          <h1>Дүүргийн эмч нар</h1>
          <p>Эмч бүрт хариуцах хороог оноож, нэвтрэх эрх үүсгэнэ.</p>
        </div>
        <button className="sa-button prime" type="button" onClick={() => setOpen(true)}>＋ Эмч нэмэх</button>
      </div>
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="sa-doctor-grid">
        {doctors.map((d) => (
          <article className="sa-card sa-doctor" key={d.id}>
            <div className="sa-doc-top">
              <div className="sa-doc-avatar">{d.name.slice(0, 1)}</div>
              <span className={`sa-status ${d.active ? "on" : "off"}`}>{d.active ? "Идэвхтэй" : "Идэвхгүй"}</span>
            </div>
            <h2>{d.name}</h2>
            <p><code>{d.username}</code> · {d.districtId}</p>
            <div className="sa-doc-label">ХАРИУЦСАН ХОРОО</div>
            <div className="sa-ward-chips">
              {(d.clinicIds || []).map((id) => {
                const c = clinics.find((x) => x.id === id);
                return <span key={id}>{c?.name || id}</span>;
              })}
            </div>
          </article>
        ))}
      </div>
      {open ? (
        <div className="sa-overlay" onClick={() => setOpen(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-head">
              <div><h2>Шинэ дүүргийн эмч</h2><p>Хамгийн багадаа нэг хороо онооно.</p></div>
              <button className="sa-x" type="button" onClick={() => setOpen(false)}>✕</button>
            </div>
            <form className="sa-modal-body" onSubmit={create}>
              <div className="sa-form-grid">
                <div className="sa-field"><label>Нэр</label><input name="name" required /></div>
                <div className="sa-field"><label>Нэвтрэх нэр</label><input name="username" required /></div>
                <div className="sa-field"><label>Дүүргийн код</label><input name="districtId" defaultValue="SBD" required /></div>
                <div className="sa-field"><label>Нууц үг</label><input type="password" name="password" minLength={8} required /></div>
              </div>
              <div className="sa-choose-title">Хороо оноох</div>
              <div className="sa-assign-grid">
                {clinics.filter((c) => c.active).map((c) => (
                  <label className="sa-select-ward" key={c.id}>
                    <input type="checkbox" name="clinicIds" value={c.id} />
                    <div><strong>{c.name}</strong><small>{c.id}</small></div>
                  </label>
                ))}
              </div>
              <div className="sa-formfoot">
                <button className="sa-button" type="button" onClick={() => setOpen(false)}>Болих</button>
                <button className="sa-button prime" type="submit">Хадгалах</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </StaffPage>
  );
}
