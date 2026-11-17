"use client";

import { FormEvent, useEffect, useState } from "react";
import { MenuIcon, NAV_ICONS } from "@/components/icons";
import { StaffPage } from "@/components/Shell";
import { api } from "@/lib/api";

type Clinic = { id: string; name: string; organization: string; ward: string; districtName: string; districtId: string; active: boolean };

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Clinic | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api<{ clinics: Clinic[] }>("/api/clinics");
    setClinics(data.clinics);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await api("/api/clinics", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v)]))),
    });
    setOpen(false);
    await load();
  }

  async function toggle(c: Clinic) {
    await api(`/api/clinics/${c.id}`, { method: "PATCH", body: JSON.stringify({ active: !c.active }) });
    await load();
  }

  async function removeClinic() {
    if (!pendingDelete) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/clinics/${pendingDelete.id}`, { method: "DELETE" });
      setPendingDelete(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Устгаж чадсангүй.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaffPage crumb="Хорооны байгууллага">
      <div className="sa-head">
        <div>
          <div className="sa-eyebrow">БАЙГУУЛЛАГА</div>
          <h1>Хорооны байгууллага</h1>
          <p>Өрхийн эрүүл мэндийн төвүүдийг бүртгэж, нэвтрэх эрхийг хамтад нь үүсгэнэ.</p>
        </div>
        <button className="sa-button prime" type="button" onClick={() => setOpen(true)}>＋ Хороо нэмэх</button>
      </div>
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="sa-card">
        <div className="sa-table-scroll">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Хороо</th>
                <th>Байгууллага</th>
                <th>Дүүрэг</th>
                <th>Төлөв</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clinics.length === 0 ? (
                <tr><td colSpan={5}>Бүртгэлтэй хороо алга.</td></tr>
              ) : clinics.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong><small>{c.id}</small></td>
                  <td>{c.organization}</td>
                  <td>{c.districtName}</td>
                  <td><span className={`sa-status ${c.active ? "on" : "off"}`}>{c.active ? "Идэвхтэй" : "Идэвхгүй"}</span></td>
                  <td>
                    <div className="sa-inline">
                      <button className="sa-small" type="button" onClick={() => toggle(c)}>{c.active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}</button>
                      <button className="sa-icon-btn danger" type="button" aria-label="Устгах" title="Устгах" onClick={() => setPendingDelete(c)}>
                        <MenuIcon icon={NAV_ICONS.trash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {pendingDelete ? (
        <div className="sa-overlay" onClick={() => !busy && setPendingDelete(null)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-head">
              <div>
                <h2>Хороо устгах</h2>
                <p>{pendingDelete.name} жагсаалтаас хаагдана. Өгөгдөл бүрэн устгахгүй.</p>
              </div>
              <button className="sa-x" type="button" onClick={() => setPendingDelete(null)} disabled={busy}>✕</button>
            </div>
            <div className="sa-modal-body">
              <p className="sa-delete-note"><b>{pendingDelete.organization}</b> · {pendingDelete.id}</p>
              <div className="sa-formfoot">
                <button className="sa-button" type="button" onClick={() => setPendingDelete(null)} disabled={busy}>Болих</button>
                <button className="sa-button danger" type="button" onClick={removeClinic} disabled={busy}>
                  {busy ? "Устгаж байна…" : "Устгах"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {open ? (
        <div className="sa-overlay" onClick={() => setOpen(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-head">
              <div><h2>Шинэ хороо</h2><p>Байгууллага болон хорооны нэвтрэх эрх хамт үүснэ.</p></div>
              <button className="sa-x" type="button" onClick={() => setOpen(false)}>✕</button>
            </div>
            <form className="sa-modal-body" onSubmit={create}>
              <div className="sa-form-grid">
                <div className="sa-field"><label>Дүүргийн код</label><input name="districtId" defaultValue="SBD" required /></div>
                <div className="sa-field"><label>Дүүргийн нэр</label><input name="districtName" defaultValue="Сүхбаатар" required /></div>
                <div className="sa-field"><label>Хороо</label><input name="ward" placeholder="10" required /></div>
                <div className="sa-field"><label>Байгууллагын нэр</label><input name="organization" required /></div>
                <div className="sa-field"><label>Нэвтрэх нэр</label><input name="username" placeholder="horoo10" required /></div>
                <div className="sa-field"><label>Нууц үг</label><input type="password" name="password" minLength={8} required /></div>
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
