import sequelize from "../src/config/db.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    const [columns] = await sequelize.query(
      `SELECT table_schema, table_name, column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name ILIKE '%ArtistProfile%'
       ORDER BY table_schema, table_name, column_name;`
    );
    console.log("All matching columns in DB:");
    console.log(JSON.stringify(columns, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
