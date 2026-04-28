import cors from "cors";
import express from "express";
import sequelize from "./src/config/db.js";
import routes from "./src/routes/index.js";
import Artist from "./src/models/Artist.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

sequelize
  .authenticate()
  .then(() => console.log("DB CONNECTED"))
  .catch((err) => console.log(err));

sequelize.sync();

app.get("/", (req, res) => {
  res.send("Hello Gajanan!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
