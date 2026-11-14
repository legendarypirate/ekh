"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StaffPage } from "@/components/Shell";
import { Empty, Heading, Tag, Who } from "@/components/Ui";
import { api, pretty, refStatus, type Patient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function PatientsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const clinic = user?.role === "clinic";

  useEffect(() => {
    api<{ patients: Patient[] }>(`/api/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((d) => setRows(d.patients))
      .catch((e) => setError(e.message));
  }, [q]);

  const filtered = useMemo(() => rows, [rows]);

  return (
    <StaffPage crumb={clinic ? "Эхийн бүртгэл" : "Илгээсэн эхчүүд"}>
      <Heading
        kicker={clinic ? "ХОРООНЫ ЭХЧҮҮД" : "ХОРООДООС ИРҮҮЛСЭН ЭХЧҮҮД"}
        title={clinic ? "Эхийн бүртгэл" : "Илгээсэн эхчүүд"}
        desc={clinic ? "Эхийг шинээр бүртгэх, дэлгэрэнгүй карт, дүүрэгт илгээсэн явцыг харах." : "Дүүргийн эмч эх шинээр бүртгэхгүй. Зөвхөн хороодоос ирүүлсэн эхчүүдэд үзлэг хийнэ."}
        actions={clinic ? <Link className="primary" href="/patients/new">＋ Шинэ эх бүртгэх</Link> : null}
      />
      {error ? <div className="loginerr">{error}</div> : null}
      <div className="card pad">
        <div className="filters">
          <input placeholder="Нэр, регистр, код эсвэл утсаар хайх" value={q} onChange={(e) => setQ(e.target.value)} />
          <span className="tag neutral">Нийт {filtered.length} эх</span>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Эхийн мэдээлэл</th>
                <th>Харьяа хороо</th>
                <th>Жирэмсний хугацаа</th>
                <th>Дүүргийн илгээх төлөв</th>
                <th>Тов</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const r = (p.referrals || []).at(-1);
                const a = (p.appointments || []).filter((x) => x.status === "planned").sort((x, y) => x.date.localeCompare(y.date))[0];
                return (
                  <tr key={p.id}>
                    <td><Who name={p.name} sub={p.code} /></td>
                    <td>{p.clinic || "—"}</td>
                    <td>{p.gestation?.label || "—"}</td>
                    <td>{r ? <Tag status={refStatus(r)} /> : <span className="tag neutral">Илгээгээгүй</span>}</td>
                    <td>{a ? pretty(a.date) : "—"}</td>
                    <td><Link className="ghost" href={`/patients/${p.code}`}>Дэлгэрэнгүй</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <Empty title="Бүртгэл олдсонгүй" /> : null}
      </div>
    </StaffPage>
  );
}
