import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;
const usePostgres =
  Boolean(databaseUrl) && process.env.NODE_ENV !== "test";

const storagePath = process.env.NODE_ENV === "test"
  ? ":memory:"
  : path.resolve(__dirname, "../../dev.sqlite");

const sequelize = usePostgres
  ? new Sequelize(databaseUrl, {
      dialect: "postgres",
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
      },
    })
  : new Sequelize({
      dialect: "sqlite",
      storage: storagePath,
      logging: false,
    });

export default sequelize;
