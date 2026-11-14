"use client";

import { FormEvent, useEffect, useState } from "react";
import { StaffPage } from "@/components/Shell";
import { Heading } from "@/components/Ui";
import { api, pretty, type Patient } from "@/lib/api";

type Q = {
  id: string;
  category?: string;
  text: string;
  status: string;
  reply?: string;
  createdAt?: string;
  repliedAt?: string;
  patient?: Patient;
};

export default function QuestionsPage() {
  const [filter, setFilter] = useState("all");
  const [rows, setRows] = useState<Q[]>([]);
  const [sel, setSel] = useState<Q | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(next = filter) {
    const data = await api<{ questions: Q[] }>(`/api/questions?status=${next}`);
    setRows(data.questions);
    setSel((cur) => data.questions.find((q) => q.id === cur?.id) || data.questions[0] || null);
  }

  useEffect(() => {
    api<{ questions: Q[] }>(`/api/questions?status=${filter}`)
      .then((data) => {
        setRows(data.questions);
        setSel((cur) => data.questions.find((q) => q.id === cur?.id) || data.questions[0] || null);
      })
      .catch((e) => setError(e.message));
  }, [filter]);

  async function reply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sel?.patient?.code) return;
    const f = new FormData(e.currentTarget);
    await api(`/api/patients/${sel.patient.code}/questions/${sel.id}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply: f.get("reply") }),
    });
    e.currentTarget.reset();
    await load();
  }

  const unanswered = rows.filter((q) => q.status === "new").length;

  return (
    <StaffPage crumb="Эхийн асуултууд">
      <Heading
        kicker="ХОРООНЫ ИНБОКС"
        title="Эхийн асуултууд"
        desc="Харьяа эхчүүдийн илгээсэн асуултад хариулна. Яаралтай шинж байвал утсаар холбогдоно."
      />
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="v29-inbox-stats">
        <div className="v29-inbox-stat"><b>{rows.length}</b><small>Нийт асуулт</small></div>
        <div className="v29-inbox-stat"><b>{unanswered}</b><small>Хариулаагүй</small></div>
        <div className="v29-inbox-stat"><b>{rows.length - unanswered}</b><small>Хариулсан</small></div>
      </div>
      <div className="v29-filterbar">
        {[["all", "Бүгд"], ["new", "Шинэ"], ["answered", "Хариулсан"]].map(([k, label]) => (
          <button key={k} className={filter === k ? "sel" : ""} type="button" onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>
      <div className="v29-inbox-layout">
        <div className="v29-inbox-list">
          {rows.length ? rows.map((q) => (
            <button
              key={q.id}
              type="button"
              className={`v29-inbox-row ${sel?.id === q.id ? "selected" : ""} ${q.status === "new" ? "unanswered" : ""}`}
              onClick={() => setSel(q)}
            >
              <small>{q.patient?.name} · {q.category}</small>
              <strong>{q.text.slice(0, 90)}</strong>
              <span className={`v29-inbox-badge ${q.status === "answered" ? "answered" : ""}`}>
                {q.status === "answered" ? "Хариулсан" : "Хүлээгдэж байна"}
              </span>
            </button>
          )) : <div className="v29-inbox-empty">Асуулт алга.</div>}
        </div>
        <div className="v29-thread-panel">
          {sel ? (
            <>
              <h3>{sel.patient?.name}</h3>
              <p className="v29-help">{sel.category} · {pretty(sel.createdAt?.slice(0, 10))} · {sel.patient?.code}</p>
              <div className="v29-message-bubble">{sel.text}</div>
              {sel.reply ? <div className="v29-message-bubble doc">{sel.reply}</div> : (
                <form className="v29-reply-form" onSubmit={reply}>
                  <label>Эмчийн хариу</label>
                  <textarea name="reply" required minLength={5} placeholder="Ээж ээ, ..." />
                  <button className="primary" type="submit">Хариу илгээх</button>
                </form>
              )}
            </>
          ) : (
            <p className="v29-help">Зүүн талаас асуулт сонгоно уу.</p>
          )}
        </div>
      </div>
    </StaffPage>
  );
}
