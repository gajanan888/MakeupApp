/**
 * seed_test_customer.mjs
 * Creates a test customer account with known credentials.
 * Run: node seed_test_customer.mjs
 */
import bcrypt from "bcrypt";
import sequelize from "./src/config/db.js";
import Customer from "./src/models/Customer.js";

const TEST_EMAIL    = "customer@test.com";
const TEST_PHONE    = "9000000001";
const TEST_PASSWORD = "Test@1234";
const TEST_NAME     = "Test Customer";

try {
  await sequelize.authenticate();
  console.log("✅ Connected to database");

  const existing = await Customer.findOne({ where: { email: TEST_EMAIL } });
  if (existing) {
    // Update password to known value
    existing.password = await bcrypt.hash(TEST_PASSWORD, 10);
    await existing.save();
    console.log("✅ Test customer already exists — password reset to:", TEST_PASSWORD);
    console.log("   Email:", TEST_EMAIL);
    console.log("   Phone:", existing.phone || TEST_PHONE);
  } else {
    const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
    await Customer.create({
      name:     TEST_NAME,
      email:    TEST_EMAIL,
      phone:    TEST_PHONE,
      password: hashed,
    });
    console.log("✅ Test customer created!");
    console.log("   Email:", TEST_EMAIL);
    console.log("   Phone:", TEST_PHONE);
    console.log("   Password:", TEST_PASSWORD);
  }

  console.log("\n📱 Use these credentials to log in to the app.");
} catch (err) {
  console.error("❌ Error:", err.message);
} finally {
  await sequelize.close();
  process.exit(0);
}
