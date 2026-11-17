const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Clinic = sequelize.define("Clinic", {
  id: { type: DataTypes.STRING(16), primaryKey: true },
  districtId: { type: DataTypes.STRING(16), allowNull: false },
  districtName: { type: DataTypes.STRING(120), allowNull: false },
  ward: { type: DataTypes.STRING(16), allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  organization: { type: DataTypes.STRING(160), allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  isDeleted: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
});

const Account = sequelize.define("Account", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  role: { type: DataTypes.ENUM("superadmin", "clinic", "district"), allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  passwordHash: { type: DataTypes.STRING(120), allowNull: false },
  clinicId: { type: DataTypes.STRING(16) },
  districtId: { type: DataTypes.STRING(16) },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
});

const AccountClinic = sequelize.define("AccountClinic", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
});

const Patient = sequelize.define("Patient", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  registrationNumber: { type: DataTypes.STRING(16), unique: true },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  appPhone: { type: DataTypes.STRING(8), unique: true },
  appPasswordHash: { type: DataTypes.STRING(120) },
  emergencyPhone: { type: DataTypes.STRING(20) },
  dob: { type: DataTypes.DATEONLY },
  address: { type: DataTypes.TEXT },
  lmp: { type: DataTypes.DATEONLY, allowNull: false },
  dueOverride: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.ENUM("unknown", "girl", "boy"), allowNull: false, defaultValue: "unknown" },
  height: { type: DataTypes.STRING(16) },
  history: { type: DataTypes.TEXT },
  blood: { type: DataTypes.STRING(40) },
  gravida: { type: DataTypes.STRING(8) },
  para: { type: DataTypes.STRING(8) },
  previousOutcomes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  employment: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  assessment: { type: DataTypes.STRING(8), defaultValue: "" },
  assessmentReason: { type: DataTypes.TEXT, defaultValue: "" },
  assessmentDate: { type: DataTypes.DATEONLY },
  doctor: { type: DataTypes.STRING(160) },
  clinicId: { type: DataTypes.STRING(16), allowNull: false },
  districtId: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "SBD" },
  careExit: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  protocolTasks: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  registeredAt: { type: DataTypes.DATEONLY },
});

const Visit = sequelize.define("Visit", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  title: { type: DataTypes.STRING(160), allowNull: false },
  provider: { type: DataTypes.ENUM("clinic", "district"), allowNull: false, defaultValue: "clinic" },
  bp: { type: DataTypes.STRING(16), defaultValue: "" },
  weight: { type: DataTypes.STRING(16), defaultValue: "" },
  fhr: { type: DataTypes.STRING(16), defaultValue: "" },
  note: { type: DataTypes.TEXT, defaultValue: "" },
  advice: { type: DataTypes.TEXT, defaultValue: "" },
  tests: { type: DataTypes.TEXT, defaultValue: "" },
  meds: { type: DataTypes.TEXT, defaultValue: "" },
  privateNote: { type: DataTypes.TEXT, defaultValue: "" },
  author: { type: DataTypes.STRING(160), defaultValue: "" },
  ack: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  protocolIndex: { type: DataTypes.INTEGER },
});

const Medication = sequelize.define("Medication", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  visitId: { type: DataTypes.UUID },
  visitTitle: { type: DataTypes.STRING(160), defaultValue: "" },
  name: { type: DataTypes.STRING(160), allowNull: false },
  strength: { type: DataTypes.STRING(64), defaultValue: "" },
  dose: { type: DataTypes.STRING(64), defaultValue: "" },
  frequency: { type: DataTypes.STRING(64), defaultValue: "" },
  duration: { type: DataTypes.STRING(64), defaultValue: "" },
  startDate: { type: DataTypes.DATEONLY },
  route: { type: DataTypes.STRING(64), defaultValue: "" },
  instructions: { type: DataTypes.TEXT, defaultValue: "" },
  author: { type: DataTypes.STRING(160), defaultValue: "" },
});

const Appointment = sequelize.define("Appointment", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "10:00" },
  title: { type: DataTypes.STRING(160), allowNull: false },
  place: { type: DataTypes.STRING(160), defaultValue: "" },
  provider: { type: DataTypes.ENUM("clinic", "district"), defaultValue: "district" },
  status: { type: DataTypes.ENUM("planned", "done", "cancelled"), allowNull: false, defaultValue: "planned" },
});

const Measurement = sequelize.define("Measurement", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  bp: { type: DataTypes.STRING(16), defaultValue: "" },
  weight: { type: DataTypes.STRING(16), defaultValue: "" },
  note: { type: DataTypes.TEXT, defaultValue: "" },
});

const Symptom = sequelize.define("Symptom", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  mood: { type: DataTypes.STRING(40), allowNull: false },
  note: { type: DataTypes.TEXT, defaultValue: "" },
});

const KickLog = sequelize.define("KickLog", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.STRING(8), allowNull: false },
  count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  note: { type: DataTypes.TEXT, defaultValue: "" },
});

