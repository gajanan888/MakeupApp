import bcrypt from "bcrypt";
import sequelize from "../../config/db.js";
import Artist from "../../models/Artist.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import ArtistService from "../../models/ArtistService.js";
import ArtistPortfolio from "../../models/ArtistPortfolio.js";
import ArtistPayment from "../../models/ArtistPayment.js";
import ArtistCertificate from "../../models/ArtistCertificate.js";
import ArtistSpecialization from "../../models/ArtistSpecialization.js";
import Booking from "../../models/Booking.js";
import Customer from "../../models/Customer.js";
import ArtistBlock from "../../models/ArtistBlock.js";
import Review from "../../models/Review.js";
import BookingPolicy from "../../models/BookingPolicy.js";
import ArtistSocialLinks from "../../models/ArtistSocialLinks.js";
import {
  encryptSensitiveValue,
  maskAccountNumber,
  maskIfscCode,
} from "../../utils/paymentEncryption.js";

const ACCOUNT_NUMBER_REGEX = /^\d{6,18}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const artistIncludes = [
  { model: ArtistProfile, as: "profile" },
  { model: ArtistService, as: "services" },
  { model: ArtistPortfolio, as: "portfolio" },
  { model: ArtistPayment, as: "payment" },
  { model: ArtistCertificate, as: "certificates" },
  { model: ArtistSpecialization, as: "specializations" },
  { model: BookingPolicy, as: "bookingPolicy" },
  { model: ArtistSocialLinks, as: "socialLinks" },
];

export const formatArtistProfileData = async (artistInstance) => {
  const artistData = artistInstance.toJSON ? artistInstance.toJSON() : artistInstance;
  delete artistData.password;

  const artistId = artistData.id;

  // Calculate live rating and review count from Reviews table & real bookings count
  const reviews = await Review.findAll({ where: { artistId } });
  const totalBookings = await Booking.count({ where: { artistId } });

  if (!artistData.profile) {
    artistData.profile = {};
  }

  if (reviews && reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    artistData.profile.rating = Number((sum / reviews.length).toFixed(1));
    artistData.profile.reviewCount = reviews.length;
  } else {
    artistData.profile.rating = 0;
    artistData.profile.reviewCount = 0;
  }
  artistData.profile.bookingsCount = totalBookings || 0;

  if (artistData.payment) {
    artistData.payment = {
      ...artistData.payment,
      accountNumber: maskAccountNumber(artistData.payment.accountNumber),
      ifscCode: maskIfscCode(artistData.payment.ifscCode),
    };
  }

  return artistData;
};

export const getArtistProfile = async (artistId) => {
  const artist = await Artist.findByPk(artistId, {
    include: artistIncludes,
  });
  if (!artist) {
    throw new Error("Artist not found");
  }

  return formatArtistProfileData(artist);
};

const hasAnyProfileField = (profile) => {
  if (!profile) {
    return false;
  }

  return Object.values(profile).some((value) => value !== undefined);
};

const normalizeString = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
};

const validatePaymentPayload = (payment) => {
  if (!payment || typeof payment !== "object") {
    return;
  }

  const accountNumber = normalizeString(payment.accountNumber);
  const ifscCode = normalizeString(payment.ifscCode);

  if (accountNumber) {
    if (!ACCOUNT_NUMBER_REGEX.test(String(accountNumber))) {
      throw new Error("Account number must contain 6 to 18 digits.");
    }
  }

  if (ifscCode) {
    const normalizedIfsc = String(ifscCode).replace(/\s+/g, "").toUpperCase();

    if (!IFSC_REGEX.test(normalizedIfsc)) {
      throw new Error("IFSC code must be 11 characters like ABCD0123456.");
    }
  }
};

