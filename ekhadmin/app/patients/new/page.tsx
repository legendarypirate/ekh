"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StaffPage } from "@/components/Shell";
import { Heading } from "@/components/Ui";
import { api, todayIso } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function NewPatientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user && user.role !== "clinic") {
    return (
      <StaffPage crumb="Эхийн бүртгэл">
        <div className="card pad">Эх бүртгэх эрхгүй.</div>
      </StaffPage>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v)]));
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ patient: { code: string } }>("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          ...body,
          appPhone: body.appPhone,
          appPassword: body.appPassword,
          referDays: Number(body.referDays || 3),
        }),
      });
      router.push(`/patients/${data.patient.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хадгалж чадсангүй.");
      setBusy(false);
    }
  }

  return (
    <StaffPage crumb="Шинэ эх">
      <Heading
        kicker="АНХНЫ ҮЗЛЭГ, БҮРТГЭЛ"
        title="Жирэмсэн эх шинээр бүртгэх"
        desc="Хадгалахад дүүргийн илгээх бүртгэл автоматаар үүснэ."
        actions={<Link className="ghost" href="/patients">← Буцах</Link>}
      />
      <form className="card pad" onSubmit={onSubmit}>
        <div className="formgrid">
          <div className="field"><label>Бүртгэлийн код *</label><input name="code" required placeholder="P004" /></div>
          <div className="field"><label>Эхийн нэр *</label><input name="name" required /></div>
          <div className="field"><label>Сүүлийн сарын тэмдэг *</label><input type="date" name="lmp" required max={todayIso()} /></div>
          <div className="field"><label>Холбоо барих утас</label><input name="phone" /></div>
          <div className="field"><label>Аппын утас *</label><input name="appPhone" required placeholder="99000004" /></div>
          <div className="field"><label>Аппын нууц үг *</label><input type="password" name="appPassword" required minLength={8} /></div>
          <div className="field"><label>Хүйсийн мэдээлэл</label>
            <select name="gender" defaultValue="unknown">
              <option value="unknown">Тодорхойгүй</option>
              <option value="girl">Охин</option>
              <option value="boy">Хүү</option>
            </select>
          </div>
          <div className="field"><label>Очих хугацаа</label>
            <select name="referDays" defaultValue="3">
              <option value="3">3 хоногийн дотор</option>
              <option value="5">5 хоногийн дотор</option>
            </select>
          </div>
          <div className="field wide"><label>Илгээх шалтгаан</label><textarea name="refReason" placeholder="Анхны нарийн мэргэжлийн үзлэг" /></div>
        </div>
        {error ? <div className="loginerr">{error}</div> : null}
        <div className="form-actions">
          <Link className="ghost" href="/patients">Болих</Link>
          <button className="primary" disabled={busy} type="submit">{busy ? "Хадгалж байна…" : "Бүртгэх"}</button>
        </div>
      </form>
    </StaffPage>
  );
}
