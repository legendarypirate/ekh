"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StaffPage } from "@/components/Shell";
import { Empty, Heading, Who } from "@/components/Ui";
import { api, pretty, todayIso, type Patient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Appt = { id: string; date: string; time?: string; title: string; place?: string; status?: string; patient?: Patient };

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  return `${y} оны ${Number(mo)}-р сар`;
}

function shiftMonth(m: string, n: number) {
  const d = new Date(`${m}-01T12:00:00`);
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const [rows, setRows] = useState<Appt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const clinic = user?.role === "clinic";

  useEffect(() => {
    api<{ appointments: Appt[] }>(`/api/schedule?month=${month}`)
      .then((d) => setRows(d.appointments))
      .catch((e) => setError(e.message));
  }, [month]);

  const byDate = useMemo(() => {
    const map: Record<string, Appt[]> = {};
    for (const a of rows) {
      (map[a.date] ||= []).push(a);
    }
    return map;
  }, [rows]);

  return (
    <StaffPage crumb={clinic ? "Хуваарь" : "Үзлэгийн календарь"}>
      <Heading
        kicker={clinic ? "ХОРООНЫ ХУВААРЬ" : "ДҮҮРГИЙН КАЛЕНДАРЬ"}
        title={clinic ? "Хуваарь" : "Үзлэгийн календарь"}
        desc="Товлосон үзлэгийг сараар харна."
        actions={
          <div className="actions">
            <button className="ghost" type="button" onClick={() => setMonth(shiftMonth(month, -1))}>←</button>
            <span className="tag neutral">{monthLabel(month)}</span>
            <button className="ghost" type="button" onClick={() => setMonth(shiftMonth(month, 1))}>→</button>
          </div>
        }
      />
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="card pad">
        {Object.keys(byDate).length ? (
          Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, list]) => (
            <div key={date} style={{ marginBottom: 18 }}>
              <div className="panel-title"><h2>{pretty(date)}</h2><span className="tag neutral">{list.length}</span></div>
              {list.map((a) => (
                <article className="history-card" key={a.id}>
                  <Who name={a.patient?.name || "Эх"} sub={`${a.time || ""} · ${a.place || ""}`} />
                  <p>{a.title}</p>
                  {a.patient?.code ? <Link className="ghost" href={`/patients/${a.patient.code}`}>Карт нээх</Link> : null}
                </article>
              ))}
            </div>
          ))
        ) : (
          <Empty title="Энэ сард товлосон үзлэг алга" />
        )}
      </div>
    </StaffPage>
  );
}
