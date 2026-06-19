import Message from "../../models/Message.js";
import Artist from "../../models/Artist.js";
import ArtistProfile from "../../models/ArtistProfile.js";
import Customer from "../../models/Customer.js";

export const getArtistConversations = async (artistId) => {
  const messages = await Message.findAll({
    where: { artistId },
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
  const messages = await Message.findAll({
    where: { customerId },
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
