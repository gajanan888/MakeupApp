import sequelize from "../src/config/db.js";
import { getArtists } from "../src/modules/customer/customer.service.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    // Check columns
    const [columns] = await sequelize.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'ArtistProfiles' 
       ORDER BY column_name;`
    );
    console.log("Columns returned:");
    console.log(JSON.stringify(columns, null, 2));

    console.log("Calling getArtists...");
    const result = await getArtists({ location: "Pune" });
    console.log("Result length:", result.length);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
