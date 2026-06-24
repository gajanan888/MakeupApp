import { Op } from "sequelize";
import Message from "../../models/Message.js";
import Artist from "../../models/Artist.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import Customer from "../../models/Customer.js";
import Booking from "../../models/Booking.js";

export const getArtistConversations = async (artistId) => {
  // Find all customer IDs who have confirmed bookings with this artist
  const activeBookings = await Booking.findAll({
    where: {
      artistId,
      status: {
        [Op.in]: ["confirmed", "in_progress", "completed"],
      },
    },
    attributes: ["customerId"],
  });

  const customerIds = Array.from(new Set(activeBookings.map(b => b.customerId)));
  if (customerIds.length === 0) {
    return [];
  }

  // Find subset of customer IDs that have active confirmed/in_progress bookings
  const enabledBookings = await Booking.findAll({
    where: {
      artistId,
      status: {
        [Op.in]: ["confirmed", "in_progress"],
      },
    },
    attributes: ["customerId"],
  });
  const enabledCustomerIds = new Set(enabledBookings.map(b => b.customerId));

  const messages = await Message.findAll({
    where: {
      artistId,
      customerId: {
        [Op.in]: customerIds,
      },
    },
    order: [["createdAt", "ASC"]],
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name"],
      },
    ],
  });

  const conversationsMap = {};
  for (const msg of messages) {
    const custId = msg.customerId;
    const timeFormatted = msg.time || new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!conversationsMap[custId]) {
      conversationsMap[custId] = {
        id: String(custId),
        name: msg.customer?.name || "Client",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200", // Default avatar
        time: timeFormatted,
        isTyping: false,
        lastMsg: msg.text || (msg.image ? "Sent a photo" : ""),
        isChatEnabled: enabledCustomerIds.has(custId),
        messages: [],
      };
    }

    conversationsMap[custId].messages.push({
      id: String(msg.id),
      text: msg.text,
      image: msg.image,
      time: timeFormatted,
      sender: msg.sender, // 'artist' or 'client'
    });

    // Update last msg info
    conversationsMap[custId].lastMsg = msg.text || (msg.image ? "Sent a photo" : "");
    conversationsMap[custId].time = timeFormatted;
  }

  return Object.values(conversationsMap);
};

export const getCustomerConversations = async (customerId) => {
  // Find all artist IDs who have confirmed bookings with this customer
  const activeBookings = await Booking.findAll({
    where: {
      customerId,
      status: {
        [Op.in]: ["confirmed", "in_progress", "completed"],
      },
    },
    attributes: ["artistId"],
  });

  const artistIds = Array.from(new Set(activeBookings.map(b => b.artistId)));
  if (artistIds.length === 0) {
    return [];
  }

  // Find subset of artist IDs that have active confirmed/in_progress bookings with this customer
  const enabledBookings = await Booking.findAll({
    where: {
      customerId,
      status: {
        [Op.in]: ["confirmed", "in_progress"],
      },
    },
    attributes: ["artistId"],
  });
  const enabledArtistIds = new Set(enabledBookings.map(b => b.artistId));

  const messages = await Message.findAll({
    where: {
      customerId,
      artistId: {
        [Op.in]: artistIds,
      },
    },
    order: [["createdAt", "ASC"]],
    include: [
      {
        model: Artist,
        as: "artist",
        attributes: ["id", "name"],
        include: [
          {
            model: ArtistProfile,
            as: "profile",
            attributes: ["profileImage"],
          },
        ],
      },
    ],
  });

  const conversationsMap = {};
  for (const msg of messages) {
    const artId = msg.artistId;
    const timeFormatted = msg.time || new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!conversationsMap[artId]) {
      conversationsMap[artId] = {
        id: String(artId),
        name: msg.artist?.name || "Makeup Artist",
        avatar: msg.artist?.profile?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
        time: timeFormatted,
        isTyping: false,
        lastMsg: msg.text || (msg.image ? "Sent a photo" : ""),
        isChatEnabled: enabledArtistIds.has(artId),
        messages: [],
      };
    }

    conversationsMap[artId].messages.push({
      id: String(msg.id),
      text: msg.text,
      image: msg.image,
      time: timeFormatted,
      sender: msg.sender,
    });

    conversationsMap[artId].lastMsg = msg.text || (msg.image ? "Sent a photo" : "");
    conversationsMap[artId].time = timeFormatted;
  }

  return Object.values(conversationsMap);
};

export const createMessage = async ({ artistId, customerId, sender, text, image, time }) => {
  // Verify active confirmed/in-progress booking exists
  const booking = await Booking.findOne({
    where: {
      artistId,
      customerId,
      status: {
        [Op.in]: ["confirmed", "in_progress"],
      },
    },
  });

  if (!booking) {
    throw new Error("Chat room is disabled. Communication is only allowed for active, confirmed bookings.");
  }

  const timeFormatted = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return Message.create({
    artistId,
    customerId,
    sender,
    text,
    image,
    time: timeFormatted,
  });
};
