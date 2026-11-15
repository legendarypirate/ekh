const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const {
  Patient,
  Clinic,
  Visit,
  Medication,
  Appointment,
  Measurement,
  Symptom,
  KickLog,
  MomTask,
  Referral,
  ReferralFollowup,
  Question,
  TransferRequest,
  writeAudit,
} = require("../models");
const { asyncHandler, HttpError } = require("../utils/http");
const { authRequired, roles, clinicScope, patientWhere } = require("../middleware/auth");
const { publicPatient } = require("../utils/serialize");
const { today, shift } = require("../utils/dates");

const router = Router();
router.use(authRequired);

const DETAIL_INCLUDE = [
  { model: Clinic, as: "clinic" },
  { model: Visit, as: "visits" },
  { model: Medication, as: "medications" },
  { model: Appointment, as: "appointments" },
  { model: Measurement, as: "measurements" },
  { model: Symptom, as: "symptoms" },
  { model: KickLog, as: "kicks" },
  { model: MomTask, as: "tasks" },
  { model: Referral, as: "referrals", include: [{ model: ReferralFollowup, as: "followups" }] },
  { model: Question, as: "questions" },
  { model: TransferRequest, as: "transferRequests" },
];

async function loadPatient(req) {
  const key = req.params.id;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  const patient = await Patient.findOne({
    where: uuid ? { [Op.or]: [{ id: key }, { code: key }] } : { code: key },
    include: DETAIL_INCLUDE,
  });
  if (!patient || !clinicScope(req.user, patient)) throw new HttpError(404, "Эх олдсонгүй.");
  return patient;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim().toLowerCase();
    const where = patientWhere(req.user);
    const patients = await Patient.findAll({
      where,
      include: [
        { model: Clinic, as: "clinic" },
        { model: Referral, as: "referrals" },
        { model: Appointment, as: "appointments" },
      ],
      order: [["code", "ASC"]],
    });
    const filtered = q
      ? patients.filter((p) => [p.name, p.code, p.registrationNumber, p.phone, p.appPhone].join(" ").toLowerCase().includes(q))
      : patients;
    res.json({ patients: filtered.map((p) => publicPatient(p)) });
  })
);

router.post(
  "/",
  roles("clinic"),
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const code = String(b.code || b.pid || "").trim();
    const name = String(b.name || "").trim();
    const lmp = String(b.lmp || "");
    const registrationNumber = String(b.registrationNumber || "").toUpperCase().replace(/\s+/g, "");
    const appPhone = String(b.appPhone || "").replace(/\D/g, "");
    const appPassword = String(b.appPassword || "");
    if (!code || !name || !lmp) throw new HttpError(400, "Код, нэр, ССТ огноо заавал.");
    if (!registrationNumber) throw new HttpError(400, "Регистрийн дугаар заавал.");
    if (!/^[А-ЯЁӨҮ]{2}[0-9]{8}$/.test(registrationNumber)) {
      throw new HttpError(400, "Регистрийн дугаар 2 кирилл үсэг, 8 цифрээс бүрдэх ёстой.");
    }
    if (!/^\d{8}$/.test(appPhone)) throw new HttpError(400, "Эхийн аппын утас 8 оронтой байх ёстой.");
    if (appPassword.length < 8) throw new HttpError(400, "Нууц үг хамгийн багадаа 8 тэмдэгттэй байна.");
    if (await Patient.findOne({ where: { code } })) throw new HttpError(409, "Энэ код аль хэдийн бүртгэлтэй байна.");
    if (await Patient.findOne({ where: { registrationNumber } })) {
      throw new HttpError(409, "Энэ регистрийн дугаар аль хэдийн бүртгэлтэй байна.");
    }
    if (await Patient.findOne({ where: { appPhone } })) {
      throw new HttpError(409, "Энэ утасны дугаар өөр эхийн аппын эрхэд бүртгэлтэй байна.");
    }

    const previousOutcomes = Array.isArray(b.previousOutcomes)
      ? b.previousOutcomes
      : [].concat(b.previousOutcome || []).filter(Boolean);
    const employment =
      b.employment && typeof b.employment === "object"
        ? b.employment
        : {
            status: b.employmentStatus || "",
            workplace: b.workplace || "",
            jobTitle: b.jobTitle || "",
            address: b.workAddress || "",
            phone: b.workPhone || "",
          };
    const grams = String(b.babyWeightGrams || b.careExit?.babyWeightGrams || "").replace(/\D/g, "").slice(0, 4);
    const exitOutcome = String(b.careExit?.outcome || b.exitOutcome || "");
    const born = ["term", "preterm"].includes(exitOutcome);
    const careExit = exitOutcome
      ? {
          outcome: exitOutcome,
          date: b.careExit?.date || b.exitDate || "",
          babyWeightGrams: born ? grams : "",
          babyWeight: born && grams ? (Number(grams) / 1000).toFixed(3) : "",
          babyLength: born ? String(b.careExit?.babyLength || b.babyLength || "") : "",
          note: String(b.careExit?.note || b.exitNote || "").trim(),
          recordedBy: req.user.name,
          recordedAt: new Date().toISOString(),
        }
      : b.careExit && typeof b.careExit === "object"
        ? b.careExit
        : {};

    const patient = await Patient.create({
      code,
      name,
      registrationNumber,
      phone: String(b.phone || appPhone),
      appPhone,
      appPasswordHash: await bcrypt.hash(appPassword, 10),
      emergencyPhone: String(b.emergencyPhone || "").replace(/\D/g, "").slice(0, 8) || null,
      dob: b.dob || null,
      address: b.address || "",
      lmp,
      dueOverride: b.dueOverride || null,
      gender: ["girl", "boy"].includes(b.gender) ? b.gender : "unknown",
      height: b.height || "",
      history: b.history || "",
      blood: b.blood || "",
      gravida: b.gravida || "",
      para: b.para || "",
      previousOutcomes,
      employment,
      assessment: b.assessment || "",
      assessmentReason: b.riskNote || b.assessmentReason || "",
      doctor: "Хорооны хяналтын эмч",
      clinicId: req.user.clinicId,
      districtId: req.user.districtId,
      careExit,
      registeredAt: today(),
    });

    await Visit.create({
      patientId: patient.id,
      date: b.firstDate || today(),
      title: "Хорооны анхны хяналтын үзлэг",
      provider: "clinic",
      bp: b.bp || "",
      weight: b.weight || "",
      note: b.note || "",
      advice: b.refAdvice || "",
      author: req.user.name,
    });

    if (!b.careExit?.outcome) {
      await Referral.create({
        patientId: patient.id,
        createdOn: today(),
        dueDate: shift(today(), Number(b.referDays || 3)),
        status: "pending",
        reason: b.refReason || "Анхны нарийн мэргэжлийн үзлэг",
        createdBy: req.user.name,
      });
    }

    await writeAudit(req.user.name, "Эх бүртгэв", patient.id);
    const created = await Patient.findByPk(patient.id, { include: DETAIL_INCLUDE });
    res.status(201).json({ patient: publicPatient(created) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    res.json({ patient: publicPatient(patient) });
  })
);

