import sequelize from "../src/config/db.js";
import ArtistPayment from "../src/models/ArtistPayment.js";
import { encryptSensitiveValue } from "../src/utils/paymentEncryption.js";

async function run() {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    const payments = await ArtistPayment.findAll();
    console.log("Found payment rows:", payments.length);

    let updatedCount = 0;

    for (const payment of payments) {
      const plainAccountNumber = payment.accountNumber;
      const plainIfscCode = payment.ifscCode;

      const encryptedAccountNumber = encryptSensitiveValue(plainAccountNumber);
      const encryptedIfscCode = encryptSensitiveValue(plainIfscCode);

      const changed =
        encryptedAccountNumber !== plainAccountNumber ||
        encryptedIfscCode !== plainIfscCode;

      if (changed) {
        await payment.update({
          accountNumber: encryptedAccountNumber,
          ifscCode: encryptedIfscCode,
        });
        updatedCount += 1;
      }
    }

    console.log("Updated rows:", updatedCount);
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
}

run();
