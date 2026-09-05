import sequelize from "../src/config/db.js";
import Customer from "../src/models/Customer.js";
import Artist from "../src/models/Artist.js";
import ArtistProfile from "../src/models/ArtistProfile.js";
import ArtistSpecialization from "../src/models/ArtistSpecialization.js";
import ArtistService from "../src/models/ArtistService.js";
import ArtistPortfolio from "../src/models/ArtistPortfolio.js";
import ArtistCertificate from "../src/models/ArtistCertificate.js";
import ArtistPayment from "../src/models/ArtistPayment.js";
import Booking from "../src/models/Booking.js";
import Review from "../src/models/Review.js";
import Wishlist from "../src/models/Wishlist.js";
import BookingPolicy from "../src/models/BookingPolicy.js";
import ArtistSocialLinks from "../src/models/ArtistSocialLinks.js";
import { Op } from "sequelize";

export async function removePuneTestData() {
  try {
    console.log("🧹 [Pune Test Data Cleanup] Connecting to database...");
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("✅ Database authenticated.");

    // Find Pune Test Artists
    const testArtists = await Artist.findAll({
      where: {
        email: {
          [Op.like]: "pune_test_artist%"
        }
      },
      paranoid: false
    });

    const artistIds = testArtists.map(a => a.id);

    console.log(`\n🔍 Found ${testArtists.length} Pune test artist record(s) to remove (IDs: ${artistIds.join(", ")}).`);

    if (artistIds.length > 0) {
      await ArtistProfile.destroy({ where: { artistId: artistIds }, force: true });
      await ArtistService.destroy({ where: { artistId: artistIds }, force: true });
      await ArtistPortfolio.destroy({ where: { artistId: artistIds }, force: true });
      await ArtistCertificate.destroy({ where: { artistId: artistIds }, force: true });
      await ArtistPayment.destroy({ where: { artistId: artistIds }, force: true });
      await ArtistSpecialization.destroy({ where: { artistId: artistIds }, force: true });
      if (BookingPolicy) await BookingPolicy.destroy({ where: { artistId: artistIds }, force: true });
      if (ArtistSocialLinks) await ArtistSocialLinks.destroy({ where: { artistId: artistIds }, force: true });
      await Booking.destroy({ where: { artistId: artistIds }, force: true });
      await Review.destroy({ where: { artistId: artistIds }, force: true });
      await Wishlist.destroy({ where: { artistId: artistIds }, force: true });

      // Destroy Artists
      for (const artist of testArtists) {
        await artist.destroy({ force: true });
      }
      console.log(`✅ Removed ${testArtists.length} Pune test artists and all associated data.`);
    }

    // Find Pune Test Customers
    const testCustomers = await Customer.findAll({
      where: {
        email: {
          [Op.like]: "pune_test_cust%"
        }
      },
      paranoid: false
    });

    const customerIds = testCustomers.map(c => c.id);

    console.log(`\n🔍 Found ${testCustomers.length} Pune test customer record(s) to remove (IDs: ${customerIds.join(", ")}).`);

    if (customerIds.length > 0) {
      await Booking.destroy({ where: { customerId: customerIds }, force: true });
      await Review.destroy({ where: { customerId: customerIds }, force: true });
      await Wishlist.destroy({ where: { customerId: customerIds }, force: true });

      // Destroy Customers
      for (const customer of testCustomers) {
        await customer.destroy({ force: true });
      }
      console.log(`✅ Removed ${testCustomers.length} Pune test customers and all associated data.`);
    }

    console.log("\n🎉 [SUCCESS] Pune test data has been completely wiped from database.");
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].includes("remove_pune_test_data.js")) {
  removePuneTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
