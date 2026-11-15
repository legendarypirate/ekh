"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StaffPage } from "@/components/Shell";
import { Heading } from "@/components/Ui";
import { api, daysBetween, shiftIso, todayIso } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const PREVIOUS_OUTCOMES = [
  ["term", "Гүйцэд"],
  ["preterm", "Дутуу"],
  ["termination", "Үр хөндөлт"],
  ["miscarriage", "Зулбалт"],
] as const;

const REG_RISK: Record<string, string[]> = {
  A: [
    "19-өөс доош насны жирэмсэн",
    "30-аас дээш насны анхны төрөлт",
    "35-аас дээш насны жирэмсэн",
    "Нэн ядуу нөхцөл",
    "Хоол тэжээлийн дутагдал",
    "Тамхи, архи, мансууруулах бодис хэрэглэдэг",
    "Хүчирхийлэлд өртөж болзошгүй",
  ],
  Б: [
    "5 ба түүнээс олон төрсөн",
    "Өмнөх жирэмслэлт, төрөлтөд цус алдаж байсан",
    "Кесар мэс засал, умайн сорвитой",
    "Манас таталтын урьдал/манас таталттай байсан",
    "Давтан зулбалт, дутуу төрөлт, умайн гаднах жирэмслэлт",
    "Ураг, нярай эндсэн",
    "Төрөлхийн хөгжлийн гажигтай хүүхэд төрүүлсэн",
    "Үргүйдлийн өгүүлэмжтэй",
  ],
  В: [
    "Зүрх, судасны архаг өвчин",
    "Амьсгалын замын архаг өвчин",
    "Хоол боловсруулах, элэгний өвчин",
    "Бөөр, шээсний замын өвчин",
    "Дотоод шүүрэл, чихрийн шижин",
    "Цусны эмгэг",
    "Эмэгтэйчүүдийн хавсарсан өвчин",
    "Халдварт өвчний өгүүлэмж",
  ],
  Г: [
    "Хүнд хэлбэрийн жирэмсний хордлого",
    "Жирэмсний үеийн чихрийн шижин",
    "Манас таталтын урьдал/манас таталт",
    "Умайн болон үтрээний цус алдалт",
    "Ураг өсөлтийн саатал/урагтай холбоотой хүндрэл",
    "Ихэр буюу олон урагтай жирэмсэн",
    "Ураг орчмын ус эрт гарах/өөрчлөгдөх",
    "Ихэсийн байрлал, үйл ажиллагааны хүндрэл",
  ],
};

function weightDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function weightLive(value: string) {
  const digits = weightDigits(value);
  return digits ? `${digits[0]},${digits.slice(1)}` : "";
}

