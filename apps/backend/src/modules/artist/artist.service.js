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
];

export const getArtistProfile = async (artistId) => {
  const artist = await Artist.findByPk(artistId, {
    include: artistIncludes,
  });
  if (!artist) {
    throw new Error("Artist not found");
  }

  const artistData = artist.toJSON();
  delete artistData.password;

  if (artistData.payment) {
    artistData.payment = {
      ...artistData.payment,
      accountNumber: maskAccountNumber(artistData.payment.accountNumber),
      ifscCode: maskIfscCode(artistData.payment.ifscCode),
    };
  }

  return artistData;
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

  const allowedFields = ["name", "email", "phone", "pricing", "experience"];
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
  };

  const specializations = data?.specializations;
  const certificates = data?.certificates;
  const services = data?.services;
  const portfolio = data?.portfolio;
  const payment = data?.payment;

  validatePaymentPayload(payment);

  const transaction = await sequelize.transaction();

  try {
    if (Object.keys(updates).length > 0) {
      await artist.update(updates, { transaction });
    }

    if (hasAnyProfileField(profilePayload)) {
      await ArtistProfile.upsert(
        {
          artistId,
          profileImage: profilePayload.profileImage,
          gender: profilePayload.gender,
          bio: profilePayload.bio,
          location: profilePayload.location,
          experience: profilePayload.experience,
        },
        { transaction },
      );
    }

    if (Array.isArray(specializations)) {
      await ArtistSpecialization.destroy({
        where: { artistId },
        transaction,
      });

      if (specializations.length > 0) {
        const specializationRows = specializations
          .filter((name) => name)
          .map((name) => ({ artistId, name }));

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
        const portfolioRows = portfolio.map((item) => ({
          artistId,
          beforeImageUrl: item?.beforeImageUrl || item?.beforeImage,
          afterImageUrl: item?.afterImageUrl || item?.afterImage,
          tag: item?.tag,
          description: item?.description,
        }));

        await ArtistPortfolio.bulkCreate(portfolioRows, { transaction });
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

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const updatedArtist = await Artist.findByPk(artistId, {
    include: artistIncludes,
  });

  const updated = updatedArtist?.toJSON();
  if (updated) {
    delete updated.password;

    if (updated.payment) {
      updated.payment = {
        ...updated.payment,
        accountNumber: maskAccountNumber(updated.payment.accountNumber),
        ifscCode: maskIfscCode(updated.payment.ifscCode),
      };
    }
  }

  return updated;
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

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
  const totalEarnings = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.price || 0), 0);

  const upcomingBookings = await Booking.findAll({
    where: {
      artistId,
      status: ["pending", "accepted"],
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

  return {
    stats: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalEarnings,
      rating: 4.8,
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
