import Review from "../../models/Review.js";
import Booking from "../../models/Booking.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import Customer from "../../models/Customer.js";

export const createReview = async ({ bookingId, customerId, rating, comment }) => {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.customerId !== customerId) {
    throw new Error("You are not authorized to review this booking");
  }

  if (booking.status !== "completed") {
    throw new Error("You can only review completed services");
  }

  // Check if duplicate review exists
  const existingReview = await Review.findOne({ where: { bookingId } });
  if (existingReview) {
    throw new Error("You have already reviewed this service");
  }

  // Create the review
  const review = await Review.create({
    bookingId,
    customerId,
    artistId: booking.artistId,
    rating: parseFloat(rating),
    comment: comment || "",
  });

  // Recalculate average rating and reviewCount for the artist
  const reviews = await Review.findAll({
    where: { artistId: booking.artistId },
    attributes: ["rating"],
  });

  const totalReviews = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

  // Update ArtistProfile with the new rating and reviewCount
  const [profile] = await ArtistProfile.findOrCreate({
    where: { artistId: booking.artistId },
    defaults: {
      rating: parseFloat(avgRating.toFixed(2)),
      reviewCount: totalReviews,
    },
  });

  if (profile) {
    profile.rating = parseFloat(avgRating.toFixed(2));
    profile.reviewCount = totalReviews;
    await profile.save();
  }

  return review;
};

export const getArtistReviews = async (artistId) => {
  return Review.findAll({
    where: { artistId },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};
