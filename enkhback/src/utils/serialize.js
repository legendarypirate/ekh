const { gestation, dueDate } = require("./dates");

function publicPatient(p, extras = {}) {
  const json = p.toJSON ? p.toJSON() : p;
  delete json.appPasswordHash;
  let clinic = json.clinic;
  if (clinic && typeof clinic === "object") clinic = clinic.name || clinic.organization || "";
  return {
    ...json,
    clinic: clinic || json.clinicId || "",
    gestation: json.lmp ? gestation(json.lmp, json.dueOverride) : null,
    dueDate: json.lmp ? dueDate(json.lmp, json.dueOverride) : null,
    ...extras,
  };
}

function publicAccount(a, clinicIds = []) {
  const json = a.toJSON ? a.toJSON() : a;
  delete json.passwordHash;
  return { ...json, clinicIds };
}

module.exports = { publicPatient, publicAccount };
