import { Op } from "sequelize";
import Artist from "../../models/Artist.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import ArtistSpecialization from "../../models/ArtistSpecialization.js";
import ArtistService from "../../models/ArtistService.js";

export const getArtists = async ({ minPrice, maxPrice, experience }) => {
  const where = {};

  return Artist.findAll({
    attributes: ["id", "name", "email", "phone", "createdAt"],
    where,
    include: [
      {
        model: ArtistProfile,
        as: "profile",
        attributes: ["profileImage", "gender", "bio", "location", "experience"],
      },
      {
        model: ArtistSpecialization,
        as: "specializations",
        attributes: ["id", "name"],
      },
      {
        model: ArtistService,
        as: "services",
        attributes: ["id", "specialization", "duration", "timeRange", "priceRange"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 30,
  });
};
