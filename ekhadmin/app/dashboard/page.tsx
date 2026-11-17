"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StaffPage } from "@/components/Shell";
import { Empty, Heading, StatCard, Tag, Who } from "@/components/Ui";
import { FLOW_ICONS, MenuIcon, NAV_ICONS, STAT_ICONS } from "@/components/icons";
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
        actions={clinic ? <Link className="primary" href="/patients/new"><MenuIcon icon={NAV_ICONS.patients} size={16} /> Шинэ эх бүртгэх</Link> : null}
      />
      {error ? <div className="loginerr">{error}</div> : null}
      {clinic && data?.totals.newQuestions ? (
        <div className="v29-new-notice">
          <span>
            <b className="v29-new-notice-title"><MenuIcon icon={NAV_ICONS.questions} size={16} /> {data.totals.newQuestions} шинэ асуулт ирсэн</b>
            <br />
            Хариуцсан хорооны эхчүүд хариу хүлээж байна.
          </span>
          <Link href="/questions">Асуултуудыг харах</Link>
        </div>
      ) : null}
      <div className="statgrid">
        <StatCard icon={STAT_ICONS.registered} value={data?.totals.patients ?? "—"} label={clinic ? "Бүртгэлтэй эх" : "Ирүүлсэн нийт эх"} />
        <StatCard icon={STAT_ICONS.waiting} tone="amber" value={data?.totals.pendingReferrals ?? "—"} label="Дүүргийн үзлэг хүлээж байна" />
        <StatCard icon={STAT_ICONS.overdue} tone="red" value={data?.totals.overdue ?? "—"} label="Хугацаа хэтэрсэн" />
        <StatCard icon={STAT_ICONS.completed} tone="blue" value={data?.totals.completedReferrals ?? "—"} label="Дүүрэгт үзүүлсэн" />
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
            <div className="listitem">
              <span className="flow-ico"><MenuIcon icon={FLOW_ICONS.register} /></span>
              <div><b>Анхны бүртгэл</b><small>А/B/C ангилал ба дүүрэгт очих хугацаа</small></div>
              <span className="tag blue">Хороо</span>
            </div>
            <div className="listitem">
              <span className="flow-ico"><MenuIcon icon={FLOW_ICONS.visit} /></span>
              <div><b>Дүүргийн үзлэг</b><small>Ирсэн эхийн үзлэг, зөвлөгөө бүртгэх</small></div>
              <span className="tag blue">Дүүрэг</span>
            </div>
            <div className="listitem">
              <span className="flow-ico"><MenuIcon icon={FLOW_ICONS.confirm} /></span>
              <div><b>Баталгаажуулалт</b><small>Хорооны самбарт “Үзүүлсэн” төлөв</small></div>
              <span className="tag done">LOG</span>
            </div>
            <div className="listitem">
              <span className="flow-ico"><MenuIcon icon={FLOW_ICONS.app} /></span>
              <div><b>Эхийн апп</b><small>Хугацааны сануулга, дараагийн тов</small></div>
              <span className="tag done">App</span>
            </div>
          </div>
        </section>
      </div>
    </StaffPage>
  );
}
