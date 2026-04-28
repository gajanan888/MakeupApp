import { Op } from "sequelize";
import Artist from "../../models/Artist.js";

export const getArtists = async ({ minPrice, maxPrice, experience }) => {
  const where = {};

  if (minPrice !== undefined || maxPrice !== undefined) {
    const pricingRange = {};

    if (minPrice !== undefined) {
      const parsedMin = Number(minPrice);
      if (!Number.isNaN(parsedMin)) {
        pricingRange[Op.gte] = parsedMin;
      }
    }

    if (maxPrice !== undefined) {
      const parsedMax = Number(maxPrice);
      if (!Number.isNaN(parsedMax)) {
        pricingRange[Op.lte] = parsedMax;
      }
    }

    if (Object.keys(pricingRange).length > 0) {
      where.pricing = pricingRange;
    }
  }

  if (experience !== undefined) {
    const parsedExperience = Number(experience);
    if (!Number.isNaN(parsedExperience)) {
      where.experience = { [Op.gte]: parsedExperience };
    }
  }

  return Artist.findAll({
    attributes: ["id", "name", "pricing", "experience"],
    where,
    order: [["pricing", "ASC"]],
    limit: 20,
  });
};
