import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;
const isTestEnv =
  process.env.NODE_ENV === "test" ||
  process.execArgv.includes("--test") ||
  process.argv.includes("--test");

const usePostgres = Boolean(databaseUrl) && !isTestEnv && process.env.USE_SQLITE !== "true";

const storagePath = isTestEnv
  ? ":memory:"
  : path.resolve(__dirname, "../../dev.sqlite");

const sequelize = usePostgres
  ? new Sequelize(databaseUrl, {
      dialect: "postgres",
      pool: {
        max: 10,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
        keepAlive: true,
      },
    })
  : new Sequelize({
      dialect: "sqlite",
      storage: storagePath,
      logging: false,
    });

export default sequelize;
