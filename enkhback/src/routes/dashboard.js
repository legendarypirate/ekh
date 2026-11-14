const { Router } = require("express");
const { Op } = require("sequelize");
const { Patient, Clinic, Referral, Appointment, Question, TransferRequest } = require("../models");
const { asyncHandler } = require("../utils/http");
const { authRequired, roles, patientWhere } = require("../middleware/auth");
const { today } = require("../utils/dates");
const { publicPatient } = require("../utils/serialize");

const router = Router();
router.use(authRequired, roles("clinic", "district", "superadmin"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
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
    const pending = [];
    const completed = [];
    for (const p of patients) {
      for (const r of p.referrals || []) {
        const row = { patient: publicPatient(p), referral: r };
        if (r.status === "pending") pending.push(row);
        if (r.status === "completed") completed.push(row);
      }
    }
    pending.sort((a, b) => String(a.referral.dueDate).localeCompare(String(b.referral.dueDate)));
    const overdue = pending.filter((x) => x.referral.dueDate < today()).length;
    const upcoming = patients.flatMap((p) => p.appointments || []).filter((a) => a.status === "planned" && a.date >= today()).length;
    const qWhere = { status: "new" };
    const newQuestions =
      req.user.role === "clinic"
        ? await Question.count({
            include: [{ model: Patient, required: true, where: { clinicId: req.user.clinicId } }],
            where: qWhere,
          })
        : 0;
    const pendingTransfers =
      req.user.role === "clinic"
        ? await TransferRequest.count({
            include: [{ model: Patient, required: true, where: { clinicId: req.user.clinicId } }],
            where: { status: { [Op.in]: ["pending", "forwarded"] } },
          })
        : 0;

    res.json({
      totals: {
        patients: patients.length,
        pendingReferrals: pending.length,
        overdue,
        completedReferrals: completed.length,
        upcomingAppointments: upcoming,
        newQuestions,
        pendingTransfers,
      },
      urgent: pending.slice(0, 8),
    });
  })
);

module.exports = router;
