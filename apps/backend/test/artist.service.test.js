import test from "node:test";
import assert from "node:assert/strict";
import sequelize from "../src/config/db.js";
import {
  registerArtist,
  loginArtist,
} from "../src/modules/artist/artistAuth.service.js";
import {
  getArtistProfile,
  updateArtistProfile,
} from "../src/modules/artist/artist.service.js";

test.beforeEach(async () => {
  // Sync all models to the in-memory SQLite database before each test
  await sequelize.sync({ force: true });
});

test("artist setup supports signup, login, profile, and profile update", async () => {
  const signupData = {
    name: "Asha Artist",
    email: "asha@example.com",
    phone: "9999999999",
    password: "top-secret",
    pricing: "5000",
    experience: "5 years",
  };

  // 1. Sign up the artist
  const signup = await registerArtist(signupData);

  assert.ok(signup.token, "Should return a token on signup");
  assert.equal(signup.artist.email, signupData.email);
  assert.equal(signup.artist.name, signupData.name);
  assert.equal(signup.artist.password, undefined, "Password should not be returned");

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
  assert.equal(updated.password, undefined);
});

test("artist setup rejects duplicate email and phone signup", async () => {
  const data = {
    name: "Asha Artist",
    email: "asha@example.com",
    phone: "9999999999",
    password: "top-secret",
  };

  await registerArtist(data);

  // Attempt duplicate email signup
  await assert.rejects(
    () => registerArtist({ ...data, phone: "8888888888" }),
    /Artist already exists/
  );

  // Attempt duplicate phone signup
  await assert.rejects(
    () => registerArtist({ ...data, email: "new@example.com" }),
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

  await registerArtist(data);

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

  // Try update on missing profile
  await assert.rejects(
    () => updateArtistProfile(404, { bio: "Missing" }),
    /Artist not found/
  );
});
