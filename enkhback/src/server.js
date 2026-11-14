const env = require("./config/env");
const { sequelize, Account } = require("./models");
const { createApp } = require("./app");
const { seed } = require("./seed/demo");

async function boot() {
  await sequelize.authenticate();
  if (env.dbSync) await sequelize.sync();
  if (env.seedOnEmpty) {
    const n = await Account.count();
    if (n === 0) await seed();
  }
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`ЭнхЭх API listening on http://localhost:${env.port}`);
  });
}

boot().catch((err) => {
  console.error("Failed to start API", err);
  process.exit(1);
});
