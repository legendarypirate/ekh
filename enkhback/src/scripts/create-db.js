const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const dbName = process.env.DB_NAME || "mom";
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: "postgres",
  });
  await client.connect();
  const found = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (found.rowCount) {
    console.log(`Database "${dbName}" already exists.`);
  } else {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created.`);
  }
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
