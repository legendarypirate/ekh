const { HttpError } = require("../utils/http");

function notFound(_req, _res, next) {
  next(new HttpError(404, "Энэ зам олдсонгүй."));
}

function errorHandler(err, _req, res, _next) {
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ error: "Энэ мэдээлэл аль хэдийн бүртгэлтэй байна." });
  }
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ error: err.errors?.[0]?.message || "Мэдээлэл буруу байна." });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || "Серверийн алдаа." });
}

module.exports = { notFound, errorHandler };
