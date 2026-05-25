import Artist from "../../models/Artist.js";

export const getArtistProfile = async (artistId) => {
  const artist = await Artist.findByPk(artistId);
  if (!artist) {
    throw new Error("Artist not found");
  }

  const artistData = artist.toJSON();
  delete artistData.password;

  return artistData;
};

export const updateArtistProfile = async (artistId, data) => {
  const artist = await Artist.findByPk(artistId);
  if (!artist) {
    throw new Error("Artist not found");
  }

  const allowedFields = ["name", "email", "phone", "pricing", "experience"];
  const updates = {};

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      updates[key] = data[key];
    }
  }

  await artist.update(updates);

  const updated = artist.toJSON();
  delete updated.password;

  return updated;
};
