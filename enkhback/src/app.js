const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const env = require("./config/env");
const authRoutes = require("./routes/auth");
const clinicRoutes = require("./routes/clinics");
const patientRoutes = require("./routes/patients");
const dashboardRoutes = require("./routes/dashboard");
const clinicalRoutes = require("./routes/clinical");
const { notFound, errorHandler } = require("./middleware/error");

function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  app.get("/", (_req, res) => {
    res.json({
      name: "ЭнхЭх API",
      version: "1.0.0",
      health: "/api/health",
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "enkhback", db: env.db.name });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/clinics", clinicRoutes);
  app.use("/api/patients", patientRoutes);
  app.use("/api", clinicalRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
