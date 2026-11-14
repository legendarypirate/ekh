const bcrypt = require("bcryptjs");
const { sequelize, Clinic, Account, Patient, Visit, Medication, Appointment, Referral, MomTask } = require("../models");
const { today, shift } = require("../utils/dates");

async function hash(password) {
  return bcrypt.hash(password, 10);
}

async function seed({ force = false } = {}) {
  if (force) await sequelize.sync({ force: true });

  const t = today();
  const clinics = [
    {
      id: "08",
      districtId: "SBD",
      districtName: "Сүхбаатар дүүрэг",
      ward: "8",
      name: "СБД · 8-р хороо",
      organization: "8-р хорооны ӨЭМТ",
      active: true,
    },
    {
      id: "09",
      districtId: "SBD",
      districtName: "Сүхбаатар дүүрэг",
      ward: "9",
      name: "СБД · 9-р хороо",
      organization: "9-р хорооны ӨЭМТ",
      active: true,
    },
  ];
  for (const c of clinics) await Clinic.upsert(c);

  const staff = [
    { username: "superadmin", role: "superadmin", name: "Системийн ерөнхий админ", password: "Demo@Super26!" },
    {
      username: "horoo08",
      role: "clinic",
      name: "8-р хорооны ӨЭМТ",
      password: "Demo@0808",
      clinicId: "08",
      districtId: "SBD",
    },
    {
      username: "horoo09",
      role: "clinic",
      name: "9-р хорооны ӨЭМТ",
      password: "Demo@0909",
      clinicId: "09",
      districtId: "SBD",
    },
    {
      username: "duureg",
      role: "district",
      name: "Демо · Дүүргийн эмч",
      password: "Demo@district",
      districtId: "SBD",
      clinicIds: ["08", "09"],
    },
  ];

  const accounts = {};
  for (const s of staff) {
    let account = await Account.findOne({ where: { username: s.username } });
    if (!account) {
      account = await Account.create({
        username: s.username,
        role: s.role,
        name: s.name,
        passwordHash: await hash(s.password),
        clinicId: s.clinicId || null,
        districtId: s.districtId || null,
        active: true,
      });
    }
    if (s.clinicIds) {
      const assigned = await Clinic.findAll({ where: { id: s.clinicIds } });
      await account.setAssignedClinics(assigned);
    }
    accounts[s.username] = account;
  }

  const momPass = await hash("Demo@Mom1");
  const patients = [
    {
      code: "P001",
      name: "Демо · А.Энхзаяа",
      phone: "99000001",
      appPhone: "99000001",
      lmp: shift(t, -165),
      gender: "unknown",
      clinicId: "08",
      districtId: "SBD",
      doctor: "Өрхийн хяналтын эмч",
      assessment: "B",
      assessmentReason: "Демо үнэлгээ. Бодит шалгуур биш.",
      registeredAt: shift(t, -2),
    },
    {
      code: "P002",
      name: "Демо · Б.Саруул",
      phone: "99000002",
      appPhone: "99000002",
      lmp: shift(t, -120),
      gender: "girl",
      clinicId: "08",
      districtId: "SBD",
      doctor: "Өрхийн хяналтын эмч",
      assessment: "A",
      assessmentReason: "Демо ангилал",
      registeredAt: shift(t, -10),
    },
    {
      code: "P003",
      name: "Демо · Н.Уянга",
      phone: "99000003",
      appPhone: "99000003",
      lmp: shift(t, -230),
      gender: "boy",
      clinicId: "09",
      districtId: "SBD",
      doctor: "Өрхийн хяналтын эмч",
      assessment: "C",
      assessmentReason: "Демо ангилал",
      registeredAt: shift(t, -9),
    },
  ];

  const created = {};
  for (const p of patients) {
    const [row] = await Patient.findOrCreate({
      where: { code: p.code },
      defaults: { ...p, appPasswordHash: momPass },
    });
    created[p.code] = row;
  }

  const p1 = created.P001;
  if ((await Visit.count({ where: { patientId: p1.id } })) === 0) {
    const v1 = await Visit.create({
      patientId: p1.id,
      date: shift(t, -51),
      title: "Эхний хяналтын уулзалт",
      provider: "clinic",
      bp: "112/72",
      weight: "61.5",
      note: "Хорооны хяналтад бүртгэж, дүүргийн үзлэгт илгээлээ.",
      advice: "Товлосон хугацаанд дүүргийн эмнэлэгт очиж үзүүлээрэй.",
      author: "Хорооны эмч",
      ack: true,
    });
    const v2 = await Visit.create({
      patientId: p1.id,
      date: shift(t, -22),
      title: "Ээлжит хяналт",
      provider: "clinic",
      bp: "114/74",
      weight: "63.2",
      note: "Ээлжит уулзалт. Шинжилгээний талаар зөвлөгөө өгөв.",
      advice: "Дараагийн үзлэгт өмнөх хариу, асуултаа бэлдээрэй.",
      tests: "Анхан үеийн шинжилгээ — эмчийн заавраар",
      meds: "Төмрийн бэлдмэл, фолийн хүчил",
      author: "Демо эмч Б.Номин",
      ack: false,
    });
    await Medication.bulkCreate([
      {
        patientId: p1.id,
        visitId: v2.id,
        visitTitle: v2.title,
        name: "Фолийн хүчил",
        strength: "400 мкг",
        dose: "1 шахмал",
        frequency: "Өдөрт 1 удаа",
        duration: "30 хоног",
        startDate: v2.date,
        route: "Амаар",
        instructions: "Өглөө хоолны дараа ууна.",
        author: "Демо эмч Б.Номин",
      },
      {
        patientId: p1.id,
        visitId: v2.id,
        visitTitle: v2.title,
        name: "Төмрийн бэлдмэл",
        strength: "100 мг",
        dose: "1 шахмал",
        frequency: "Өдөрт 1 удаа",
        duration: "14 хоног",
        startDate: v2.date,
        route: "Амаар",
        instructions: "Орой хоолны дараа ууна.",
        author: "Демо эмч Б.Номин",
      },
    ]);
    await Appointment.create({
      patientId: p1.id,
      date: shift(t, 5),
      time: "10:30",
      title: "Ээлжит жирэмсний хяналт",
      place: "Өрхийн эрүүл мэндийн төв",
      provider: "clinic",
      status: "planned",
    });
    await Referral.create({
      patientId: p1.id,
      createdOn: shift(t, -2),
      dueDate: shift(t, 1),
      status: "pending",
      reason: "Анхны нарийн мэргэжлийн үзлэг",
      createdBy: "Хорооны эмч",
    });
    await MomTask.bulkCreate([
      { patientId: p1.id, label: "Дараагийн үзлэгт асуух асуултаа тэмдэглэх" },
      { patientId: p1.id, label: "Эмчийн товлосон үзлэгт очих" },
    ]);
    void v1;
  }

  const p2 = created.P002;
  if ((await Visit.count({ where: { patientId: p2.id } })) === 0) {
    const v = await Visit.create({
      patientId: p2.id,
      date: shift(t, -6),
      title: "Дүүргийн нарийн мэргэжлийн үзлэг",
      provider: "district",
      bp: "114/74",
      weight: "63.2",
      note: "Нарийн мэргэжлийн үзлэгт хамрагдав.",
      advice: "Дараагийн товлолтын дагуу ирээрэй.",
      tests: "Эмчийн зааврын дагуу",
      author: "Дүүргийн эмч",
      ack: true,
    });
    await Referral.create({
      patientId: p2.id,
      createdOn: shift(t, -10),
      dueDate: shift(t, -7),
      status: "completed",
      completedAt: shift(t, -6),
      reason: "Анхны үзлэг",
      createdBy: "Хорооны эмч",
      completedBy: "Дүүргийн эмч",
    });
    void v;
  }

  const p3 = created.P003;
  if ((await Referral.count({ where: { patientId: p3.id } })) === 0) {
    await Referral.create({
      patientId: p3.id,
      createdOn: shift(t, -9),
      dueDate: shift(t, -4),
      status: "pending",
      reason: "Анхны үзлэг",
      createdBy: "Хорооны эмч",
    });
  }

  return { accounts, patients: created };
}

async function runCli() {
  await sequelize.authenticate();
  await sequelize.sync({ force: process.argv.includes("--force") });
  await seed();
  console.log("Demo data ready in database \"mom\".");
  await sequelize.close();
}

if (require.main === module) {
  runCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seed };
