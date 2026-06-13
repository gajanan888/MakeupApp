import sequelize from "../src/config/db.js";
import Artist from "../src/models/Artist.js";
import ArtistProfile from "../src/models/ArtistProfile.js";
import ArtistSpecialization from "../src/models/ArtistSpecialization.js";
import ArtistCertificate from "../src/models/ArtistCertificate.js";
import ArtistService from "../src/models/ArtistService.js";
import ArtistPortfolio from "../src/models/ArtistPortfolio.js";
import ArtistPayment from "../src/models/ArtistPayment.js";

async function migrate() {
  const qi = sequelize.getQueryInterface();
  const table = "Artists";

  console.log("Describing table", table);
  const desc = await qi.describeTable(table);

  // Columns we may migrate if present
  const possibleCols = [
    "profileImage",
    "gender",
    "bio",
    "location",
    "experience",
    "pricing",
    "specializations",
    "certificates",
  ];

  const colsToMigrate = possibleCols.filter((c) =>
    Object.prototype.hasOwnProperty.call(desc, c),
  );
  console.log("Found columns to migrate:", colsToMigrate);

  const artists = await Artist.findAll();
  console.log("Found", artists.length, "artists");

  let counts = { profiles: 0, specs: 0, certs: 0, services: 0 };

  for (const a of artists) {
    const id = a.id;
    // migrate profile fields
    const profilePayload = {};
    if (colsToMigrate.includes("profileImage") && a.profileImage)
      profilePayload.profileImage = a.profileImage;
    if (colsToMigrate.includes("gender") && a.gender)
      profilePayload.gender = a.gender;
    if (colsToMigrate.includes("bio") && a.bio) profilePayload.bio = a.bio;
    if (colsToMigrate.includes("location") && a.location)
      profilePayload.location = a.location;
    if (
      colsToMigrate.includes("experience") &&
      (a.experience || a.experience === 0)
    )
      profilePayload.experience = a.experience;

    if (Object.keys(profilePayload).length > 0) {
      await ArtistProfile.upsert({ artistId: id, ...profilePayload });
      counts.profiles += 1;
    }

    // migrate specializations (if string or array)
    if (colsToMigrate.includes("specializations") && a.specializations) {
      try {
        let specs = a.specializations;
        if (typeof specs === "string") {
          // try JSON parse, else split by comma
          try {
            specs = JSON.parse(specs);
          } catch (e) {
            specs = specs
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
        }
        if (Array.isArray(specs)) {
          const rows = specs.map((name) => ({ artistId: id, name }));
          await ArtistSpecialization.bulkCreate(rows, {
            ignoreDuplicates: true,
          });
          counts.specs += rows.length;
        }
      } catch (e) {
        console.warn(
          "Failed to migrate specializations for artist",
          id,
          e.message,
        );
      }
    }

    // migrate certificates if present (assume JSON array)
    if (colsToMigrate.includes("certificates") && a.certificates) {
      try {
        let certs = a.certificates;
        if (typeof certs === "string") {
          certs = JSON.parse(certs);
        }
        if (Array.isArray(certs)) {
          const rows = certs.map((c) => ({
            artistId: id,
            fileName: c.fileName || c.name || null,
            fileUrl: c.fileUrl || c.url || null,
            fileSize: c.fileSize || c.size || null,
            fileType: c.fileType || c.type || null,
            certificateNumber: c.certificateNumber || null,
            instituteName: c.instituteName || null,
          }));
          await ArtistCertificate.bulkCreate(rows);
          counts.certs += rows.length;
        }
      } catch (e) {
        console.warn(
          "Failed to migrate certificates for artist",
          id,
          e.message,
        );
      }
    }

    // migrate pricing -> create a default service if pricing exists
    if (colsToMigrate.includes("pricing") && (a.pricing || a.pricing === 0)) {
      try {
        await ArtistService.create({
          artistId: id,
          specialization: "Default",
          duration: null,
          timeRange: null,
          priceRange: String(a.pricing),
        });
        counts.services += 1;
      } catch (e) {
        console.warn("Failed to migrate pricing for artist", id, e.message);
      }
    }
  }

  console.log("Migration counts", counts);

  // drop migrated columns
  for (const col of colsToMigrate) {
    try {
      console.log("Removing column", col);
      await qi.removeColumn(table, col);
    } catch (e) {
      console.warn("Failed to remove column", col, e.message);
    }
  }

  console.log("Migration finished.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration error", err);
  process.exit(1);
});
