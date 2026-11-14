function pad(n) {
  return String(n).padStart(2, "0");
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shift(ymd, n) {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
}

function gestation(lmp, dueOverride) {
  const t = today();
  let total;
  if (dueOverride) {
    total = Math.max(0, Math.min(400, 280 - daysBetween(t, dueOverride)));
  } else {
    total = Math.max(0, Math.min(400, daysBetween(lmp, t)));
  }
  return {
    total,
    week: Math.floor(total / 7),
    day: total % 7,
    remaining: Math.max(0, Math.min(280, 280 - total)),
    trim: total < 91 ? 1 : total < 196 ? 2 : 3,
    pct: Math.max(0, Math.min(100, Math.round((total / 280) * 100))),
    label: `${Math.floor(total / 7)} долоо хоног ${total % 7} өдөр`,
  };
}

function dueDate(lmp, dueOverride) {
  return dueOverride || shift(lmp, 280);
}

module.exports = { today, shift, daysBetween, gestation, dueDate };
