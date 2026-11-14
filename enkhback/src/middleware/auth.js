const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const env = require("../config/env");
const { Account, Clinic, Patient } = require("../models");
const { HttpError } = require("../utils/http");

function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

function authRequired(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Нэвтрэх шаардлагатай."));
  try {
    req.user = jwt.verify(token, env.jwt.secret);
    next();
  } catch {
    next(new HttpError(401, "Холболт хүчингүй болсон. Дахин нэвтэрнэ үү."));
  }
}

function roles(...allowed) {
  return (req, _res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return next(new HttpError(403, "Энэ үйлдэл хийх эрхгүй."));
    }
    next();
  };
}

function clinicScope(user, patient) {
  if (!user || !patient) return false;
  if (user.role === "superadmin") return true;
  if (user.role === "mom") return user.patientId === patient.id;
  if (user.role === "clinic") return patient.clinicId === user.clinicId;
  if (user.role === "district") {
    return patient.districtId === user.districtId && (user.clinicIds || []).includes(patient.clinicId);
  }
  return false;
}

function patientWhere(user) {
  if (user.role === "superadmin") return {};
  if (user.role === "mom") return { id: user.patientId };
  if (user.role === "clinic") return { clinicId: user.clinicId };
  if (user.role === "district") {
    const ids = user.clinicIds || [];
    if (!ids.length) return { id: { [Op.eq]: null } };
    return { districtId: user.districtId, clinicId: { [Op.in]: ids } };
  }
  return { id: { [Op.eq]: null } };
}

async function loadStaffSession(account) {
  if (!account?.active) return null;
  const clinicIds =
    account.role === "district"
      ? (await account.getAssignedClinics({ where: { active: true } })).map((c) => c.id)
      : [];
  let clinic = null;
  if (account.role === "clinic") {
    clinic = await Clinic.findByPk(account.clinicId);
    if (!clinic?.active) return null;
  }
  return {
    id: account.id,
    username: account.username,
    role: account.role,
    name: account.role === "clinic" ? clinic.organization : account.name,
    clinicId: clinic?.id || account.clinicId || null,
    clinic: clinic?.name || null,
    districtId: clinic?.districtId || account.districtId || null,
    clinicIds,
  };
}

async function loadMomSession(patient) {
  if (!patient?.appPhone) return null;
  return {
    id: patient.id,
    role: "mom",
    name: patient.name,
    patientId: patient.id,
    clinicId: patient.clinicId,
    districtId: patient.districtId,
    phone: patient.appPhone,
  };
}

async function findStaff(username) {
  return Account.findOne({ where: { username: String(username || "").trim().toLowerCase() } });
}

async function findMomByPhone(phone) {
  const cleaned = String(phone || "").replace(/\D/g, "");
  return Patient.findOne({ where: { appPhone: cleaned } });
}

module.exports = {
  signToken,
  authRequired,
  roles,
  clinicScope,
  patientWhere,
  loadStaffSession,
  loadMomSession,
  findStaff,
  findMomByPhone,
};
