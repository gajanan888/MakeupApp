import { getArtists, getTrendingArtists } from "../src/modules/customer/customer.service.js";
import sequelize from "../src/config/db.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    console.log("Testing getArtists with location 'Pune'...");
    const artists = await getArtists({ location: "Pune" });
    console.log(`Success! getArtists count: ${artists.length}`);
    if (artists.length > 0) {
      console.log("First artist:", JSON.stringify(artists[0], null, 2));
    }

    console.log("Testing getTrendingArtists...");
    const trending = await getTrendingArtists();
    console.log(`Success! getTrendingArtists count: ${trending.length}`);
    if (trending.length > 0) {
      console.log("First trending artist:", JSON.stringify(trending[0], null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