function weightGroup(value: string) {
  const digits = weightDigits(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function NewPatientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const today = useMemo(() => todayIso(), []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [referDays, setReferDays] = useState(3);
  const [exitOutcome, setExitOutcome] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const born = exitOutcome === "term" || exitOutcome === "preterm";
  const ended = exitOutcome === "termination" || exitOutcome === "miscarriage";

  function onRegInput(e: FormEvent<HTMLInputElement>) {
    const raw = e.currentTarget.value.replace(/\s+/g, "").toUpperCase().slice(0, 10);
    if (e.currentTarget.value !== raw) e.currentTarget.value = raw;
  }

  function onEmergencyInput(e: FormEvent<HTMLInputElement>) {
    const digits = e.currentTarget.value.replace(/\D/g, "").slice(0, 8);
    if (e.currentTarget.value !== digits) e.currentTarget.value = digits;
  }

  function onBabyWeightInput(e: FormEvent<HTMLInputElement>) {
    const next = weightLive(e.currentTarget.value);
    if (e.currentTarget.value !== next) e.currentTarget.value = next;
  }

  function onBabyWeightBlur(e: FormEvent<HTMLInputElement>) {
    e.currentTarget.value = weightGroup(e.currentTarget.value);
  }

  function onBabyWeightKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    if (e.key !== "Backspace") return;
    if (/^\d,$/.test(el.value) && el.selectionStart === el.value.length && el.selectionEnd === el.value.length) {
      e.preventDefault();
      el.value = "";
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) || "").trim();
    const appPassword = String(f.get("appPassword") || "");
    const appPasswordConfirm = String(f.get("appPasswordConfirm") || "");
    const lmp = v("lmp");
    const registrationNumber = v("registrationNumber").toUpperCase();
    const appPhone = v("appPhone").replace(/\D/g, "");
    const grams = weightDigits(v("babyWeightGrams"));
    const selectedExit = v("exitOutcome");
    const riskFactors = f.getAll("riskFactor").map(String);
    const riskLabels = riskFactors.map((code) => {
      const [letter, idx] = code.split("|");
      const label = REG_RISK[letter]?.[Number(idx)];
      return label ? `${letter}: ${label}` : code;
    });
    const riskNote = v("riskNote");

    if (!/^[А-ЯЁӨҮ]{2}[0-9]{8}$/.test(registrationNumber)) {
      setError("Регистрийн дугаар 2 кирилл үсэг, 8 цифрээс бүрдэх ёстой.");
      return;
    }
    if (!/^\d{8}$/.test(appPhone)) {
      setError("Эхийн аппын утас 8 оронтой байх ёстой.");
      return;
    }
    if (appPassword.length < 8) {
      setError("Нууц үг хамгийн багадаа 8 тэмдэгттэй байна.");
      return;
    }
    if (appPassword !== appPasswordConfirm) {
      setError("Давтан оруулсан нууц үг таарахгүй байна.");
      return;
    }
    const lmpDays = daysBetween(lmp, today);
    if (lmpDays < 0 || lmpDays > 320) {
      setError("Сүүлийн сарын тэмдгийн огноог шалгана уу.");
      return;
    }
    if (selectedExit && !v("exitDate")) {
      setError("Хяналтаас гарсан огноог сонгоно уу.");
      return;
    }
    if (selectedExit && v("exitDate") > today) {
      setError("Ирээдүйн өдрөөр хяналтаас гарсан гэж бүртгэх боломжгүй.");
      return;
    }

    const isBorn = selectedExit === "term" || selectedExit === "preterm";
    const careExit = selectedExit
      ? {
          outcome: selectedExit,
          date: v("exitDate"),
          babyWeightGrams: isBorn ? grams : "",
          babyWeight: isBorn && grams ? (Number(grams) / 1000).toFixed(3) : "",
          babyLength: isBorn ? v("babyLength") : "",
          note: v("exitNote"),
          recordedBy: user?.name || "",
          recordedAt: new Date().toISOString(),
        }
      : {};

    setBusy(true);
    setError(null);
    try {
      const data = await api<{ patient: { code: string } }>("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          code: v("pid"),
          name: v("name"),
          registrationNumber,
          dob: v("dob") || null,
          address: v("address"),
          phone: v("phone"),
          emergencyPhone: v("emergencyPhone"),
          gender: v("gender"),
          lmp,
          dueOverride: v("dueOverride") || null,
          gravida: v("gravida"),
          para: v("para"),
          height: v("height"),
          weight: v("weight"),
          bp: v("bp"),
          blood: v("blood"),
          firstDate: v("firstDate") || today,
          history: v("history"),
          note: v("note"),
          previousOutcomes: f.getAll("previousOutcome").map(String),
          employment: {
            status: v("employmentStatus"),
            workplace: v("workplace"),
            jobTitle: v("jobTitle"),
            address: v("workAddress"),
            phone: v("workPhone"),
          },
          referDays: Number(v("referDays") || 3),
          refReason: v("refReason"),
          refAdvice: v("refAdvice"),
          appPhone,
          appPassword,
          careExit,
          riskNote,
          assessmentReason: [riskNote, riskLabels.join("; ")].filter(Boolean).join("\n"),
        }),
      });
      router.push(`/patients/${data.patient.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Хадгалж чадсангүй.");
      setBusy(false);
    }
  }

  if (user && user.role !== "clinic") {
    return (
      <StaffPage crumb="Эхийн бүртгэл">
        <div className="card pad">Эх бүртгэх эрхгүй.</div>
      </StaffPage>
    );
  }

  return (
    <StaffPage crumb="Шинэ эх">
      <Heading
        kicker="АНХНЫ ҮЗЛЭГ, БҮРТГЭЛ"
        title="Жирэмсэн эх шинээр бүртгэх"
        desc="Бүх мэдээллийг нэг хуудаст бөглөнө. Хадгалахад дүүргийн илгээх бүртгэл автоматаар үүснэ."
        actions={<Link className="ghost" href="/patients">← Буцах</Link>}
      />
      <form onSubmit={onSubmit}>
        <section className="card pad form-section">
          <h2 className="section-title"><span className="index">01</span> Эхийн хувийн мэдээлэл</h2>
          <div className="formgrid triple">
            <div className="field">
              <label>Эхийн овог, нэр *</label>
              <input name="name" required maxLength={90} placeholder="Демо · Д.Болор" />
            </div>
            <div className="field">
              <label>Бүртгэлийн код *</label>
              <input name="pid" required maxLength={30} placeholder="Жишээ: P004" />
            </div>
            <div className="field">
              <label>Регистрийн дугаар *</label>
              <input
                name="registrationNumber"
                required
                maxLength={10}
                minLength={10}
                pattern="[А-Яа-яЁёӨөҮү]{2}[0-9]{8}"
                title="Монгол регистрийн дугаар: хоёр кирилл үсэг, найман тоо"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="Жишээ: АБ12345678"
                onInput={onRegInput}
              />
              <span className="v16-input-hint">2 кирилл үсэг + 8 цифр. Зөвхөн эмчийн бүртгэлд хадгална.</span>
            </div>
            <div className="field">
              <label>Төрсөн огноо</label>
              <input name="dob" type="date" max={today} />
            </div>
            <div className="field">
              <label>Харьяа байгууллага *</label>
              <input name="clinic" required maxLength={160} defaultValue={user?.clinic || ""} placeholder="Байгууллагын нэрийг бичнэ" />
            </div>
            <div className="field">
              <label>Амьдарч буй хаяг (демо)</label>
              <input name="address" maxLength={160} placeholder="Жишээ: 8-р хороо" />
            </div>
            <div className="field">
              <label>Холбоо барих дугаар</label>
              <input name="phone" type="tel" inputMode="tel" maxLength={30} placeholder="Жишээ: 99112233" autoComplete="tel" />
            </div>
            <div className="field">
              <label>Яаралтай холбоо барих утас</label>
              <input
                name="emergencyPhone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{8}"
                title="8 оронтой утасны дугаар бичнэ үү"
                autoComplete="off"
                placeholder="Жишээ: 88112233"
                onInput={onEmergencyInput}
              />
            </div>
            <div className="field">
              <label>Хүүхдийн хүйс (батлагдсан бол)</label>
              <select name="gender" defaultValue="unknown">
                <option value="unknown">Тодорхойгүй</option>
                <option value="girl">Гүнж</option>
                <option value="boy">Ханхүү</option>
              </select>
            </div>
            <div className="v15-clinic-notice">
              Харьяа байгууллагын нэрийг бичиж өөрчилж болно. Харин энэ демод тухайн бүртгэлийн нэвтрэх эрх, хорооны код таны нэвтэрсэн байгууллагын эрхээр хэвээр хадгалагдана.
            </div>
            <div className="field">
              <label>Ажил эрхлэлтийн байдал</label>
              <select name="employmentStatus" defaultValue="">
                <option value="">— Сонгох —</option>
                <option value="employed">Ажил эрхэлдэг</option>
                <option value="self">Хувиараа хөдөлмөр эрхэлдэг</option>
                <option value="unemployed">Ажил эрхэлдэггүй</option>
                <option value="student">Суралцдаг</option>
                <option value="other">Бусад</option>
              </select>
            </div>
            <div className="field">
              <label>Ажлын газрын нэр</label>
              <input name="workplace" maxLength={160} placeholder="Байгууллага / компанийн нэр" />
            </div>
            <div className="field">
              <label>Албан тушаал, эрхэлдэг ажил</label>
              <input name="jobTitle" maxLength={120} placeholder="Жишээ: Нягтлан бодогч" />
            </div>
            <div className="field">
              <label>Ажлын газрын хаяг</label>
              <input name="workAddress" maxLength={180} placeholder="Дүүрэг, хороо, байршил" />
            </div>
            <div className="field">
              <label>Ажлын газрын холбоо барих утас</label>
              <input name="workPhone" maxLength={40} placeholder="Албаны утас (хэрэв байгаа бол)" />
            </div>
          </div>
        </section>

        <section className="card pad form-section">
          <h2 className="section-title"><span className="index">02</span> Жирэмсний анхан шатны мэдээлэл</h2>
          <div className="formgrid triple">
            <div className="field">
              <label>Сүүлийн сарын тэмдгийн эхний өдөр *</label>
              <input name="lmp" type="date" max={today} required />
            </div>
            <div className="field">
              <label>Эмчийн баталсан төрөх өдөр</label>
              <input name="dueOverride" type="date" />
            </div>
            <div className="field">
              <label>Өмнөх жирэмслэлтийн тоо</label>
              <input name="gravida" type="number" min={0} max={30} />
            </div>
            <div className="field">
              <label>Өмнөх төрөлтийн тоо</label>
              <input name="para" type="number" min={0} max={30} />
            </div>
            <div className="field">
              <label>Өндөр (см)</label>
              <input name="height" type="number" min={100} max={230} />
            </div>
            <div className="field">
              <label>Жин (кг)</label>
              <input name="weight" type="number" step={0.1} min={20} max={300} />
            </div>
            <div className="field">
              <label>АД (мм.муб)</label>
              <input name="bp" placeholder="Жишээ: 115/75" pattern="[0-9]{2,3}/[0-9]{2,3}" />
            </div>
            <div className="field">
              <label>Резус, цусны бүлэг (мэдэгдэж байвал)</label>
              <input name="blood" maxLength={40} />
            </div>
            <div className="field">
              <label>Анхны үзлэгийн өдөр</label>
              <input name="firstDate" type="date" defaultValue={today} max={today} />
            </div>
            <div className="field wide">
              <label>Өмнөх жирэмслэлтийн тухай</label>
              <span className="v15-small">Өмнөх жирэмслэлтүүдийн үр дүнг олон сонголтоор тэмдэглэж болно.</span>
              <div className="v15-checkgroup">
                {PREVIOUS_OUTCOMES.map(([value, label]) => (
                  <label className="v15-check" key={value}>
                    <input type="checkbox" name="previousOutcome" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="field wide">
              <label>Өмнөх өвчний болон эх барихын түүх</label>
              <textarea name="history" placeholder="Өмнөх жирэмслэлт, суурь өвчин, харшил, хэрэглэж буй эмийн талаар эмчийн тэмдэглэл" />
            </div>
            <div className="field wide">
              <label>Зовуурь, анхны үзлэгийн тэмдэглэл</label>
              <textarea name="note" placeholder="Үзлэгийн үеийн мэдээлэл, шаардлагатай асуумж" />
            </div>
          </div>
        </section>

        <section className="card pad form-section">
          <h2 className="section-title"><span className="index">03</span> Эрсдэлийн үнэлгээ</h2>
          <div className="mini-notice">Хавсралт 3 (хуудас 12–13) · Эмчийн дотоод мэдээлэл. Хуучин A/B/C ангиллаас тусдаа.</div>
          <div className="rg-risk-grids" style={{ marginTop: 16 }}>
            {Object.entries(REG_RISK).map(([letter, items]) => (
              <section key={letter}>
                <h3>{letter} бүлэг</h3>
                {items.map((q, i) => (
                  <label className="rg-risk-item" key={`${letter}-${i}`}>
                    <input type="checkbox" name="riskFactor" value={`${letter}|${i}`} />
                    <span>{q}</span>
                  </label>
                ))}
              </section>
            ))}
          </div>
          <label className="rg-field rg-full" style={{ marginTop: 16 }}>
            <span>Эрсдэлийн үнэлгээний тайлбар</span>
            <textarea name="riskNote" />
          </label>
        </section>

        <section className="card pad form-section">
          <h2 className="section-title"><span className="index">04</span> Дүүргийн эмнэлэгт илгээх</h2>
          <div className="formgrid">
            <div className="field">
              <label>Дүүрэгт очих хугацаа *</label>
              <select name="referDays" value={referDays} onChange={(e) => setReferDays(Number(e.target.value))}>
                <option value={3}>3 хоногийн дотор</option>
                <option value={5}>5 хоногийн дотор</option>
              </select>
              <small>Яаралтай тусламж шаардлагатай эхийг 3–5 хоног хүлээхийг зөвлөхгүй.</small>
            </div>
            <div className="field">
              <label>Товлосон эцсийн өдөр</label>
              <input readOnly value={shiftIso(today, referDays)} tabIndex={-1} />
            </div>
            <div className="field wide">
              <label>Илгээх шалтгаан *</label>
              <textarea name="refReason" required defaultValue="Анхны нарийн мэргэжлийн жирэмсний хяналтын үзлэг" />
            </div>
            <div className="field wide">
              <label>Эхэд харуулах илгээх заавар</label>
              <textarea name="refAdvice" defaultValue="Товлосон хугацаанд дүүргийн эмнэлэгт очиж нарийн мэргэжлийн үзлэгт хамрагдана уу. Хүнд зовуурь илэрвэл товлолтоо хүлээлгүй яаралтай эмчид хандаарай." />
            </div>
          </div>
        </section>

        <section className="card pad form-section">
          <h2 className="section-title"><span className="index">05</span> Хяналтаас гарсан тухай</h2>
          <p className="v15-form-intro">
            Анхны бүртгэлд эх хяналтад байгаа гэж хадгалагдана. Хяналтаас гарсан нөхцөл үүссэн үед доорх үр дүнг сонгох бөгөөд эхийн дэлгэрэнгүй картаас дараа нь мөн бүртгэж болно.
          </p>
          <div className="formgrid">
            <div className="field">
              <label>Хяналтын төлөв</label>
              <select name="exitOutcome" value={exitOutcome} onChange={(e) => setExitOutcome(e.target.value)}>
                <option value="">Хяналтад байгаа (гараагүй)</option>
                <option value="term">Гүйцэд</option>
                <option value="preterm">Дутуу</option>
                <option value="termination">Үр хөндсөн</option>
                <option value="miscarriage">Зулбсан</option>
              </select>
            </div>
            <div className="field">
              <label>Бүртгэсэн эмч</label>
              <input value={user?.name || ""} readOnly tabIndex={-1} />
            </div>
          </div>
          <div className={`v15-outcome-card ${exitOutcome ? "" : "v15-hidden"}`}>
            <div className="formgrid triple">
              <div className="field">
                <label>{born ? "Төрсөн өдөр" : "Үйл явдал болсон өдөр"} *</label>
                <input type="date" name="exitDate" max={today} required={Boolean(exitOutcome)} disabled={!exitOutcome} />
              </div>
              <div className={`field ${born ? "" : "v15-hidden"}`}>
                <label>Хүүхдийн жин (гр)</label>
                <input
                  type="text"
                  name="babyWeightGrams"
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Жишээ: 3,250"
                  disabled={!born}
                  onInput={onBabyWeightInput}
                  onBlur={onBabyWeightBlur}
                  onKeyDown={onBabyWeightKeyDown}
                />
                <span className="v16-input-hint">Граммаар бичнэ. Эхний цифрийн дараа таслал автоматаар гарна.</span>
              </div>
              <div className={`field ${born ? "" : "v15-hidden"}`}>
                <label>Хүүхдийн урт (см)</label>
                <input type="number" name="babyLength" min={15} max={75} step={0.1} placeholder="Жишээ: 50" disabled={!born} />
              </div>
              <div className="field wide">
                <label>{ended ? "Үйл явдлын тухай тайлбар" : "Хяналтаас гарсан тухай тайлбар"}</label>
                <textarea name="exitNote" maxLength={1200} placeholder="Эмчийн тайлбар, хяналтын тэмдэглэл" />
              </div>
            </div>
          </div>
        </section>

        <section className="card pad form-section">
          <h2 className="section-title"><span className="index">06</span> Эхийн аппын нэвтрэх эрх</h2>
          <p className="v18-section-note">
            Энэ эрхийг зөвхөн хорооны эмч үүсгэнэ. Эх апп дээр өөрөө бүртгүүлэхгүй, доорх дугаар болон анхны нууц үгээр нэвтэрнэ.
          </p>
          <div className="formgrid">
            <div className="field">
              <label>Аппд нэвтрэх утасны дугаар *</label>
              <input type="tel" name="appPhone" inputMode="numeric" maxLength={8} pattern="[0-9]{8}" autoComplete="off" required placeholder="Жишээ: 99112233" />
              <small>8 оронтой дугаар. Өөр эхтэй давхцахгүй.</small>
            </div>
            <div className="field">
              <label>Анхны нууц үг *</label>
              <div className="v18-password-wrap">
                <input type={showPass ? "text" : "password"} name="appPassword" minLength={8} maxLength={72} required autoComplete="new-password" placeholder="8 буюу түүнээс олон тэмдэгт" />
                <button type="button" className="v18-eye" onClick={() => setShowPass((s) => !s)} aria-label="Нууц үг харуулах">
                  {showPass ? "Нуух" : "Харах"}
                </button>
              </div>
            </div>
            <div className="field">
              <label>Нууц үг давтах *</label>
              <div className="v18-password-wrap">
                <input type={showPassConfirm ? "text" : "password"} name="appPasswordConfirm" minLength={8} maxLength={72} required autoComplete="new-password" placeholder="Нууц үгээ давтан бичих" />
                <button type="button" className="v18-eye" onClick={() => setShowPassConfirm((s) => !s)} aria-label="Нууц үг харуулах">
                  {showPassConfirm ? "Нуух" : "Харах"}
                </button>
              </div>
            </div>
          </div>
          <div className="v18-credential-hint">Нууц үгийг дараа нь эхэд аюулгүй сувгаар хүргэнэ.</div>
        </section>

        {error ? <div className="loginerr">{error}</div> : null}
        <div className="form-actions">
          <Link className="ghost" href="/patients">Болих</Link>
          <button className="primary" disabled={busy} type="submit">{busy ? "Хадгалж байна…" : "✓ Эх бүртгэж хадгалах"}</button>
        </div>
      </form>
    </StaffPage>
  );
}