router.patch(
  "/:id",
  roles("clinic", "district", "mom"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const allowedMom = ["gender", "measurements", "protocolTasks"];
    const b = req.body || {};
    if (req.user.role === "mom") {
      if (b.gender) patient.gender = b.gender;
      if (b.protocolTasks) patient.protocolTasks = b.protocolTasks;
    } else {
      const fields = [
        "name",
        "phone",
        "emergencyPhone",
        "dob",
        "address",
        "lmp",
        "dueOverride",
        "gender",
        "height",
        "history",
        "blood",
        "gravida",
        "para",
        "previousOutcomes",
        "employment",
        "assessment",
        "assessmentReason",
        "careExit",
        "protocolTasks",
        "doctor",
      ];
      for (const f of fields) {
        if (b[f] !== undefined) patient[f] = b[f];
      }
      if (b.careExit?.outcome) {
        const pending = await Referral.findAll({ where: { patientId: patient.id, status: "pending" } });
        for (const r of pending) {
          r.status = "closed";
          r.closedAt = b.careExit.date || today();
          r.closedReason = "Хяналтаас гарсан";
          await r.save();
        }
      }
    }
    void allowedMom;
    await patient.save();
    await writeAudit(req.user.name, "Эхийн мэдээлэл шинэчлэгдэв", patient.id);
    const updated = await Patient.findByPk(patient.id, { include: DETAIL_INCLUDE });
    res.json({ patient: publicPatient(updated) });
  })
);

