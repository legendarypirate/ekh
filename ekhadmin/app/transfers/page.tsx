"use client";

import { useEffect, useState } from "react";
import { StaffPage } from "@/components/Shell";
import { Empty, Heading, Who } from "@/components/Ui";
import { api, pretty, type Patient } from "@/lib/api";

type Transfer = {
  id: string;
  createdOn: string;
  status: string;
  reason?: string;
  targetClinic?: string;
  region?: string;
  address?: string;
  patient?: Patient;
};

const labels: Record<string, string> = {
  pending: "Хүлээгдэж байна",
  forwarded: "Шилжүүлсэн",
  forwarded_external: "Гадагш шилжүүлсэн",
  completed: "Хүлээн авсан",
  rejected: "Татгалзсан",
  needs_info: "Нэмэлт мэдээлэл",
};

export default function TransfersPage() {
  const [outgoing, setOutgoing] = useState<Transfer[]>([]);
  const [incoming, setIncoming] = useState<Transfer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    const data = await api<{ outgoing: Transfer[]; incoming: Transfer[] }>("/api/transfers");
    setOutgoing(data.outgoing);
    setIncoming(data.incoming);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function decide(t: Transfer, decision: string) {
    if (!t.patient?.code) return;
    await api(`/api/patients/${t.patient.code}/transfers/${t.id}`, {
      method: "PATCH",
      body: JSON.stringify({ decision, note }),
    });
    setNote("");
    await load();
  }

  return (
    <StaffPage crumb="Шилжилтийн хүсэлт">
      <Heading
        kicker="ХОРОО ХООРОНДЫН ШИЛЖИЛТ"
        title="Шилжилтийн хүсэлт"
        desc="Эх өөр хороонд шилжих хүсэлтийг хянаж, хүлээн авах эсвэл шилжүүлнэ."
      />
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="split">
        <section className="card pad">
          <div className="panel-title"><h2>Гарах хүсэлт</h2></div>
          {outgoing.length ? outgoing.map((t) => (
            <article className="history-card" key={t.id}>
              <Who name={t.patient?.name || "Эх"} sub={t.patient?.code} />
              <div className="by">{pretty(t.createdOn)} · {labels[t.status] || t.status}</div>
              <p>{t.reason || t.targetClinic || t.region || "—"}</p>
              {t.status === "pending" ? (
                <div className="form-actions">
                  <button className="ghost" type="button" onClick={() => decide(t, "rejected")}>Татгалзах</button>
                  <button className="primary" type="button" onClick={() => decide(t, "forward")}>Шилжүүлэх</button>
                </div>
              ) : null}
            </article>
          )) : <Empty title="Гарах хүсэлт алга" />}
        </section>
        <section className="card pad">
          <div className="panel-title"><h2>Ирэх хүсэлт</h2></div>
          {incoming.length ? incoming.map((t) => (
            <article className="history-card" key={t.id}>
              <Who name={t.patient?.name || "Эх"} sub={t.patient?.code} />
              <div className="by">{pretty(t.createdOn)} · {labels[t.status] || t.status}</div>
              <p>{t.reason || t.address || "—"}</p>
              {t.status === "forwarded" ? (
                <div className="form-actions">
                  <input placeholder="Тэмдэглэл" value={note} onChange={(e) => setNote(e.target.value)} />
                  <button className="primary" type="button" onClick={() => decide(t, "accept")}>Хүлээн авах</button>
                </div>
              ) : null}
            </article>
          )) : <Empty title="Ирэх хүсэлт алга" />}
        </section>
      </div>
    </StaffPage>
  );
}
