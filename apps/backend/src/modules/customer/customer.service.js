import { Op } from "sequelize";
import Artist from "../../models/Artist.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import ArtistSpecialization from "../../models/ArtistSpecialization.js";
import ArtistService from "../../models/ArtistService.js";
import Booking from "../../models/Booking.js";
import ArtistPortfolio from "../../models/ArtistPortfolio.js";

export const getArtists = async ({ minPrice, maxPrice, experience, location }) => {
  const where = { isVerified: true };
  const profileWhere = {};

  if (location) {
    profileWhere.location = {
      [Op.iLike]: `%${location}%`,
    };
  }

  return Artist.findAll({
    attributes: ["id", "name", "email", "phone", "createdAt"],
    where,
    include: [
      {
        model: ArtistProfile,
        as: "profile",
        where: Object.keys(profileWhere).length > 0 ? profileWhere : undefined,
        required: Object.keys(profileWhere).length > 0,
        attributes: ["profileImage", "gender", "bio", "location", "experience", "rating", "reviewCount"],
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
      {
        model: ArtistPortfolio,
        as: "portfolio",
        attributes: ["id", "beforeImageUrl", "afterImageUrl", "tag", "description"],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: 30,
  });
};

export const getTrendingArtists = async () => {
  const artists = await Artist.findAll({
    where: { isVerified: true },
    include: [
      {
        model: ArtistProfile,
        as: "profile",
        attributes: ["profileImage", "gender", "bio", "location", "experience", "rating", "reviewCount"],
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
      {
        model: ArtistPortfolio,
        as: "portfolio",
        attributes: ["id", "beforeImageUrl", "afterImageUrl", "tag", "description"],
      },
      {
        model: Booking,
        as: "bookings",
        where: { status: "completed" },
        required: false,
        attributes: ["id"],
      },
    ],
  });

  const C_r = 4.5; // prior mean rating
  const m_r = 5;   // prior weight for reviews

  const scoredArtists = artists.map((artist) => {
    const R = artist.profile?.rating ?? 4.5;
    const vr = artist.profile?.reviewCount ?? 0;
    const vb = artist.bookings?.length ?? 0;

    // Bayesian Weighted Rating
    const Wr = (vr / (vr + m_r)) * R + (m_r / (vr + m_r)) * C_r;

    // Log-scaled Completed Booking Volume Multiplier
    const popularity = 1 + Math.log(1 + vb);

    // Final score
    const score = Wr * popularity;

    return {
      artist,
      score,
      completedBookingsCount: vb,
    };
  });

  // Sort descending by score
  scoredArtists.sort((a, b) => b.score - a.score);

  // Take top 10 and attach rank details
  return scoredArtists.slice(0, 10).map((item, index) => {
    const artistJson = item.artist.toJSON();
    delete artistJson.bookings;
    return {
      ...artistJson,
      trendingRank: index + 1,
      trendingScore: parseFloat(item.score.toFixed(2)),
      completedBookingsCount: item.completedBookingsCount,
    };
  });
};
