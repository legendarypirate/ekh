"use client";

import { useEffect, useState } from "react";
import { StaffPage } from "@/components/Shell";
import { Empty, Heading } from "@/components/Ui";
import { api, pretty } from "@/lib/api";

type Log = { id: string; at?: string; actor?: string; action?: string; patientId?: string };

export default function ReportsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ logs: Log[] }>("/api/clinics/audit")
      .then((d) => setLogs(d.logs))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <StaffPage crumb="Тайлан / LOG">
      <Heading kicker="ҮЙЛДЛИЙН ТҮҮХ" title="Тайлан / LOG" desc="Бүртгэл, үзлэг, илгээх бичигтэй холбоотой үйлдлүүд." />
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="card pad">
        {logs.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Огноо</th>
                  <th>Хэн</th>
                  <th>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{pretty(String(l.at || "").slice(0, 10))}</td>
                    <td>{l.actor || "—"}</td>
                    <td>{l.action || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="LOG хоосон" />
        )}
      </div>
    </StaffPage>
  );
}
