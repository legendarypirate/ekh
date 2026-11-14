require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || "mom",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "enkhekh-dev-secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  dbSync: process.env.DB_SYNC !== "false",
  seedOnEmpty: process.env.SEED_ON_EMPTY !== "false",
};