router.post(
  "/:id/visits",
  roles("district", "clinic"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const b = req.body || {};
    if (!b.date || !b.title || !b.note) throw new HttpError(400, "Үзлэгийн огноо, нэр, тэмдэглэл заавал.");
    const visit = await Visit.create({
      patientId: patient.id,
      date: b.date,
      title: b.title,
      provider: req.user.role === "district" ? "district" : "clinic",
      bp: b.bp || "",
      weight: b.weight || "",
      fhr: b.fhr || "",
      note: b.note,
      advice: b.advice || "",
      tests: b.tests || "",
      privateNote: b.privateNote || "",
      author: req.user.name,
      protocolIndex: b.protocolIndex ?? null,
    });
    const meds = Array.isArray(b.medications) ? b.medications : [];
    const createdMeds = [];
    for (const m of meds) {
      if (!m?.name) continue;
      createdMeds.push(
        await Medication.create({
          patientId: patient.id,
          visitId: visit.id,
          visitTitle: visit.title,
          name: m.name,
          strength: m.strength || "",
          dose: m.dose || "",
          frequency: m.frequency || "",
          duration: m.duration || "",
          startDate: visit.date,
          instructions: m.instructions || m.duration || "",
          author: req.user.name,
        })
      );
    }
    if (createdMeds.length) {
      visit.meds = createdMeds.map((m) => m.name).join(", ");
      await visit.save();
    }
    if (req.user.role === "district") {
      const open = await Referral.findAll({ where: { patientId: patient.id, status: { [Op.ne]: "completed" } } });
      for (const r of open) {
        r.status = "completed";
        r.completedAt = visit.date;
        r.completedBy = req.user.name;
        await r.save();
      }
    }
    if (b.nextDate) {
      if (b.nextDate < today()) throw new HttpError(400, "Өнгөрсөн өдөрт үзлэг товлох боломжгүй.");
      await Appointment.create({
        patientId: patient.id,
        date: b.nextDate,
        time: b.nextTime || "10:00",
        title: b.nextTitle || "Дүүргийн дараагийн хяналт",
        place: b.nextPlace || "Дүүргийн эмнэлэг",
        provider: "district",
        status: "planned",
      });
    }
    await writeAudit(req.user.name, "Үзлэг бүртгэв", patient.id);
    res.status(201).json({ visit, medications: createdMeds });
  })
);

router.patch(
  "/:id/visits/:visitId",
  roles("mom", "clinic", "district"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const visit = await Visit.findOne({ where: { id: req.params.visitId, patientId: patient.id } });
    if (!visit) throw new HttpError(404, "Үзлэг олдсонгүй.");
    if (req.user.role === "mom") {
      visit.ack = true;
    } else {
      for (const f of ["title", "bp", "weight", "fhr", "note", "advice", "tests", "ack"]) {
        if (req.body[f] !== undefined) visit[f] = req.body[f];
      }
    }
    await visit.save();
    res.json({ visit });
  })
);

router.post(
  "/:id/appointments",
  roles("district", "clinic"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const b = req.body || {};
    if (!b.date || !b.title) throw new HttpError(400, "Огноо, нэр заавал.");
    const appointment = await Appointment.create({
      patientId: patient.id,
      date: b.date,
      time: b.time || "10:00",
      title: b.title,
      place: b.place || "",
      provider: req.user.role === "district" ? "district" : "clinic",
      status: "planned",
    });
    await writeAudit(req.user.name, "Үзлэгийн тов хадгалав", patient.id);
    res.status(201).json({ appointment });
  })
);

router.post(
  "/:id/referrals",
  roles("clinic"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const days = Number(req.body.days || 3);
    const referral = await Referral.create({
      patientId: patient.id,
      createdOn: today(),
      dueDate: shift(today(), days),
      status: "pending",
      reason: req.body.reason || "",
      createdBy: req.user.name,
    });
    await writeAudit(req.user.name, "Дүүрэгт дахин илгээв", patient.id);
    res.status(201).json({ referral });
  })
);

router.post(
  "/:id/referrals/:referralId/followups",
  roles("clinic"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const referral = await Referral.findOne({ where: { id: req.params.referralId, patientId: patient.id } });
    if (!referral) throw new HttpError(404, "Илгээх бичиг олдсонгүй.");
    if (!req.body.note) throw new HttpError(400, "Тэмдэглэл заавал.");
    const followup = await ReferralFollowup.create({
      referralId: referral.id,
      date: today(),
      note: req.body.note,
      actor: req.user.name,
    });
    await writeAudit(req.user.name, "Илгээх бичгийн эргэн хяналт тэмдэглэв", patient.id);
    res.status(201).json({ followup });
  })
);

router.post(
  "/:id/referrals/:referralId/mother-visit",
  roles("mom"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const referral = await Referral.findOne({ where: { id: req.params.referralId, patientId: patient.id } });
    if (!referral) throw new HttpError(404, "Илгээх бичиг олдсонгүй.");
    referral.motherVisitReportedAt = new Date();
    await referral.save();
    res.json({ referral });
  })
);

router.post(
  "/:id/questions",
  roles("mom"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const text = String(req.body.text || "").trim();
    if (text.length < 5) throw new HttpError(400, "Асуулт хэт богино байна.");
    const question = await Question.create({
      patientId: patient.id,
      category: req.body.category || "Бусад",
      text,
      status: "new",
    });
    res.status(201).json({ question });
  })
);

