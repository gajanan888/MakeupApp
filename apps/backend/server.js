import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./src/config/db.js";
import routes from "./src/routes/index.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

async function bootstrapDatabase() {
  try {
    await sequelize.authenticate();
    console.log("DB CONNECTED");

    if (process.env.NODE_ENV === "production") {
      console.log(
        "Production mode: ensure migrations are run with `npm run migrate` before starting. Skipping sequelize.sync()",
      );
      return;
    }

    // Keep development startup resilient when the database is unavailable.
    await sequelize.sync();
  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

bootstrapDatabase();

app.get("/", (req, res) => {
  res.send("Hello Wordl!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
