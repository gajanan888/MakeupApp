import fs from "fs";
import sequelize from "../src/config/db.js";
import { getArtists } from "../src/modules/customer/customer.service.js";

async function run() {
  let logContent = "";
  const log = (msg) => {
    logContent += msg + "\n";
    console.log(msg);
  };

  try {
    await sequelize.authenticate();
    log("DB connected");

    const [columns] = await sequelize.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'ArtistProfiles' 
       ORDER BY column_name;`
    );
    log("Columns returned:");
    log(JSON.stringify(columns, null, 2));

    log("Calling getArtists...");
    const result = await getArtists({ location: "Pune" });
    log(`Result length: ${result.length}`);
  } catch (err) {
    log(`Error: ${err.message}`);
    log(err.stack);
  } finally {
    fs.writeFileSync("debug_pune_output.txt", logContent);
    process.exit(0);
  }
}

run();
