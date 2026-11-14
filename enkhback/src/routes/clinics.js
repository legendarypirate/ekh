const { Router } = require("express");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { Clinic, Account, Patient, AuditLog } = require("../models");
const { asyncHandler, HttpError } = require("../utils/http");
const { authRequired, roles } = require("../middleware/auth");
const { publicAccount } = require("../utils/serialize");

const router = Router();
router.use(authRequired);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const clinics = await Clinic.findAll({ order: [["ward", "ASC"]] });
    res.json({ clinics });
  })
);

router.post(
  "/",
  roles("superadmin"),
  asyncHandler(async (req, res) => {
    const districtId = String(req.body.districtId || "").toUpperCase();
    const ward = String(req.body.ward || "").replace(/\s+/g, "");
    const organization = String(req.body.organization || "").trim();
    const districtName = String(req.body.districtName || "").trim();
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!districtId || !ward || !organization || !districtName || !username) {
      throw new HttpError(400, "Заавал бөглөх талбар дутуу байна.");
    }
    if (password.length < 8) throw new HttpError(400, "Нууц үг 8-аас доошгүй тэмдэгттэй байна.");
    const exists = await Clinic.findOne({ where: { districtId, ward } });
    if (exists) throw new HttpError(409, "Энэ дүүргийн хороо аль хэдийн бүртгэлтэй.");
    const id = districtId === "SBD" && ["08", "09", "8", "9"].includes(ward) ? ward.padStart(2, "0") : `${districtId}-${ward}`;
    const name = `${districtName} · ${ward}-р хороо`;
    const clinic = await Clinic.create({ id, districtId, districtName, ward, name, organization, active: true });
    const account = await Account.create({
      username,
      role: "clinic",
      name: organization,
      passwordHash: await bcrypt.hash(password, 10),
      clinicId: clinic.id,
      districtId,
      active: true,
    });
    res.status(201).json({ clinic, account: publicAccount(account) });
  })
);

router.patch(
  "/:id",
  roles("superadmin"),
  asyncHandler(async (req, res) => {
    const clinic = await Clinic.findByPk(req.params.id);
    if (!clinic) throw new HttpError(404, "Байгууллага олдсонгүй.");
    const organization = req.body.organization != null ? String(req.body.organization).trim() : clinic.organization;
    const districtName = req.body.districtName != null ? String(req.body.districtName).trim() : clinic.districtName;
    const active = req.body.active != null ? Boolean(req.body.active) : clinic.active;
    clinic.organization = organization;
    clinic.districtName = districtName;
    clinic.name = `${districtName} · ${clinic.ward}-р хороо`;
    clinic.active = active;
    await clinic.save();
    res.json({ clinic });
  })
);

router.get(
  "/accounts",
  roles("superadmin"),
  asyncHandler(async (_req, res) => {
    const accounts = await Account.findAll({ order: [["createdAt", "ASC"]] });
    const rows = [];
    for (const a of accounts) {
      const clinics = a.role === "district" ? await a.getAssignedClinics() : [];
      rows.push(publicAccount(a, clinics.map((c) => c.id)));
    }
    res.json({ accounts: rows });
  })
);

router.post(
  "/accounts",
  roles("superadmin"),
  asyncHandler(async (req, res) => {
    const username = String(req.body.username || "").trim().toLowerCase();
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "");
    const districtId = String(req.body.districtId || "").trim();
    const clinicIds = [...new Set((req.body.clinicIds || []).map(String))];
    if (!username || !name || !districtId) throw new HttpError(400, "Мэдээллээ бүрэн оруулна уу.");
    if (password.length < 8) throw new HttpError(400, "Нууц үг 8-аас доошгүй тэмдэгттэй.");
    if (!clinicIds.length) throw new HttpError(400, "Энэ эмчид хамгийн багадаа нэг хороо онооно уу.");
    const account = await Account.create({
      username,
      role: "district",
      name,
      passwordHash: await bcrypt.hash(password, 10),
      districtId,
      active: true,
    });
    const clinics = await Clinic.findAll({ where: { id: { [Op.in]: clinicIds }, districtId, active: true } });
    await account.setAssignedClinics(clinics);
    res.status(201).json({ account: publicAccount(account, clinics.map((c) => c.id)) });
  })
);

router.patch(
  "/accounts/:id",
  roles("superadmin"),
  asyncHandler(async (req, res) => {
    const account = await Account.findByPk(req.params.id);
    if (!account) throw new HttpError(404, "Эрх олдсонгүй.");
    if (req.body.name) account.name = String(req.body.name).trim();
    if (req.body.active != null && account.role !== "superadmin") account.active = Boolean(req.body.active);
    if (Array.isArray(req.body.clinicIds) && account.role === "district") {
      const clinics = await Clinic.findAll({
        where: { id: { [Op.in]: req.body.clinicIds.map(String) }, districtId: account.districtId, active: true },
      });
      await account.setAssignedClinics(clinics);
    }
    if (req.body.password) {
      if (String(req.body.password).length < 8) throw new HttpError(400, "Нууц үг 8 тэмдэгтээс урт байна.");
      account.passwordHash = await bcrypt.hash(String(req.body.password), 10);
    }
    await account.save();
    const clinics = account.role === "district" ? await account.getAssignedClinics() : [];
    res.json({ account: publicAccount(account, clinics.map((c) => c.id)) });
  })
);

router.get(
  "/audit",
  roles("superadmin", "clinic", "district"),
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.user.role !== "superadmin") {
      const patients = await Patient.findAll({
        where: req.user.role === "clinic" ? { clinicId: req.user.clinicId } : { districtId: req.user.districtId },
        attributes: ["id"],
      });
      where.patientId = patients.map((p) => p.id);
    }
    const logs = await AuditLog.findAll({ where, order: [["at", "DESC"]], limit: 200 });
    res.json({ logs });
  })
);

module.exports = router;
