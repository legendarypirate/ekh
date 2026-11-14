"use client";

import { FormEvent, useEffect, useState } from "react";
import { StaffPage } from "@/components/Shell";
import { api } from "@/lib/api";

type Account = { id: string; name: string; username: string; role: string; clinicId?: string; districtId?: string; clinicIds?: string[]; active: boolean };

const roleLabel: Record<string, string> = {
  clinic: "Хороо",
  district: "Дүүрэг",
  superadmin: "Super Admin",
};

export default function AccountsPage() {
  const [rows, setRows] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Account | null>(null);

  async function load() {
    const data = await api<{ accounts: Account[] }>("/api/clinics/accounts");
    setRows(data.accounts);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") || "");
    await api(`/api/clinics/accounts/${edit.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: f.get("name"),
        active: f.get("active") === "on",
        ...(password ? { password } : {}),
      }),
    });
    setEdit(null);
    await load();
  }

  return (
    <StaffPage crumb="Нэвтрэх эрхүүд">
      <div className="sa-head">
        <div>
          <div className="sa-eyebrow">ЭРХ</div>
          <h1>Нэвтрэх эрхүүд</h1>
          <p>Хороо, дүүрэг, super admin эрхийг идэвхжүүлэх, нууц үг солих.</p>
        </div>
      </div>
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="sa-card">
        <div className="sa-table-scroll">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Нэр</th>
                <th>Нэвтрэх</th>
                <th>Төрөл</th>
                <th>Төлөв</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.name}</strong></td>
                  <td><code>{a.username}</code></td>
                  <td>{roleLabel[a.role] || a.role}</td>
                  <td><span className={`sa-status ${a.active ? "on" : "off"}`}>{a.active ? "Идэвхтэй" : "Идэвхгүй"}</span></td>
                  <td><button className="sa-small" type="button" onClick={() => setEdit(a)}>Засах</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {edit ? (
        <div className="sa-overlay" onClick={() => setEdit(null)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-head">
              <div><h2>{edit.username}</h2><p>Нэр, төлөв, нууц үг</p></div>
              <button className="sa-x" type="button" onClick={() => setEdit(null)}>✕</button>
            </div>
            <form className="sa-modal-body" onSubmit={save}>
              <div className="sa-field"><label>Нэр</label><input name="name" defaultValue={edit.name} required /></div>
              <div className="sa-field"><label>Шинэ нууц үг</label><input type="password" name="password" minLength={8} placeholder="Хоосон бол өөрчлөхгүй" /></div>
              {edit.role !== "superadmin" ? (
                <label className="sa-select-ward">
                  <input type="checkbox" name="active" defaultChecked={edit.active} />
                  <div><strong>Идэвхтэй</strong></div>
                </label>
              ) : null}
              <div className="sa-formfoot">
                <button className="sa-button" type="button" onClick={() => setEdit(null)}>Болих</button>
                <button className="sa-button prime" type="submit">Хадгалах</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </StaffPage>
  );
}