router.post(
  "/:id/questions/:questionId/reply",
  roles("clinic"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const question = await Question.findOne({ where: { id: req.params.questionId, patientId: patient.id } });
    if (!question) throw new HttpError(404, "Асуулт олдсонгүй.");
    const reply = String(req.body.reply || "").trim();
    if (reply.length < 5 || reply.length > 2400) throw new HttpError(400, "Хариулт 5–2400 тэмдэгттэй байна.");
    question.reply = reply;
    question.repliedAt = new Date();
    question.repliedBy = req.user.name;
    question.status = "answered";
    question.seenAt = null;
    await question.save();
    await writeAudit(req.user.name, "Эхийн асуултад хариулсан", patient.id);
    res.json({ question });
  })
);

router.post(
  "/:id/questions/:questionId/seen",
  roles("mom"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const question = await Question.findOne({ where: { id: req.params.questionId, patientId: patient.id } });
    if (!question) throw new HttpError(404, "Асуулт олдсонгүй.");
    question.seenAt = new Date();
    await question.save();
    res.json({ question });
  })
);

async function addJournal(model, req, res, extra) {
  const patient = await loadPatient(req);
  const row = await model.create({ patientId: patient.id, ...extra(req.body || {}) });
  res.status(201).json({ item: row });
}

router.post("/:id/measurements", roles("mom", "clinic"), asyncHandler((req, res) =>
  addJournal(Measurement, req, res, (b) => ({ date: b.date || today(), bp: b.bp || "", weight: b.weight || "", note: b.note || "" }))
));
router.post("/:id/symptoms", roles("mom"), asyncHandler((req, res) =>
  addJournal(Symptom, req, res, (b) => {
    if (!b.mood) throw new HttpError(400, "Мэдрэмж сонгоно уу.");
    return { date: b.date || today(), mood: b.mood, note: b.note || "" };
  })
));
router.post("/:id/kicks", roles("mom"), asyncHandler((req, res) =>
  addJournal(KickLog, req, res, (b) => ({
    date: b.date || today(),
    time: b.time || "12:00",
    count: Number(b.count || 0),
    note: b.note || "",
  }))
));
router.post("/:id/tasks", roles("mom", "clinic"), asyncHandler((req, res) =>
  addJournal(MomTask, req, res, (b) => {
    if (!b.label) throw new HttpError(400, "Даалгаврын нэр заавал.");
    return { label: b.label, done: Boolean(b.done) };
  })
));
router.patch(
  "/:id/tasks/:taskId",
  roles("mom", "clinic"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const task = await MomTask.findOne({ where: { id: req.params.taskId, patientId: patient.id } });
    if (!task) throw new HttpError(404, "Даалгавар олдсонгүй.");
    if (req.body.done != null) task.done = Boolean(req.body.done);
    if (req.body.label) task.label = req.body.label;
    await task.save();
    res.json({ task });
  })
);

router.get(
  "/:id/transfers",
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    res.json({ transfers: patient.transferRequests || [] });
  })
);

router.post(
  "/:id/transfers",
  roles("mom"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const b = req.body || {};
    const transfer = await TransferRequest.create({
      patientId: patient.id,
      createdOn: today(),
      status: "pending",
      reason: b.reason || "",
      region: b.region || "",
      localUnit: b.localUnit || "",
      wardBag: b.wardBag || "",
      address: b.address || "",
      targetClinic: b.targetClinic || "",
      moveDate: b.moveDate || null,
      toClinicId: b.toClinicId || null,
      toDistrictId: b.toDistrictId || patient.districtId,
    });
    res.status(201).json({ transfer });
  })
);

router.patch(
  "/:id/transfers/:transferId",
  roles("clinic"),
  asyncHandler(async (req, res) => {
    const patient = await loadPatient(req);
    const transfer = await TransferRequest.findOne({ where: { id: req.params.transferId, patientId: patient.id } });
    if (!transfer) throw new HttpError(404, "Хүсэлт олдсонгүй.");
    const decision = req.body.decision || req.body.status;
    transfer.reviewNote = req.body.note || transfer.reviewNote;
    transfer.reviewedAt = today();
    transfer.reviewedBy = req.user.name;
    if (decision === "forward") {
      transfer.status = transfer.toClinicId && transfer.toDistrictId === req.user.districtId ? "forwarded" : "forwarded_external";
    } else if (decision === "accept") {
      if (transfer.toClinicId !== req.user.clinicId) throw new HttpError(403, "Энэ хүсэлтийг хүлээн авах эрхгүй.");
      transfer.status = "completed";
      transfer.completedAt = today();
      transfer.completedBy = req.user.name;
      patient.clinicId = req.user.clinicId;
      patient.districtId = req.user.districtId;
      await patient.save();
    } else if (["needs_info", "rejected"].includes(decision)) {
      transfer.status = decision;
    }
    await transfer.save();
    await writeAudit(req.user.name, `Шилжилтийн хүсэлт: ${transfer.status}`, patient.id);
    res.json({ transfer });
  })
);

module.exports = router;
