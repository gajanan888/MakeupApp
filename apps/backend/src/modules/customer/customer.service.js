import { Op } from "sequelize";
import Artist from "../../models/Artist.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import ArtistSpecialization from "../../models/ArtistSpecialization.js";
import ArtistService from "../../models/ArtistService.js";
import Booking from "../../models/Booking.js";
import ArtistPortfolio from "../../models/ArtistPortfolio.js";
import Review from "../../models/Review.js";

/**
 * Calculates Bayesian Rating Score for artist ranking
 * Bayesian Weighted Rating formula:
 *   WR = (v / (v + m)) * R + (m / (v + m)) * C
 * where:
 *   v = number of reviews (reviewCount)
 *   m = prior review weight threshold parameter (e.g. 5)
 *   R = average rating of the artist
 *   C = global mean rating across artists (prior mean)
 *
 * Final Bayesian Score includes a log-scaled completed booking volume multiplier:
 *   Score = WR * (1 + ln(1 + completedBookingsCount))
 */
const calculateBayesianScore = (artistJson, globalMean, m_r = 5) => {
  const R = Number(artistJson.profile?.rating ?? globalMean);
  const vr = Number(artistJson.profile?.reviewCount ?? 0);
  const vb = artistJson.bookings?.length ?? 0;

  const isNew = vr === 0 && vb === 0;

  // Bayesian Weighted Rating
  const bayesianRating = (vr / (vr + m_r)) * R + (m_r / (vr + m_r)) * globalMean;

  // Log-scaled Completed Booking Volume Multiplier
  const popularity = 1 + Math.log(1 + vb);

  // Final score completely based on Bayesian rating algorithm
  const bayesianScore = parseFloat((bayesianRating * popularity).toFixed(4));
  const formattedBayesianRating = parseFloat(bayesianRating.toFixed(2));

  // Dynamic 0-100 "Glam Score" based on Bayesian rating algorithm
  // For new artists with 0 reviews & 0 bookings, glamScore is null (displays "New" badge)
  const rawGlamScore = 60 + (bayesianScore - 4.5) * 4.0;
  const glamScore = isNew ? null : Math.max(50.0, Math.min(99.9, parseFloat(rawGlamScore.toFixed(1))));

  return {
    isNew,
    bayesianRating: formattedBayesianRating,
    bayesianScore,
    glamScore,
  };
};

export const getArtists = async ({ minPrice, maxPrice, experience, location, id, page, limit, search, category, rating, priceRange, gender }) => {
  const where = { isVerified: true };

  if (id) {
    where.id = id;
  }

  // Fetch all verified artists to perform reliable filtering & Bayesian rating calculations
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
      {
        model: Booking,
        as: "bookings",
        required: false,
        attributes: ["id", "status"],
      },
      {
        model: Review,
        as: "reviews",
        required: false,
        attributes: ["id", "rating"],
      },
    ],
  });

  const C_r = 4.5;
  const m_r = 5;

  const validRatings = allArtists
    .map(a => Number(a.profile?.rating))
    .filter(r => !isNaN(r) && r > 0);

  const globalMean = validRatings.length > 0
    ? validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
    : C_r;

  // Score every artist using the Bayesian rating algorithm and compute real live metrics
  const scoredArtists = allArtists.map((artist) => {
    const artistJson = artist.toJSON ? artist.toJSON() : artist;

    const reviewsList = artistJson.reviews || [];
    const bookingsList = artistJson.bookings || [];

    const completedBookingsList = bookingsList.filter(b => b.status === "completed");
    const totalBookingsCount = completedBookingsList.length;
    const realReviewCount = reviewsList.length;

    let realRating = 0;
    if (realReviewCount > 0) {
      const sum = reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0);
      realRating = Number((sum / realReviewCount).toFixed(1));
    } else if (artistJson.profile?.rating && Number(artistJson.profile.rating) > 0) {
      realRating = Number(artistJson.profile.rating);
    }

    if (!artistJson.profile) {
      artistJson.profile = {};
    }

    artistJson.profile.rating = realRating;
    artistJson.profile.reviewCount = realReviewCount;
    artistJson.profile.bookingsCount = totalBookingsCount;

    const { bayesianRating, bayesianScore, glamScore } = calculateBayesianScore(artistJson, globalMean, m_r);

    delete artistJson.bookings;
    delete artistJson.reviews;

    return {
      ...artistJson,
      bayesianRating,
      bayesianScore,
      glamScore,
    };
  });

  // Filter in memory for maximum consistency and accuracy
  let filtered = scoredArtists;

  if (location) {
    const locLower = location.toLowerCase().trim();
    const tokens = locLower.split(',').map(t => t.trim()).filter(Boolean);

    const locFiltered = filtered.filter(artist => {
      if (!artist.profile?.location) return false;
      const artLoc = artist.profile.location.toLowerCase().trim();
      return (
        artLoc.includes(locLower) ||
        locLower.includes(artLoc) ||
        tokens.some(t => t.length > 2 && (artLoc.includes(t) || t.includes(artLoc)))
      );
    });

    // If matching artists found for location, use them; otherwise keep all verified artists
    if (locFiltered.length > 0) {
      filtered = locFiltered;
    }
  }

  if (rating) {
    const ratingNum = parseFloat(rating);
    filtered = filtered.filter(artist => {
      const r = Number(artist.bayesianRating ?? artist.profile?.rating ?? 4.5);
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

  // Sort completely based on the Bayesian rating algorithm score (descending)
  filtered.sort((a, b) => b.bayesianScore - a.bayesianScore);

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

  const C_r = 4.5;
  const m_r = 5;

  const validRatings = artists
    .map(a => Number(a.profile?.rating))
    .filter(r => !isNaN(r) && r > 0);

  const globalMean = validRatings.length > 0
    ? validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length
    : C_r;

  const scoredArtists = artists.map((artist) => {
    const artistJson = artist.toJSON ? artist.toJSON() : artist;
    const { bayesianRating, bayesianScore, glamScore } = calculateBayesianScore(artistJson, globalMean, m_r);
    const vb = artistJson.bookings?.length ?? 0;

    delete artistJson.bookings;

    return {
      artistJson,
      score: bayesianScore,
      bayesianRating,
      glamScore,
      completedBookingsCount: vb,
    };
  });

  // Sort descending strictly based on Bayesian rating score
  scoredArtists.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Take top 10 and attach rank details
  return scoredArtists.slice(0, 10).map((item, index) => {
    return {
      ...item.artistJson,
      bayesianRating: item.bayesianRating,
      bayesianScore: item.score,
      glamScore: item.glamScore,
      trendingRank: index + 1,
      trendingScore: item.glamScore,
      completedBookingsCount: item.completedBookingsCount,
    };
  });
};

