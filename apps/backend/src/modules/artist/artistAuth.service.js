import bcrypt from "bcrypt";
import Artist from "../../models/Artist.js";
import generateToken from "../../utils/generateToken.js";

export const registerArtist = async (data) => {
  const { name, email, phone, password, pricing, experience } = data;

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required");
  }

  const existing = await Artist.findOne({ where: { email } });
  if (existing) {
    throw new Error("Artist already exists");
  }

  if (phone) {
    const phoneExists = await Artist.findOne({ where: { phone } });
    if (phoneExists) {
      throw new Error("Phone already in use");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const artist = await Artist.create({
    name,
    email,
    phone,
    password: hashedPassword,
    pricing,
    experience,
  });

  const artistData = artist.toJSON();
  delete artistData.password;

  return {
    artist: artistData,
    token: generateToken(artist.id),
  };
};

export const loginArtist = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const artist = await Artist.findOne({ where: { email } });
  if (!artist) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, artist.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const artistData = artist.toJSON();
  delete artistData.password;

  return {
    artist: artistData,
    token: generateToken(artist.id),
  };
};
