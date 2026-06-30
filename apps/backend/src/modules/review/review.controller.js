import { createReview, getArtistReviews } from "./review.service.js";

export const createReviewController = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
        data: null,
      });
    }

    const { rating, comment } = req.body;
    if (rating === undefined || rating === null) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
        data: null,
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
        data: null,
      });
    }

    const review = await createReview({
      bookingId,
      customerId: req.customer.id,
      rating: numRating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to submit review",
      data: null,
    });
  }
};

export const getArtistReviewsController = async (req, res) => {
  try {
    const artistId = Number(req.params.artistId);
    if (!Number.isInteger(artistId) || artistId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid artist id",
        data: null,
      });
    }

    const reviews = await getArtistReviews(artistId);

    res.json({
      success: true,
      message: "Artist reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch artist reviews",
      data: null,
    });
  }
};
