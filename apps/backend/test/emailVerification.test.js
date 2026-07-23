import test from "node:test";
import assert from "node:assert/strict";
import sequelize from "../src/config/db.js";
import {
  sendEmailOtp,
  registerArtist,
  loginArtist,
} from "../src/modules/artist/auth/auth.service.js";
import Artist from "../src/models/Artist.js";
import EmailOtp from "../src/models/EmailOtp.js";

test.beforeEach(async () => {
  await sequelize.sync({ force: true });
});

test("Artist registration-only after email OTP verification flow", async () => {
  const artistData = {
    name: "Jane Artist",
    email: "jane.artist@example.com",
    password: "password123",
  };

  // 1. Send Email OTP
  await sendEmailOtp({ email: artistData.email, name: artistData.name });

  // Verify OTP record exists in DB
  const otpRecord = await EmailOtp.findOne({ where: { email: artistData.email } });
  assert.ok(otpRecord, "EmailOtp record should be created");
  assert.ok(otpRecord.otp, "Verification code should be generated");

  // Verify Artist account is NOT in the database yet
  let artist = await Artist.findOne({ where: { email: artistData.email } });
  assert.equal(artist, null, "Artist account should NOT be created before OTP verification");

  // 2. Try registration with wrong OTP code (should fail and not create account)
  await assert.rejects(
    () => registerArtist({ ...artistData, emailOtpCode: "000000" }),
    /Invalid verification code/
  );

  artist = await Artist.findOne({ where: { email: artistData.email } });
  assert.equal(artist, null, "Artist account should still NOT be created after failed OTP verification");

  // 3. Register with correct OTP code (should succeed and delete OTP record)
  const regResult = await registerArtist({
    ...artistData,
    emailOtpCode: otpRecord.otp,
  });

  assert.ok(regResult.artist, "Artist account should be created successfully");
  assert.equal(regResult.artist.isEmailVerified, true, "Artist should be verified immediately");

  // Verify OTP record is deleted
  const deletedOtp = await EmailOtp.findOne({ where: { email: artistData.email } });
  assert.equal(deletedOtp, null, "EmailOtp record should be deleted after successful registration");

  // Verify Artist account exists in DB now
  const savedArtist = await Artist.findByPk(regResult.artist.id);
  assert.ok(savedArtist, "Artist should exist in DB");
  assert.equal(savedArtist.isEmailVerified, true, "isEmailVerified in DB should be true");

  // 4. Try login (should succeed)
  const loginResult = await loginArtist({
    email: artistData.email,
    password: artistData.password,
  });
  assert.ok(loginResult.token, "Login should succeed and return JWT token");
});
