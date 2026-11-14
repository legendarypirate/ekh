const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { Account, Patient } = require("../models");
const { asyncHandler, HttpError } = require("../utils/http");
const {
  signToken,
  authRequired,
  loadStaffSession,
  loadMomSession,
  findStaff,
  findMomByPhone,
} = require("../middleware/auth");

const router = Router();

router.post(
  "/staff/login",
  asyncHandler(async (req, res) => {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const account = await findStaff(username);
    if (!account || !account.active) throw new HttpError(401, "Нэвтрэх нэр эсвэл нууц үг буруу байна.");
    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) throw new HttpError(401, "Нэвтрэх нэр эсвэл нууц үг буруу байна.");
    const session = await loadStaffSession(account);
    if (!session) throw new HttpError(403, "Энэ эрх идэвхгүй байна.");
    res.json({ token: signToken(session), user: session });
  })
);

router.post(
  "/mom/login",
  asyncHandler(async (req, res) => {
    const phone = String(req.body.phone || "").replace(/\D/g, "");
    const password = String(req.body.password || "");
    if (!/^\d{8}$/.test(phone)) throw new HttpError(400, "Утасны дугаар 8 оронтой байна.");
    const patient = await findMomByPhone(phone);
    if (!patient?.appPasswordHash) throw new HttpError(401, "Утасны дугаар эсвэл нууц үг буруу байна.");
    const ok = await bcrypt.compare(password, patient.appPasswordHash);
    if (!ok) throw new HttpError(401, "Утасны дугаар эсвэл нууц үг буруу байна.");
    const session = await loadMomSession(patient);
    res.json({ token: signToken(session), user: session });
  })
);

router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    if (req.user.role === "mom") {
      const patient = await Patient.findByPk(req.user.patientId);
      if (!patient) throw new HttpError(401, "Холболт хүчингүй.");
      return res.json({ user: await loadMomSession(patient) });
    }
    const account = await Account.findByPk(req.user.id);
    if (!account) throw new HttpError(401, "Холболт хүчингүй.");
    const session = await loadStaffSession(account);
    if (!session) throw new HttpError(403, "Энэ эрх идэвхгүй байна.");
    res.json({ user: session });
  })
);

module.exports = router;
