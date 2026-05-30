import Artist from "../src/models/Artist.js";
import ArtistProfile from "../src/models/ArtistProfile.js";
import ArtistService from "../src/models/ArtistService.js";
import ArtistPortfolio from "../src/models/ArtistPortfolio.js";
import ArtistPayment from "../src/models/ArtistPayment.js";
import ArtistCertificate from "../src/models/ArtistCertificate.js";
import ArtistSpecialization from "../src/models/ArtistSpecialization.js";
import sequelize from "../src/config/db.js";

const includes = [
  { model: ArtistProfile, as: "profile" },
  { model: ArtistService, as: "services" },
  { model: ArtistPortfolio, as: "portfolio" },
  { model: ArtistPayment, as: "payment" },
  { model: ArtistCertificate, as: "certificates" },
  { model: ArtistSpecialization, as: "specializations" },
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    const artists = await Artist.findAll({ include: includes });
    console.log("Artists found:", artists.length);
    for (const a of artists) {
      const json = a.toJSON();
      delete json.password;
      console.log(JSON.stringify(json, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error("Error", err.message || err);
    process.exit(1);
  }
}

run();
