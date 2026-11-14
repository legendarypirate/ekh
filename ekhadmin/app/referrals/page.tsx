"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StaffPage } from "@/components/Shell";
import { Empty, Heading, Tag, Who } from "@/components/Ui";
import { api, pretty, refStatus, type Patient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Row = { patient: Patient; referral: { id: string; createdOn: string; dueDate: string; status: string; reason?: string }; status: string };

export default function ReferralsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const clinic = user?.role === "clinic";

  useEffect(() => {
    api<{ referrals: Row[] }>(`/api/referrals?status=${filter}`)
      .then((d) => setRows(d.referrals))
      .catch((e) => setError(e.message));
  }, [filter]);

  return (
    <StaffPage crumb={clinic ? "Дүүрэгт илгээсэн" : "Илгээсэн эхчүүд"}>
      <Heading
        kicker={clinic ? "ДҮҮРЭГТ ИЛГЭЭХ ХЯНАЛТ" : "ХОРООДООС ИРҮҮЛСЭН"}
        title={clinic ? "Дүүрэгт илгээсэн эхчүүд" : "Илгээсэн эхчүүд"}
        desc="Илгээх бичгийн төлөв, хугацаа хэтрэлт, үзлэгийн явцыг эндээс харна."
      />
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="v29-filterbar">
        {[
          ["all", "Бүгд"],
          ["pending", "Хүлээгдэж байна"],
          ["overdue", "Хугацаа хэтэрсэн"],
          ["completed", "Үзүүлсэн"],
        ].map(([k, label]) => (
          <button key={k} className={filter === k ? "sel" : ""} type="button" onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className="card pad">
        {rows.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Эх</th>
                  <th>Хороо</th>
                  <th>Илгээсэн</th>
                  <th>Эцсийн өдөр</th>
                  <th>Шалтгаан</th>
                  <th>Төлөв</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.referral.id}>
                    <td><Who name={row.patient.name} sub={row.patient.code} /></td>
                    <td>{row.patient.clinic || "—"}</td>
                    <td>{pretty(row.referral.createdOn)}</td>
                    <td>{pretty(row.referral.dueDate)}</td>
                    <td>{row.referral.reason || "—"}</td>
                    <td><Tag status={refStatus({ ...row.referral, status: row.status })} /></td>
                    <td><Link className="ghost" href={`/patients/${row.patient.code}`}>Нээх</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Илгээх бичиг олдсонгүй" />
        )}
      </div>
    </StaffPage>
  );
}