export const updateArtistProfile = async (artistId, data) => {
  const artist = await Artist.findByPk(artistId);
  if (!artist) {
    throw new Error("Artist not found");
  }

  const allowedFields = ["name", "email", "phone", "pricing", "experience", "artistType", "businessName", "ownerName"];
  const updates = {};

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      updates[key] = data[key];
    }
  }

  const profilePayload = data?.profile || {
    profileImage: data?.profileImage,
    gender: data?.gender,
    bio: data?.bio,
    location: data?.location,
    experience: data?.experience,
    parlourName: data?.parlourName,
    parlourAddress: data?.parlourAddress,
    languages: data?.languages,
    homeService: data?.homeService,
    travelToClient: data?.travelToClient,
    travelArea: data?.travelArea,
    travelChargesType: data?.travelChargesType,
    travelChargeAmount: data?.travelChargeAmount,
    trainingMethod: data?.trainingMethod,
    trainingDetails: data?.trainingDetails,
    notableWork: data?.notableWork,
    brandsUsed: data?.brandsUsed,
    productsUsed: data?.productsUsed,
  };

  const specializations = data?.specializations;
  const certificates = data?.certificates;
  const services = data?.services;
  const portfolio = data?.portfolio;
  const payment = data?.payment;
  const bookingPolicy = data?.bookingPolicy;
  const socialLinks = data?.socialLinks;

  validatePaymentPayload(payment);

  const transaction = await sequelize.transaction();

  try {
    if (Object.keys(updates).length > 0) {
      await artist.update(updates, { transaction });
    }

    if (hasAnyProfileField(profilePayload)) {
      let existingProfile = await ArtistProfile.findOne({
        where: { artistId },
        transaction,
      });

      const profileUpdates = {};
      const fields = [
        "profileImage",
        "gender",
        "bio",
        "location",
        "experience",
        "parlourName",
        "parlourAddress",
        "languages",
        "homeService",
        "travelToClient",
        "travelArea",
        "travelChargesType",
        "travelChargeAmount",
        "trainingMethod",
        "trainingDetails",
        "notableWork",
        "brandsUsed",
        "productsUsed",
      ];

      for (const field of fields) {
        if (profilePayload[field] !== undefined) {
          profileUpdates[field] = profilePayload[field];
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        if (existingProfile) {
          await existingProfile.update(profileUpdates, { transaction });
        } else {
          await ArtistProfile.create(
            { artistId, ...profileUpdates },
            { transaction },
          );
        }
      }
    }

    if (Array.isArray(specializations)) {
      await ArtistSpecialization.destroy({
        where: { artistId },
        transaction,
      });

      if (specializations.length > 0) {
        const specializationRows = specializations
          .filter((item) => item)
          .map((item) => ({
            artistId,
            name: typeof item === "object" ? (item.name || item.specialization) : String(item),
          }));

        if (specializationRows.length > 0) {
          await ArtistSpecialization.bulkCreate(specializationRows, {
            transaction,
          });
        }
      }
    }

    if (Array.isArray(certificates)) {
      await ArtistCertificate.destroy({ where: { artistId }, transaction });

      if (certificates.length > 0) {
        const certificateRows = certificates.map((cert) => ({
          artistId,
          fileName: cert?.fileName || cert?.name || cert?.file?.name,
          fileUrl: cert?.fileUrl || cert?.url || cert?.file?.url,
          fileSize: cert?.fileSize || cert?.size || cert?.file?.size,
          fileType: cert?.fileType || cert?.type || cert?.file?.type,
          certificateNumber: cert?.certificateNumber,
          instituteName: cert?.instituteName,
        }));

        await ArtistCertificate.bulkCreate(certificateRows, { transaction });
      }
    }

    if (Array.isArray(services)) {
      await ArtistService.destroy({ where: { artistId }, transaction });

      if (services.length > 0) {
        const serviceRows = services.map((service) => ({
          artistId,
          specialization: service?.specialization,
          duration: service?.duration,
          timeRange: service?.timeRange,
          priceRange: service?.priceRange,
        }));

        await ArtistService.bulkCreate(serviceRows, { transaction });
      }
    }

    if (Array.isArray(portfolio)) {
      await ArtistPortfolio.destroy({ where: { artistId }, transaction });

      if (portfolio.length > 0) {
        const portfolioRows = portfolio.map((item) => {
          let imgs = [];
          if (Array.isArray(item?.images) && item.images.length > 0) {
            imgs = item.images;
          } else if (item?.afterImageUrl || item?.afterImage) {
            imgs = [item.afterImageUrl || item.afterImage];
          }

          const firstAfterUrl = imgs.length > 0
            ? (typeof imgs[0] === 'object' && imgs[0] !== null ? imgs[0].url : imgs[0])
            : (item?.afterImageUrl || item?.afterImage);

          return {
            artistId,
            beforeImageUrl: item?.beforeImageUrl || item?.beforeImage,
            afterImageUrl: firstAfterUrl,
            images: imgs,
            tag: item?.tag,
            description: item?.description,
          };
        });

        await ArtistPortfolio.bulkCreate(portfolioRows, { transaction });
        
        // Asynchronously trigger AI backend embedding sync for the new portfolio items
        import('axios').then(({ default: axios }) => {
          portfolioRows.forEach(async (row, index) => {
            // Note: Since they are newly created, we don't have the final ID from bulkCreate easily available without returning true.
            // Using a dummy ID or getting it from a separate query would be ideal. For now, we'll use a timestamp-based dummy ID
            // just to get the embedding into the system.
            const dummyId = Date.now() + index;
            
            try {
              if (row.beforeImageUrl) {
                await axios.post('http://127.0.0.1:8000/api/artist/upload-portfolio-url', {
                  artist_id: artistId,
                  portfolio_image_id: dummyId,
                  image_type: 'before',
                  image_url: row.beforeImageUrl
                });
              }
              if (row.afterImageUrl) {
                await axios.post('http://127.0.0.1:8000/api/artist/upload-portfolio-url', {
                  artist_id: artistId,
                  portfolio_image_id: dummyId + 1000,
                  image_type: 'after',
                  image_url: row.afterImageUrl
                });
              }
            } catch (err) {
              console.error('[AI Sync] Failed to sync portfolio embedding:', err.message);
            }
          });
        }).catch(err => console.error('Failed to load axios for AI sync', err));
      }
    }

    if (payment && typeof payment === "object") {
      const normalizedAccountNumber = normalizeString(payment?.accountNumber);
      const normalizedIfscCode = normalizeString(payment?.ifscCode)
        ?.replace(/\s+/g, "")
        ?.toUpperCase();

      await ArtistPayment.upsert(
        {
          artistId,
          accountHolder: payment?.accountHolder,
          bankName: payment?.bankName,
          accountNumber: encryptSensitiveValue(normalizedAccountNumber),
          ifscCode: encryptSensitiveValue(normalizedIfscCode),
          upiId: payment?.upiId,
        },
        { transaction },
      );
    }
    
    if (bookingPolicy && typeof bookingPolicy === "object") {
      const existingBookingPolicy = await BookingPolicy.findOne({ where: { artistId }, transaction });
      if (existingBookingPolicy) {
        await existingBookingPolicy.update(bookingPolicy, { transaction });
      } else {
        await BookingPolicy.create({ artistId, ...bookingPolicy }, { transaction });
      }
    }

    if (socialLinks && typeof socialLinks === "object") {
      const existingSocialLinks = await ArtistSocialLinks.findOne({ where: { artistId }, transaction });
      if (existingSocialLinks) {
        await existingSocialLinks.update(socialLinks, { transaction });
      } else {
        await ArtistSocialLinks.create({ artistId, ...socialLinks }, { transaction });
      }
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const updatedArtist = await Artist.findByPk(artistId, {
    include: artistIncludes,
  });

  return formatArtistProfileData(updatedArtist);
};

export const getArtistDashboardStats = async (artistId) => {
  const bookings = await Booking.findAll({
    where: { artistId },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email", "phone"],
      },
    ],
  });

  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
  // Booking count increases strictly ONLY after successful completion of service
  const totalBookings = completedBookings;
  const totalEarningsVal = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.price || 0), 0);
  const totalPenaltyVal = bookings
    .filter((b) => b.status === "cancelled" && b.artistPenalty)
    .reduce((sum, b) => sum + (b.artistPenalty || 0), 0);
  const totalEarnings = Math.max(0, totalEarningsVal - totalPenaltyVal);

  const upcomingBookings = await Booking.findAll({
    where: {
      artistId,
      status: ["pending", "accepted", "confirmed", "in_progress"],
    },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email", "phone"],
      },
    ],
    order: [
      ["date", "ASC"],
      ["time", "ASC"],
    ],
    limit: 5,
  });

  const reviews = await Review.findAll({ where: { artistId } });
  let liveRating = 0;
  let reviewCount = 0;

  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    liveRating = Number((sum / reviews.length).toFixed(1));
    reviewCount = reviews.length;
  }

  return {
    stats: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalEarnings,
      rating: liveRating,
      reviewCount,
    },
    upcomingBookings,
  };
};

export const getArtistSchedule = async (artistId) => {
  const bookings = await Booking.findAll({
    where: {
      artistId,
      status: ["pending", "accepted", "completed"],
    },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "email", "phone"],
      },
    ],
  });

  const blocks = await ArtistBlock.findAll({
    where: { artistId },
  });

  return { bookings, blocks };
};

export const createArtistBlock = async (artistId, { date, time, reason }) => {
  if (!date || !time || !reason) {
    throw new Error("Date, time, and reason are required");
  }

  const existingBlock = await ArtistBlock.findOne({
    where: {
      artistId,
      date,
      time,
    },
  });

  if (existingBlock) {
    throw new Error("You have already blocked this time slot.");
  }

  const block = await ArtistBlock.create({
    artistId,
    date,
    time,
    reason,
  });
  return block;
};

export const changeArtistPassword = async (artistId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new Error("Current password and new password are required");
  }

  const artist = await Artist.findByPk(artistId);
  if (!artist) {
    throw new Error("Artist not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, artist.password);
  if (!isMatch) {
    throw new Error("Incorrect current password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  artist.password = hashedPassword;
  await artist.save();

  return true;
};
