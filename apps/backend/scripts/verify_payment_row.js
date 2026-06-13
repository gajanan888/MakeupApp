import sequelize from "../src/config/db.js";

async function run() {
  const artistId = Number(process.argv[2]);
  if (!artistId) {
    console.error("Usage: node scripts/verify_payment_row.js <artistId>");
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(
      'SELECT "artistId", "accountNumber", "ifscCode" FROM "ArtistPayments" WHERE "artistId" = :artistId',
      { replacements: { artistId } },
    );
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

run();
