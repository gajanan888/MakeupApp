import test from "node:test";
import assert from "node:assert/strict";
import sequelize from "../src/config/db.js";
import {
  sendEmailOtp,
  registerArtist,
  loginArtist,
} from "../src/modules/artist/auth/auth.service.js";
import {
  getArtistProfile,
  updateArtistProfile,
} from "../src/modules/artist/artist.service.js";
import Artist from "../src/models/Artist.js";
import EmailOtp from "../src/models/EmailOtp.js";

test.beforeEach(async () => {
  // Sync all models to the in-memory SQLite database before each test
  await sequelize.sync({ force: true });
});

// Helper function to register artist during testing using OTP flow
const registerArtistForTest = async (data) => {
  await sendEmailOtp({ email: data.email, name: data.name });
  const otpRecord = await EmailOtp.findOne({ where: { email: data.email } });
  return registerArtist({ ...data, emailOtpCode: otpRecord.otp });
};

test("artist setup supports signup, login, profile, and profile update", async () => {
  const signupData = {
    name: "Asha Artist",
    email: "asha@example.com",
    phone: "9999999999",
    password: "top-secret",
    pricing: "5000",
    experience: "5 years",
  };

  // Sign up the artist using the verified registration flow helper
  const signup = await registerArtistForTest(signupData);

  assert.ok(signup.token, "Should return a token on signup");
  assert.equal(signup.artist.email, signupData.email);
  assert.equal(signup.artist.name, signupData.name);
  assert.equal(signup.artist.password, undefined, "Password should not be returned");

  // Force set email verified so login test works
  const artistObj = await Artist.findByPk(signup.artist.id);
  artistObj.isEmailVerified = true;
  await artistObj.save();

  // 2. Login the artist
  const login = await loginArtist({
    email: signupData.email,
    password: signupData.password,
  });

  assert.ok(login.token, "Should return a token on login");
  assert.equal(login.artist.email, signupData.email);
  assert.equal(login.artist.password, undefined, "Password should not be returned");

  // 3. Get the profile
  const profile = await getArtistProfile(signup.artist.id);
  assert.equal(profile.name, signupData.name);

  // 4. Update the profile
  const updated = await updateArtistProfile(signup.artist.id, {
    bio: "Luxury bridal specialist",
    specializations: ["bridal", "editorial"],
  });

  assert.equal(updated.profile.bio, "Luxury bridal specialist");
  assert.equal(updated.specializations.length, 2);
  assert.equal(updated.specializations[0].name, "bridal");
  assert.equal(updated.specializations[1].name, "editorial");
});

test("artist setup rejects duplicate email and phone signup", async () => {
  const data = {
    name: "Asha Artist",
    email: "asha@example.com",
    phone: "9999999999",
    password: "top-secret",
  };

  await registerArtistForTest(data);

  // Attempt duplicate email signup
  await assert.rejects(
    () => registerArtistForTest({ ...data, phone: "8888888888" }),
    /Artist already exists/
  );

  // Attempt duplicate phone signup
  await assert.rejects(
    () => registerArtistForTest({ ...data, email: "new@example.com" }),
    /Phone already in use/
  );
});

test("artist setup rejects bad login and missing profiles", async () => {
  const data = {
    name: "Asha Artist",
    email: "asha@example.com",
    phone: "9999999999",
    password: "top-secret",
  };

  const signup = await registerArtistForTest(data);
  const artistObj = await Artist.findByPk(signup.artist.id);
  artistObj.isEmailVerified = true;
  await artistObj.save();

  // Try wrong password
  await assert.rejects(
    () => loginArtist({ email: data.email, password: "wrong-password" }),
    /Invalid email or password/
  );

  // Try non-existent email
  await assert.rejects(
    () => loginArtist({ email: "missing@example.com", password: data.password }),
    /Invalid email or password/
  );

  // Try missing profile lookup
  await assert.rejects(
    () => getArtistProfile(404),
    /Artist not found/
  );
});
