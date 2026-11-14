"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StaffPage } from "@/components/Shell";
import { Empty, Heading, Tag, Who } from "@/components/Ui";
import { api, pretty, refStatus, type Patient } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Dash = {
  totals: {
    patients: number;
    pendingReferrals: number;
    overdue: number;
    completedReferrals: number;
    newQuestions: number;
    pendingTransfers: number;
  };
  urgent: Array<{ patient: Patient; referral: { id: string; createdOn: string; dueDate: string; status: string } }>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Dash>("/api/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);

  const clinic = user?.role === "clinic";
  return (
    <StaffPage crumb="Хяналтын самбар">
      <Heading
        kicker={clinic ? "ХОРООНЫ ЭРҮҮЛ МЭНДИЙН ТӨВ" : "ДҮҮРГИЙН НАРИЙН МЭРГЭЖЛИЙН ХЯНАЛТ"}
        title={clinic ? "Хяналтын самбар" : "Дүүргийн хяналтын самбар"}
        desc={clinic ? "Анхны бүртгэл, илгээх хугацаа, эргэн хяналтыг нэг дороос." : "Хороодоос ирүүлсэн эхчүүдийн үзлэгийг хийж, үр дүнг буцаан дамжуулна."}
        actions={clinic ? <Link className="primary" href="/patients/new">＋ Шинэ эх бүртгэх</Link> : null}
      />
      {error ? <div className="loginerr">{error}</div> : null}
      {clinic && data?.totals.newQuestions ? (
        <div className="v29-new-notice">
          <span>
            <b>✉ {data.totals.newQuestions} шинэ асуулт ирсэн</b>
            <br />
            Хариуцсан хорооны эхчүүд хариу хүлээж байна.
          </span>
          <Link href="/questions">Асуултуудыг харах</Link>
        </div>
      ) : null}
      <div className="statgrid">
        <div className="card stat">
          <i>♧</i>
          <strong>{data?.totals.patients ?? "—"}</strong>
          <small>{clinic ? "Бүртгэлтэй эх" : "Ирүүлсэн нийт эх"}</small>
        </div>
        <div className="card stat amber">
          <i>⌛</i>
          <strong>{data?.totals.pendingReferrals ?? "—"}</strong>
          <small>Дүүргийн үзлэг хүлээж байна</small>
        </div>
        <div className="card stat red">
          <i>!</i>
          <strong>{data?.totals.overdue ?? "—"}</strong>
          <small>Хугацаа хэтэрсэн</small>
        </div>
        <div className="card stat blue">
          <i>✓</i>
          <strong>{data?.totals.completedReferrals ?? "—"}</strong>
          <small>Дүүрэгт үзүүлсэн</small>
        </div>
      </div>
      <div className="split">
        <section className="card pad">
          <div className="panel-title">
            <h2>Яаралтай эргэн хянах жагсаалт</h2>
            <Link className="subtle" href="/referrals">Бүгдийг харах</Link>
          </div>
          {data?.urgent?.length ? (
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Эх</th>
                    <th>Хороо</th>
                    <th>Илгээсэн</th>
                    <th>Очих эцсийн өдөр</th>
                    <th>Төлөв</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.urgent.map(({ patient, referral }) => (
                    <tr key={referral.id}>
                      <td><Who name={patient.name} sub={patient.code} /></td>
                      <td>{patient.clinic || "—"}</td>
                      <td>{pretty(referral.createdOn)}</td>
                      <td>{pretty(referral.dueDate)}</td>
                      <td><Tag status={refStatus(referral)} /></td>
                      <td><Link className="ghost" href={`/patients/${patient.code}`}>Нээх</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Хүлээгдэж буй илгээх бичиг алга" desc="Бүртгэл болон үзлэгийн явц энд харагдана." />
          )}
        </section>
        <section className="card pad">
          <div className="panel-title"><h2>Ажлын урсгал</h2></div>
          <div className="list">
            <div className="listitem"><div><b>1 · Хорооны анхны бүртгэл</b><small>А/B/C ангилал ба дүүрэгт очих хугацаа</small></div><span className="tag blue">Хороо</span></div>
            <div className="listitem"><div><b>2 · Дүүргийн үзлэг</b><small>Ирсэн эхийн үзлэг, зөвлөгөө бүртгэх</small></div><span className="tag blue">Дүүрэг</span></div>
            <div className="listitem"><div><b>3 · Баталгаажсан эргэн холбоо</b><small>Хорооны самбарт “Үзүүлсэн” төлөв</small></div><span className="tag done">LOG</span></div>
            <div className="listitem"><div><b>4 · Эхийн апп</b><small>Хугацааны сануулга, дараагийн тов</small></div><span className="tag done">App</span></div>
          </div>
        </section>
      </div>
    </StaffPage>
  );
}
