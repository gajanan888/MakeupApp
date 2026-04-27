const Artist = require('../models/artist.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (data) => {
  const {
    name,
    email,
    phone,
    password,
    experience_years,
    certifications,
    portfolio_url,
    bio,
    government_id_number
  } = data;

  const existing = await Artist.findOne({ where: { email } });
  if (existing) throw new Error("Artist already exists");

  const phoneExists = await Artist.findOne({ where: { phone } });
  if (phoneExists) throw new Error("Phone already in use");

  const password_hash = await bcrypt.hash(password, 10);

  const artist = await Artist.create({
    name,
    email,
    phone,
    password_hash,
    experience_years,
    certifications: JSON.stringify(certifications),
    portfolio_url,
    bio,
    government_id_number
  });

  const artistData = artist.toJSON();
  delete artistData.password_hash;

  artistData.certifications = JSON.parse(artistData.certifications);

  const token = jwt.sign(
    { id: artist.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { artist: artistData, token };
};


exports.login = async (email, password) => {
  const artist = await Artist.findOne({ where: { email } });
  if (!artist) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, artist.password_hash);
  if (!isMatch) throw new Error("Invalid email or password");

  const artistData = artist.toJSON();
  delete artistData.password_hash;

  artistData.certifications = JSON.parse(artistData.certifications);

  const token = jwt.sign(
    { id: artist.id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { artist: artistData, token };
};


exports.getProfile = async (artistId) => {
  const artist = await Artist.findByPk(artistId);

  if (!artist) throw new Error("Artist not found");

  const artistData = artist.toJSON();
  delete artistData.password_hash;

  artistData.certifications = JSON.parse(artistData.certifications);

  return artistData;
};


exports.updateProfile = async (artistId, data) => {
  const artist = await Artist.findByPk(artistId);
  if (!artist) throw new Error("Artist not found");

  if (data.certifications) {
    data.certifications = JSON.stringify(data.certifications);
  }

  await artist.update(data);

  const updated = artist.toJSON();
  delete updated.password_hash;

  updated.certifications = JSON.parse(updated.certifications);

  return updated;
};