"use client";

import { useEffect, useState } from "react";
import { StaffPage } from "@/components/Shell";
import { api, pretty } from "@/lib/api";

type Log = { id: string; at?: string; actor?: string; action?: string; patientId?: string };

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ logs: Log[] }>("/api/clinics/audit")
      .then((d) => setLogs(d.logs))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <StaffPage crumb="Үйлдлийн LOG">
      <div className="sa-head">
        <div>
          <div className="sa-eyebrow">AUDIT</div>
          <h1>Үйлдлийн LOG</h1>
          <p>Системийн бүртгэл, үзлэг, илгээх бичигтэй холбоотой үйлдлүүд.</p>
        </div>
      </div>
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="sa-card">
        <div className="sa-table-scroll">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Огноо</th>
                <th>Хэн</th>
                <th>Үйлдэл</th>
                <th>Эх</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{pretty(String(l.at || "").slice(0, 10))}</td>
                  <td>{l.actor || "—"}</td>
                  <td>{l.action}</td>
                  <td><code>{l.patientId ? String(l.patientId).slice(0, 8) : "—"}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </StaffPage>
  );
}
