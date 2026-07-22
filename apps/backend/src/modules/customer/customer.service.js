import { Op } from "sequelize";
import Artist from "../../models/Artist.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import ArtistSpecialization from "../../models/ArtistSpecialization.js";
import ArtistService from "../../models/ArtistService.js";
import Booking from "../../models/Booking.js";
import ArtistPortfolio from "../../models/ArtistPortfolio.js";

export const getArtists = async ({ minPrice, maxPrice, experience, location, id, page, limit, search, category, rating, priceRange, gender }) => {
  const where = { isVerified: true };

  if (id) {
    where.id = id;
    delete where.isVerified;
  }

  // Fetch all to perform reliable JS filtering & mapping (since prices are strings like "₹1,500")
  const allArtists = await Artist.findAll({
    attributes: ["id", "name", "email", "phone", "createdAt"],
    where,
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
        attributes: ["id", "beforeImageUrl", "afterImageUrl", "tag", "description", "images"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Filter in memory for maximum consistency and accuracy
  let filtered = allArtists;

  if (location) {
    const locLower = location.toLowerCase().trim();
    filtered = filtered.filter(artist => 
      artist.profile?.location && artist.profile.location.toLowerCase().includes(locLower)
    );
  }

  if (rating) {
    const ratingNum = parseFloat(rating);
    filtered = filtered.filter(artist => {
      const r = Number(artist.profile?.rating ?? artist.rating ?? 4.7);
      return r >= ratingNum;
    });
  }

  if (category && category !== 'All') {
    const catLower = category.toLowerCase().trim();
    filtered = filtered.filter(artist => {
      const specMatch = artist.specializations?.some(spec => 
        spec.name && spec.name.toLowerCase().includes(catLower)
      );
      const serviceMatch = artist.services?.some(svc => 
        svc.specialization && svc.specialization.toLowerCase().includes(catLower)
      );
      return specMatch || serviceMatch;
    });
  }

  if (priceRange) {
    filtered = filtered.filter(artist => {
      const artistPrice = artist.services?.[0]?.priceRange
        ? parseInt(artist.services[0].priceRange.replace(/[^\d]/g, ''), 10)
        : 1500;
      if (priceRange === '0-2000') {
        return artistPrice <= 2000;
      } else if (priceRange === '2000-5000') {
        return artistPrice > 2000 && artistPrice <= 5000;
      } else if (priceRange === '5000+') {
        return artistPrice > 5000;
      }
      return true;
    });
  }

  if (search) {
    const searchLower = search.toLowerCase().trim();
    filtered = filtered.filter(artist => {
      const nameMatch = artist.name && artist.name.toLowerCase().includes(searchLower);
      const bioMatch = artist.profile?.bio && artist.profile.bio.toLowerCase().includes(searchLower);
      const specMatch = artist.specializations?.some(spec => 
        spec.name && spec.name.toLowerCase().includes(searchLower)
      );
      const serviceMatch = artist.services?.some(svc => 
        svc.specialization && svc.specialization.toLowerCase().includes(searchLower)
      );
      return nameMatch || bioMatch || specMatch || serviceMatch;
    });
  }

  if (gender) {
    const genderLower = gender.toLowerCase().trim();
    filtered = filtered.filter(artist => 
      artist.profile?.gender && artist.profile.gender.toLowerCase() === genderLower
    );
  }

  // Paginate
  const pageNum = page ? parseInt(page, 10) : 1;
  const limitNum = limit ? parseInt(limit, 10) : 20;
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = pageNum * limitNum;

  return filtered.slice(startIndex, endIndex);
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
        attributes: ["id", "beforeImageUrl", "afterImageUrl", "tag", "description", "images"],
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
