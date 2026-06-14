require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const path = require("path");

function fromDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const url = new URL(process.env.DATABASE_URL);

  return {
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    host: url.hostname,
    port: Number(url.port || 5432),
    dialect: "postgres",
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  };
}

const sqliteConfig = {
  dialect: "sqlite",
  storage: path.resolve(__dirname, "../dev.sqlite"),
  logging: false,
};

const postgresConfig = fromDatabaseUrl();
const sharedConfig =
  process.env.NODE_ENV === "test"
    ? sqliteConfig
    : postgresConfig || sqliteConfig;

module.exports = {
  development: sharedConfig,
  test: sharedConfig,
  production: sharedConfig,
};
