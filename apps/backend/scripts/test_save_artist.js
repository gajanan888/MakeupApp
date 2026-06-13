import sequelize from "../src/config/db.js";
import Artist from "../src/models/Artist.js";
import { updateArtistProfile } from "../src/modules/artist/artist.service.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    const email = `testartist_${Date.now()}@example.com`;

    // create test artist
    const artist = await Artist.create({
      name: "Test Artist",
      email,
      phone: "9999999999",
      password: "secret",
    });

    console.log("Created artist id", artist.id);

    const payload = {
      profile: {
        profileImage: "https://example.com/profile.jpg",
        gender: "female",
        bio: "This is a test bio",
        location: "Test City",
        experience: "5 years",
      },
      specializations: ["Bridal", "Glam"],
      certificates: [
        { fileName: "cert1.pdf", fileUrl: "https://example.com/cert1.pdf" },
      ],
      services: [
        { specialization: "Bridal", duration: "2h", priceRange: "200-400" },
      ],
      portfolio: [
        {
          beforeImage: "https://example.com/b1.jpg",
          afterImage: "https://example.com/a1.jpg",
          tag: "Bridal",
          description: "Test",
        },
      ],
      payment: {
        accountHolder: "Test",
        bankName: "Test Bank",
        accountNumber: "123456",
        ifscCode: "TEST0001",
        upiId: "test@upi",
      },
    };

    const updated = await updateArtistProfile(artist.id, payload);
    console.log("Profile updated for artist", updated.id);
    process.exit(0);
  } catch (err) {
    console.error("Error", err);
    process.exit(1);
  }
}

run();
