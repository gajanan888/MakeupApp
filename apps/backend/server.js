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

sequelize
  .authenticate()
  .then(() => console.log("DB CONNECTED"))
  .catch((err) => console.log(err));

if (process.env.NODE_ENV === "production") {
  console.log(
    "Production mode: ensure migrations are run with `npm run migrate` before starting. Skipping sequelize.sync()",
  );
} else {
  // In development it's convenient to keep sync, but migrations are preferred.
  sequelize.sync();
}

app.get("/", (req, res) => {
  res.send("Hello Wordl!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