const MomTask = sequelize.define("MomTask", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  label: { type: DataTypes.STRING(240), allowNull: false },
  done: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

const Referral = sequelize.define("Referral", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  createdOn: { type: DataTypes.DATEONLY, allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM("pending", "completed", "closed"),
    allowNull: false,
    defaultValue: "pending",
  },
  reason: { type: DataTypes.TEXT, defaultValue: "" },
  createdBy: { type: DataTypes.STRING(160), defaultValue: "" },
  completedAt: { type: DataTypes.DATEONLY },
  completedBy: { type: DataTypes.STRING(160) },
  closedAt: { type: DataTypes.DATEONLY },
  closedReason: { type: DataTypes.STRING(160) },
  motherVisitReportedAt: { type: DataTypes.DATE },
});

const ReferralFollowup = sequelize.define("ReferralFollowup", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  referralId: { type: DataTypes.UUID, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  note: { type: DataTypes.TEXT, allowNull: false },
  actor: { type: DataTypes.STRING(160), defaultValue: "" },
});

const Question = sequelize.define("Question", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  category: { type: DataTypes.STRING(80), allowNull: false, defaultValue: "Бусад" },
  text: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM("new", "answered"), allowNull: false, defaultValue: "new" },
  reply: { type: DataTypes.TEXT, defaultValue: "" },
  repliedAt: { type: DataTypes.DATE },
  repliedBy: { type: DataTypes.STRING(160), defaultValue: "" },
  seenAt: { type: DataTypes.DATE },
});

const TransferRequest = sequelize.define("TransferRequest", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID, allowNull: false },
  createdOn: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM("pending", "forwarded", "forwarded_external", "completed", "needs_info", "rejected"),
    allowNull: false,
    defaultValue: "pending",
  },
  reason: { type: DataTypes.TEXT, defaultValue: "" },
  region: { type: DataTypes.STRING(120), defaultValue: "" },
  localUnit: { type: DataTypes.STRING(120), defaultValue: "" },
  wardBag: { type: DataTypes.STRING(120), defaultValue: "" },
  address: { type: DataTypes.TEXT, defaultValue: "" },
  targetClinic: { type: DataTypes.STRING(160), defaultValue: "" },
  moveDate: { type: DataTypes.DATEONLY },
  toClinicId: { type: DataTypes.STRING(16) },
  toDistrictId: { type: DataTypes.STRING(16) },
  reviewNote: { type: DataTypes.TEXT, defaultValue: "" },
  reviewedAt: { type: DataTypes.DATEONLY },
  reviewedBy: { type: DataTypes.STRING(160) },
  completedAt: { type: DataTypes.DATEONLY },
  completedBy: { type: DataTypes.STRING(160) },
});

const AuditLog = sequelize.define("AuditLog", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  patientId: { type: DataTypes.UUID },
  actor: { type: DataTypes.STRING(160), allowNull: false },
  action: { type: DataTypes.STRING(240), allowNull: false },
  at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

Account.belongsTo(Clinic, { foreignKey: "clinicId", as: "clinic" });
Clinic.hasMany(Account, { foreignKey: "clinicId", as: "staff" });
Account.belongsToMany(Clinic, { through: AccountClinic, as: "assignedClinics" });
Clinic.belongsToMany(Account, { through: AccountClinic, as: "doctors" });

Patient.belongsTo(Clinic, { foreignKey: "clinicId", as: "clinic" });
Clinic.hasMany(Patient, { foreignKey: "clinicId", as: "patients" });

Patient.hasMany(Visit, { as: "visits", onDelete: "CASCADE" });
Visit.belongsTo(Patient);

Patient.hasMany(Medication, { as: "medications", onDelete: "CASCADE" });
Medication.belongsTo(Patient);
Visit.hasMany(Medication, { as: "medicines", onDelete: "SET NULL" });
Medication.belongsTo(Visit);

Patient.hasMany(Appointment, { as: "appointments", onDelete: "CASCADE" });
Appointment.belongsTo(Patient);

Patient.hasMany(Measurement, { as: "measurements", onDelete: "CASCADE" });
Measurement.belongsTo(Patient);

Patient.hasMany(Symptom, { as: "symptoms", onDelete: "CASCADE" });
Symptom.belongsTo(Patient);

Patient.hasMany(KickLog, { as: "kicks", onDelete: "CASCADE" });
KickLog.belongsTo(Patient);

Patient.hasMany(MomTask, { as: "tasks", onDelete: "CASCADE" });
MomTask.belongsTo(Patient);

Patient.hasMany(Referral, { as: "referrals", onDelete: "CASCADE" });
Referral.belongsTo(Patient);
Referral.hasMany(ReferralFollowup, { as: "followups", onDelete: "CASCADE" });
ReferralFollowup.belongsTo(Referral);

Patient.hasMany(Question, { as: "questions", onDelete: "CASCADE" });
Question.belongsTo(Patient);

Patient.hasMany(TransferRequest, { as: "transferRequests", onDelete: "CASCADE" });
TransferRequest.belongsTo(Patient);

Patient.hasMany(AuditLog, { as: "audit", onDelete: "SET NULL" });
AuditLog.belongsTo(Patient);

async function writeAudit(actor, action, patientId) {
  return AuditLog.create({ actor, action, patientId: patientId || null });
}

module.exports = {
  sequelize,
  Clinic,
  Account,
  AccountClinic,
  Patient,
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
  AuditLog,
  writeAudit,
};
