import { Op } from "sequelize";
import Message from "../../models/Message.js";
import Artist from "../../models/Artist.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import Customer from "../../models/Customer.js";
import Booking from "../../models/Booking.js";

// Helper to parse "YYYY-MM-DD" and "10:00 AM" into a JavaScript Date object
const parseAppointmentDateTime = (dateStr, timeStr) => {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    let hours = 0;
    let minutes = 0;
    if (timeStr) {
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
      }
    }
    return new Date(year, month - 1, day, hours, minutes);
  } catch (err) {
    return new Date(dateStr);
  }
};

// Check if chat room between an artist and customer is enabled
export const checkChatStatus = async (artistId, customerId) => {
  const bookings = await Booking.findAll({
    where: {
      artistId,
      customerId,
      status: {
        [Op.in]: ["confirmed", "in_progress", "completed"],
      },
    },
  });

  if (bookings.length === 0) {
    return { isEnabled: false, reason: "Chat is disabled because there is no active, confirmed booking." };
  }

  // If there is any active (confirmed or in progress) booking, chat is enabled
  const hasActive = bookings.some(b => ["confirmed", "in_progress"].includes(b.status));
  if (hasActive) {
    return { isEnabled: true };
  }

  // Check if any completed booking is within 5 days (120 hours)
  const now = new Date();
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

  const hasRecentCompleted = bookings.some(b => {
    if (b.status !== "completed") return false;
    const appointmentTime = parseAppointmentDateTime(b.date, b.time);
    const diff = now.getTime() - appointmentTime.getTime();
    return diff >= 0 && diff < fiveDaysMs;
  });

  if (hasRecentCompleted) {
    return { isEnabled: true };
  }

  return { isEnabled: false, reason: "Chat is locked because it has been more than 5 days since service completion." };
};

export const getArtistConversations = async (artistId) => {
  // Find all customers who have confirmed, in_progress, or completed bookings with this artist
  const bookings = await Booking.findAll({
    where: {
      artistId,
      status: {
        [Op.in]: ["confirmed", "in_progress", "completed"],
      },
    },
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name"],
      }
    ],
    order: [["createdAt", "DESC"]],
  });

  const customerMap = new Map();
  for (const b of bookings) {
    if (b.customer) {
      customerMap.set(b.customerId, b.customer);
    }
  }

  const customerIds = Array.from(customerMap.keys());
  if (customerIds.length === 0) {
    return [];
  }

  // Fetch messages between this artist and these customers
  const messages = await Message.findAll({
    where: {
      artistId,
      customerId: {
        [Op.in]: customerIds,
      },
    },
    order: [["createdAt", "ASC"]],
  });

  const conversationsMap = {};

  // Initialize conversations for all customers who have booking history
  for (const [custId, customer] of customerMap.entries()) {
    const chatStatus = await checkChatStatus(artistId, custId);
    conversationsMap[custId] = {
      id: String(custId),
      name: customer.name || "Client",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
      time: "",
      isTyping: false,
      lastMsg: "No messages yet",
      isChatEnabled: chatStatus.isEnabled,
      chatDisabledReason: chatStatus.reason || "",
      messages: [],
    };
  }

  // Populate messages
  for (const msg of messages) {
    const custId = msg.customerId;
    if (!conversationsMap[custId]) continue;

    const timeFormatted = msg.time || new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    conversationsMap[custId].messages.push({
      id: String(msg.id),
      text: msg.text,
      image: msg.image,
      time: timeFormatted,
      sender: msg.sender,
    });

    conversationsMap[custId].lastMsg = msg.text || (msg.image ? "Sent a photo" : "");
    conversationsMap[custId].time = timeFormatted;
  }

  // Order conversations: place ones with messages or recent activity first
  return Object.values(conversationsMap).sort((a, b) => {
    if (a.messages.length > 0 && b.messages.length === 0) return -1;
    if (a.messages.length === 0 && b.messages.length > 0) return 1;
    return 0;
  });
};

export const getCustomerConversations = async (customerId) => {
  // Find all artists who have confirmed, in_progress, or completed bookings with this customer
  const bookings = await Booking.findAll({
    where: {
      customerId,
      status: {
        [Op.in]: ["confirmed", "in_progress", "completed"],
      },
    },
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
      }
    ],
    order: [["createdAt", "DESC"]],
  });

  const artistMap = new Map();
  for (const b of bookings) {
    if (b.artist) {
      artistMap.set(b.artistId, b.artist);
    }
  }

  const artistIds = Array.from(artistMap.keys());
  if (artistIds.length === 0) {
    return [];
  }

  // Fetch messages between this customer and these artists
  const messages = await Message.findAll({
    where: {
      customerId,
      artistId: {
        [Op.in]: artistIds,
      },
    },
    order: [["createdAt", "ASC"]],
  });

  const conversationsMap = {};

  // Initialize conversations for all artists who have booking history
  for (const [artId, artist] of artistMap.entries()) {
    const chatStatus = await checkChatStatus(artId, customerId);
    conversationsMap[artId] = {
      id: String(artId),
      name: artist.name || "Makeup Artist",
      avatar: artist.profile?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
      time: "",
      isTyping: false,
      lastMsg: "No messages yet",
      isChatEnabled: chatStatus.isEnabled,
      chatDisabledReason: chatStatus.reason || "",
      messages: [],
    };
  }

  // Populate messages
  for (const msg of messages) {
    const artId = msg.artistId;
    if (!conversationsMap[artId]) continue;

    const timeFormatted = msg.time || new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  return Object.values(conversationsMap).sort((a, b) => {
    if (a.messages.length > 0 && b.messages.length === 0) return -1;
    if (a.messages.length === 0 && b.messages.length > 0) return 1;
    return 0;
  });
};

export const createMessage = async ({ artistId, customerId, sender, text, image, time }) => {
  const chatStatus = await checkChatStatus(artistId, customerId);
  if (!chatStatus.isEnabled) {
    throw new Error(chatStatus.reason || "Chat room is disabled. Communication is only allowed for active, confirmed bookings.");
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
