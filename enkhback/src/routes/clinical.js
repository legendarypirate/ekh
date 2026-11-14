const { Router } = require("express");
const { Op } = require("sequelize");
const { Patient, Referral, Appointment, Question, TransferRequest, ReferralFollowup } = require("../models");
const { asyncHandler } = require("../utils/http");
const { authRequired, roles, patientWhere } = require("../middleware/auth");
const { publicPatient } = require("../utils/serialize");
const { today } = require("../utils/dates");

const staff = [authRequired, roles("clinic", "district", "superadmin")];
const router = Router();

router.get(
  "/referrals",
  ...staff,
  asyncHandler(async (req, res) => {
    const filter = req.query.status || "all";
    const patients = await Patient.findAll({
      where: patientWhere(req.user),
      include: [{ model: Referral, as: "referrals", include: [{ model: ReferralFollowup, as: "followups" }] }],
    });
    const rows = [];
    for (const p of patients) {
      for (const r of p.referrals || []) {
        let status = r.status;
        if (status === "pending" && r.dueDate < today()) status = "overdue";
        if (filter !== "all" && status !== filter && !(filter === "pending" && r.status === "pending")) continue;
        rows.push({ patient: publicPatient(p), referral: r, status });
      }
    }
    rows.sort((a, b) => String(b.referral.createdOn).localeCompare(String(a.referral.createdOn)));
    res.json({ referrals: rows });
  })
);

router.get(
  "/questions",
  authRequired,
  roles("clinic"),
  asyncHandler(async (req, res) => {
    const filter = req.query.status || "all";
    const where = {};
    if (filter === "new") where.status = "new";
    if (filter === "answered") where.status = "answered";
    const questions = await Question.findAll({
      where,
      include: [{ model: Patient, required: true, where: { clinicId: req.user.clinicId } }],
      order: [["createdAt", "DESC"]],
    });
    res.json({
      questions: questions.map((q) => ({
        ...q.toJSON(),
        patient: publicPatient(q.Patient),
      })),
    });
  })
);

router.get(
  "/schedule",
  ...staff,
  asyncHandler(async (req, res) => {
    const month = req.query.month || today().slice(0, 7);
    const start = `${month}-01`;
    const endMonth = new Date(`${start}T12:00:00`);
    endMonth.setMonth(endMonth.getMonth() + 1);
    const end = `${endMonth.getFullYear()}-${String(endMonth.getMonth() + 1).padStart(2, "0")}-01`;
    const appointments = await Appointment.findAll({
      where: { date: { [Op.gte]: start, [Op.lt]: end } },
      include: [{ model: Patient, required: true, where: patientWhere(req.user) }],
      order: [["date", "ASC"], ["time", "ASC"]],
    });
    res.json({
      month,
      appointments: appointments.map((a) => ({
        ...a.toJSON(),
        patient: publicPatient(a.Patient),
      })),
    });
  })
);

router.get(
  "/transfers",
  authRequired,
  roles("clinic"),
  asyncHandler(async (req, res) => {
    const outgoing = await TransferRequest.findAll({
      include: [{ model: Patient, required: true, where: { clinicId: req.user.clinicId } }],
      order: [["createdOn", "DESC"]],
    });
    const incoming = await TransferRequest.findAll({
      where: { toClinicId: req.user.clinicId, status: "forwarded" },
      include: [{ model: Patient, required: true }],
      order: [["createdOn", "DESC"]],
    });
    res.json({
      outgoing: outgoing.map((t) => ({ ...t.toJSON(), patient: publicPatient(t.Patient) })),
      incoming: incoming.map((t) => ({ ...t.toJSON(), patient: publicPatient(t.Patient) })),
    });
  })
);

module.exports = router;
