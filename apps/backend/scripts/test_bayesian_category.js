import { getArtists } from "../src/modules/customer/customer.service.js";
import sequelize from "../src/config/db.js";

async function verifyBayesianCategorySearch() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    const testCategories = ["Bridal", "Party", "HD Makeup", "Airbrush"];

    for (const cat of testCategories) {
      console.log(`\n========================================`);
      console.log(`Testing Category Search for: '${cat}'`);
      console.log(`========================================`);

      const results = await getArtists({ category: cat });
      console.log(`Found ${results.length} artists for category '${cat}'`);

      if (results.length > 0) {
        let isStrictlySorted = true;
        for (let i = 0; i < results.length; i++) {
          const artist = results[i];
          console.log(
            `Rank ${i + 1}: ${artist.name} | Rating: ${artist.profile?.rating} (${artist.profile?.reviewCount} reviews) | Bayesian Score: ${artist.bayesianScore} | Bayesian Rating: ${artist.bayesianRating}`
          );

          if (i > 0 && results[i - 1].bayesianScore < artist.bayesianScore) {
            isStrictlySorted = false;
          }
        }

        if (isStrictlySorted) {
          console.log(`✅ VERIFIED: Category '${cat}' search results are strictly ordered by Bayesian Rating Algorithm score.`);
        } else {
          console.error(`❌ ERROR: Category '${cat}' search results are NOT sorted by Bayesian rating!`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

verifyBayesianCategorySearch();
