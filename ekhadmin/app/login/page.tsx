"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, ready, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const err = await login(String(fd.get("username") || ""), String(fd.get("password") || ""));
    setError(err);
    setBusy(false);
  }

  if (!ready || user) {
    return (
      <div className="login-bg">
        <div className="login">
          <div className="kicker">ЭНХЭХ</div>
          <h1>Ачааллаж байна…</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="login-bg">
      <div className="login">
        <div className="emblem">✚</div>
        <div className="kicker">ЭНХЭХ · ЭМНЭЛГИЙН СИСТЕМ</div>
        <h1>Системд нэвтрэх</h1>
        <p>Super Admin, хорооны байгууллага болон дүүргийн эмч өөрийн эрхээр нэвтэрнэ.</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Нэвтрэх нэр</label>
            <input name="username" placeholder="Нэвтрэх нэр" required autoComplete="username" />
          </div>
          <div className="field">
            <label>Нууц үг</label>
            <input type="password" name="password" placeholder="Нууц үг" autoComplete="current-password" required />
          </div>
          {error ? <div className="loginerr">{error}</div> : null}
          <button type="submit" className="primary" style={{ width: "100%", marginTop: 7 }} disabled={busy}>
            {busy ? "Нэвтэрч байна…" : "Нэвтрэх"}
          </button>
        </form>
        <div className="logindemo">
          <strong>Зөвхөн туршилтын нэвтрэх эрх</strong>
          <div>8-р хороо: <code>horoo08 / Demo@0808</code></div>
          <div>9-р хороо: <code>horoo09 / Demo@0909</code></div>
          <div>Дүүрэг: <code>duureg / Demo@district</code></div>
          <div>Super Admin: <code>superadmin / Demo@Super26!</code></div>
        </div>
      </div>
    </div>
  );
}
