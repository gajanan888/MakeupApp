import sequelize from "../src/config/db.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    const qi = sequelize.getQueryInterface();

    console.log("Syncing ArtistProfiles columns...");
    try {
      await qi.addColumn("ArtistProfiles", "parlourName", { type: "VARCHAR(255)" });
      console.log("parlourName added");
    } catch (e) {
      console.log("parlourName exists or failed:", e.message);
    }

    try {
      await qi.addColumn("ArtistProfiles", "parlourAddress", { type: "TEXT" });
      console.log("parlourAddress added");
    } catch (e) {
      console.log("parlourAddress exists or failed:", e.message);
    }

    try {
      await qi.addColumn("ArtistProfiles", "rating", { type: "DOUBLE PRECISION", allowNull: false, defaultValue: 4.5 });
      console.log("rating added");
    } catch (e) {
      console.log("rating exists or failed:", e.message);
    }

    try {
      await qi.addColumn("ArtistProfiles", "reviewCount", { type: "INTEGER", allowNull: false, defaultValue: 0 });
      console.log("reviewCount added");
    } catch (e) {
      console.log("reviewCount exists or failed:", e.message);
    }

    console.log("Bootstrap finished.");
    process.exit(0);
  } catch (err) {
    console.error("Bootstrap error:", err);
    process.exit(1);
  }
}

run();
