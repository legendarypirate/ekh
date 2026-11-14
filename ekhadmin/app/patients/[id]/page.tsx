"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StaffPage } from "@/components/Shell";
import { Heading, Tag } from "@/components/Ui";
import { api, pretty, refStatus, todayIso, type Patient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [p, setP] = useState<Patient | null>(null);
  const [tab, setTab] = useState("summary");
  const [modal, setModal] = useState<"visit" | "ref" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await api<{ patient: Patient }>(`/api/patients/${id}`);
    setP(data.patient);
  }

  useEffect(() => {
    api<{ patient: Patient }>(`/api/patients/${id}`)
      .then((data) => setP(data.patient))
      .catch((e) => setError(e.message));
  }, [id]);

  const r = (p?.referrals || []).at(-1);

  async function saveVisit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await api(`/api/patients/${id}/visits`, {
      method: "POST",
      body: JSON.stringify({
        date: f.get("date"),
        title: f.get("title"),
        bp: f.get("bp"),
        weight: f.get("weight"),
        note: f.get("note"),
        advice: f.get("advice"),
        tests: f.get("tests"),
        nextDate: f.get("nextDate") || undefined,
        nextTime: f.get("nextTime") || "10:00",
      }),
    });
    setModal(null);
    await load();
  }

  async function saveRef(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await api(`/api/patients/${id}/referrals`, {
      method: "POST",
      body: JSON.stringify({ days: Number(f.get("days") || 3), reason: f.get("reason") }),
    });
    setModal(null);
    await load();
  }

  if (!p) {
    return (
      <StaffPage crumb="Эхийн карт">
        <div className="card pad">{error || "Ачааллаж байна…"}</div>
      </StaffPage>
    );
  }

  return (
    <StaffPage crumb={p.name}>
      <Heading
        kicker="ЭХИЙН ДЭЛГЭРЭНГҮЙ ХЯНАЛТ"
        title={p.name}
        desc={`${p.code} · ${p.clinic || ""} · ${p.gestation?.label || ""}`}
        actions={
          <>
            <Link className="ghost" href="/patients">← Буцах</Link>
            {user?.role === "district" ? (
              <button className="primary" type="button" onClick={() => setModal("visit")}>＋ Үзлэг бичих</button>
            ) : (
              <button className="primary" type="button" onClick={() => setModal("ref")}>＋ Дүүрэгт дахин илгээх</button>
            )}
          </>
        }
      />
      <div className="detailhero">
        <div className="kicker">НЭГ ЭХИЙН НЭГДСЭН КАРТ</div>
        <h2>{p.name}</h2>
        <p>Хороо болон дүүргийн үзлэг, товлолт, эргэн хяналтыг нэг дороос.</p>
        <div className="quickgrid">
          <div className="quick"><small>Жирэмсний хугацаа</small><strong>{p.gestation?.label}</strong></div>
          <div className="quick"><small>Дүүргийн илгээх төлөв</small><strong>{r ? <Tag status={refStatus(r)} /> : "Илгээгээгүй"}</strong></div>
          <div className="quick"><small>Хороо</small><strong>{p.clinic || "—"}</strong></div>
          <div className="quick"><small>Үзлэг</small><strong>{(p.visits || []).length}</strong></div>
        </div>
      </div>
      <div className="tabs">
        {[
          ["summary", "Ерөнхий"],
          ["visits", "Үзлэг"],
          ["referrals", "Илгээх"],
          ["questions", "Асуулт"],
        ].map(([k, label]) => (
          <button key={k} className={tab === k ? "active" : ""} type="button" onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "summary" ? (
        <div className="card pad">
          <div className="kv">
            {[
              ["Эхийн нэр", p.name],
              ["Бүртгэлийн код", p.code],
              ["Утас", p.phone],
              ["Хороо", p.clinic],
              ["Эмч", p.doctor],
              ["ССТ", pretty(p.lmp)],
            ].map(([k, v]) => (
              <div key={k}><small>{k}</small><strong>{String(v || "—")}</strong></div>
            ))}
          </div>
        </div>
      ) : null}
      {tab === "visits" ? (
        <div>
          {(p.visits || []).length ? (p.visits || []).slice().reverse().map((v) => (
            <article className="history-card" key={String(v.id)}>
              <b>{String(v.title)}</b>
              <div className="by">{pretty(String(v.date))} · {String(v.author || v.provider || "")}</div>
              <p>{String(v.note || "")}</p>
            </article>
          )) : <div className="card pad">Үзлэг бүртгэгдээгүй.</div>}
        </div>
      ) : null}
      {tab === "referrals" ? (
        <div>
          {(p.referrals || []).length ? (p.referrals || []).slice().reverse().map((r0) => (
            <article className="history-card" key={r0.id}>
              <Tag status={refStatus(r0)} />
              <div className="by">{pretty(r0.createdOn)} → {pretty(r0.dueDate)}</div>
              <p>{r0.reason}</p>
            </article>
          )) : <div className="card pad">Илгээх бичиг алга.</div>}
        </div>
      ) : null}
      {tab === "questions" ? (
        <div>
          {(p.questions || []).length ? (p.questions || []).slice().reverse().map((q) => (
            <article className="history-card" key={String(q.id)}>
              <b>{String(q.category || "Бусад")}</b>
              <p>{String(q.text)}</p>
              {q.reply ? <p><b>Хариу:</b> {String(q.reply)}</p> : <span className="tag pending">Хүлээгдэж байна</span>}
            </article>
          )) : <div className="card pad">Асуулт алга.</div>}
        </div>
      ) : null}

      {modal ? (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{modal === "visit" ? "Дүүргийн үзлэг бүртгэх" : "Дүүрэгт дахин илгээх"}</h2>
              <button className="close" type="button" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {modal === "visit" ? (
                <form onSubmit={saveVisit}>
                  <div className="formgrid">
                    <div className="field"><label>Огноо *</label><input type="date" name="date" defaultValue={todayIso()} max={todayIso()} required /></div>
                    <div className="field"><label>Үзлэгийн нэр *</label><input name="title" defaultValue="Дүүргийн нарийн мэргэжлийн үзлэг" required /></div>
                    <div className="field"><label>АД</label><input name="bp" placeholder="118/75" /></div>
                    <div className="field"><label>Жин</label><input name="weight" /></div>
                    <div className="field wide"><label>Тэмдэглэл *</label><textarea name="note" required /></div>
                    <div className="field wide"><label>Зөвлөгөө</label><textarea name="advice" /></div>
                    <div className="field"><label>Дараагийн огноо</label><input type="date" name="nextDate" min={todayIso()} /></div>
                    <div className="field"><label>Цаг</label><input name="nextTime" defaultValue="10:00" /></div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="ghost" onClick={() => setModal(null)}>Болих</button>
                    <button className="primary" type="submit">✓ Үзлэгийг бүртгэх</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={saveRef}>
                  <div className="field"><label>Очих хугацаа</label>
                    <select name="days" defaultValue="3">
                      <option value="3">3 хоногийн дотор</option>
                      <option value="5">5 хоногийн дотор</option>
                    </select>
                  </div>
                  <div className="field" style={{ marginTop: 12 }}><label>Шалтгаан</label><textarea name="reason" required /></div>
                  <div className="form-actions">
                    <button type="button" className="ghost" onClick={() => setModal(null)}>Болих</button>
                    <button className="primary" type="submit">Илгээх</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </StaffPage>
  );
}
