import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Нууцлалын бодлого · ЭнхЭх",
  description: "ЭнхЭх эхийн апп болон эмчийн системийн нууцлалын бодлого",
  robots: "index,follow",
};

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <header className="legal-top">
        <div>
          <div className="kicker">ЭНХЭХ</div>
          <strong>Нууцлалын бодлого</strong>
          <small>Privacy Policy</small>
        </div>
        <Link className="ghost" href="/login">
          Нэвтрэх
        </Link>
      </header>

      <article className="legal-card">
        <p className="legal-updated">Сүүлд шинэчилсэн: 2026 оны 11-р сарын 14 · Last updated: 14 November 2026</p>
        <h1>ЭнхЭх — Нууцлалын бодлого</h1>
        <p>
          Энэхүү бодлого нь <b>ЭнхЭх</b> эхийн гар утасны апп (Google Play) болон эмчийн web admin системд хамаарна.
          ЭнхЭх нь жирэмсний хяналтын мэдээллийг хороо, дүүргийн эмч, эхэд харуулах зориулалттай.
        </p>

        <h2>1. Цуглуулдаг мэдээлэл</h2>
        <p>Бид дараах мэдээллийг цуглуулж, сервер дээр хадгална:</p>
        <ul>
          <li>
            <b>Нэвтрэх мэдээлэл:</b> эхийн утасны дугаар, нууц үг (нууц үгийг нэг чиглэлтэй шифрлэн хадгална); эмчийн нэвтрэх нэр, нууц үг.
          </li>
          <li>
            <b>Эхийн бүртгэл:</b> нэр, бүртгэлийн код, холбоо барих утас, харьяа хороо, жирэмсний хугацааны мэдээлэл (ССТ, төрөх өдөр), хүүхдийн хүйс.
          </li>
          <li>
            <b>Эрүүл мэндийн хяналт:</b> үзлэгийн тэмдэглэл, эм, товлолт, илгээх бичиг, даралт/жин, мэдрэмж, ургийн хөдөлгөөн, асуулт хариулт, протоколын тэмдэглэл.
          </li>
          <li>
            <b>Техникийн мэдээлэл:</b> нэвтрэлтийн токен, үйлдлийн бүртгэл (хэн, хэзээ мэдээлэл шинэчилсэн).
          </li>
        </ul>
        <p>Эхийн аппд бүртгэл өөрөө үүсгэхгүй. Бүртгэлийг харьяа хорооны эмч үүсгэнэ.</p>

        <h2>2. Хэрхэн ашиглах вэ</h2>
        <ul>
          <li>Жирэмсний хяналт, үзлэг, товлолт, зөвлөгөө өгөх</li>
          <li>Эхийг апп руу нэвтрүүлж өөрийн картыг харуулах</li>
          <li>Хороо болон дүүргийн эмчийн хамтын ажиллагаа (илгээх бичиг, үзлэг)</li>
          <li>Системийн аюулгүй байдал, алдаа засах</li>
        </ul>
        <p>Бид зар сурталчилгааны зорилгоор мэдээлэл ашиглахгүй, зар сурталчилгааны ID цуглуулахгүй.</p>

        <h2>3. Хэнтэй хуваалцах вэ</h2>
        <ul>
          <li>
            <b>Харьяа эмнэлгийн ажилтан:</b> хорооны эмч, хариуцсан дүүргийн эмч зөвхөн өөрийн хамрах эхийн мэдээллийг харна.
          </li>
          <li>
            <b>Хостинг / мэдээллийн сан:</b> аппын сервер, өгөгдлийн санг ажиллуулах техникийн орчин.
          </li>
        </ul>
        <p>Бид эхийн эрүүл мэндийн мэдээллийг зарж борлуулахгүй. Хуулийн шаардлагаар эрх бүхий байгууллагаас хүсэлт ирвэл хуульд заасны дагуу гаргаж болно.</p>

        <h2>4. Хадгалалт, аюулгүй байдал</h2>
        <p>
          Мэдээллийг нэвтрэх эрхээр хамгаалсан сервер дээр хадгална. Нууц үгийг нөхөн сэргээх боломжгүй байдлаар (hash)
          хадгална. Холболтод нэвтрэх токен ашиглана. Гэсэн хэдий ч интернетийн аль ч систем 100% эрсдэлгүй биш.
        </p>

        <h2>5. Таны эрх</h2>
        <ul>
          <li>Апп дотор өөрийн харагдах мэдээлэл, тэмдэглэлийг харах</li>
          <li>Хүүхдийн хүйс зэрэг аппаас зөвшөөрсөн талбарыг шинэчлэх</li>
          <li>Нэр, ССТ зэрэг эмчийн бүртгэлийг харьяа хорооны эмчээр засуулах</li>
          <li>Мэдээлэл засах, устгах хүсэлтийг харьяа хорооны эмч эсвэл доорх холбоогоор илгээх</li>
        </ul>
        <p>Гарах товчоор төхөөрөмж дээрх нэвтрэх токен устна. Сервер дээрх бүртгэлийг эмнэлэг хадгалсаар байж болно.</p>

        <h2>6. Хүүхэд</h2>
        <p>
          ЭнхЭх нь 13-аас доош насны хүүхдэд зориулагдаагүй. Бид хүүхдээс санаатайгаар мэдээлэл цуглуулдаггүй.
          Жирэмсний хяналтын хэрэглэгч нь насанд хүрсэн эх болон эмнэлгийн ажилтан байна.
        </p>

        <h2>7. Холбоо барих</h2>
        <p>
          Нууцлал, мэдээлэл устгах, нэвтрэх эрхтэй холбоотой хүсэлтээ <b>харьяа хорооны эмчээр</b> дамжуулан эсвэл
          ЭнхЭх системийн удирдлагад илгээнэ үү.
        </p>
        <p>
          ЭнхЭх · Жирэмсний хяналтын систем
          <br />
          Нууцлалын бодлого: энэ хуудас
        </p>

        <hr />

        <h1>Enkhekh — Privacy Policy</h1>
        <p>
          This policy applies to the <b>Enkhekh</b> mother mobile app (Google Play) and the clinician web admin.
          Enkhekh is a pregnancy-care record used by khoroo (family clinic) staff, district doctors, and the mother.
        </p>

        <h2>1. Information we collect</h2>
        <ul>
          <li>
            <b>Account data:</b> mother phone number and password (stored as a one-way hash); staff username and password.
          </li>
          <li>
            <b>Mother profile:</b> name, patient code, contact phone, clinic, pregnancy dates (LMP / due date), fetal sex if entered.
          </li>
          <li>
            <b>Health and care data:</b> visit notes, medications, appointments, referrals, blood pressure/weight, mood, fetal movement logs, questions and doctor replies, protocol checklists.
          </li>
          <li>
            <b>Technical data:</b> login tokens and audit logs of staff actions.
          </li>
        </ul>
        <p>Mothers cannot self-register. A clinic clinician creates the account.</p>

        <h2>2. How we use information</h2>
        <ul>
          <li>To provide antenatal follow-up, visits, reminders, and advice</li>
          <li>To let the mother view her own record in the app</li>
          <li>To coordinate care between khoroo and district clinicians</li>
          <li>To keep the service secure and fix errors</li>
        </ul>
        <p>We do not use this data for advertising and we do not collect advertising IDs.</p>

        <h2>3. Sharing</h2>
        <ul>
          <li>
            <b>Care team:</b> the assigned khoroo clinician and district doctor can see mothers in their scope.
          </li>
          <li>
            <b>Infrastructure:</b> hosting and database providers that run the Enkhekh servers.
          </li>
        </ul>
        <p>
          We do not sell health data. We may disclose information if required by applicable law.
        </p>

        <h2>4. Storage and security</h2>
        <p>
          Data is stored on access-controlled servers. Passwords are hashed. Sessions use login tokens. No internet
          service can be guaranteed 100% secure.
        </p>

        <h2>5. Your choices</h2>
        <ul>
          <li>View your record in the app</li>
          <li>Update fields the app allows (for example fetal sex / theme)</li>
          <li>Ask your khoroo clinician to correct name, LMP, or other clinical fields</li>
          <li>Request correction or deletion through your clinic or Enkhekh operators</li>
        </ul>
        <p>Logging out removes the token on the device. The clinic may still keep the medical record on the server.</p>

        <h2>6. Children</h2>
        <p>
          Enkhekh is not directed at children under 13. We do not knowingly collect data from children. Intended users
          are adult pregnant women and clinical staff.
        </p>

        <h2>7. Contact</h2>
        <p>
          For privacy or deletion requests, contact your assigned khoroo clinician or Enkhekh system operators.
        </p>
      </article>
    </div>
  );
}
