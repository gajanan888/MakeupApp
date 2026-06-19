import {
  getArtistConversations,
  getCustomerConversations,
  createMessage,
} from "./message.service.js";

export const getArtistConversationsController = async (req, res) => {
  try {
    const artistId = req.artist.id;
    const conversations = await getArtistConversations(artistId);
    
    res.json({
      success: true,
      message: "Conversations fetched successfully",
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch conversations",
      data: null,
    });
  }
};

export const getCustomerConversationsController = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const conversations = await getCustomerConversations(customerId);

    res.json({
      success: true,
      message: "Conversations fetched successfully",
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch conversations",
      data: null,
    });
  }
};

export const sendMessageFromArtistController = async (req, res) => {
  try {
    const artistId = req.artist.id;
    const { customerId, text, image, time } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
        data: null,
      });
    }

    const message = await createMessage({
      artistId,
      customerId,
      sender: "artist",
      text,
      image,
      time,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send message",
      data: null,
    });
  }
};

export const sendMessageFromCustomerController = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { artistId, text, image, time } = req.body;

    if (!artistId) {
      return res.status(400).json({
        success: false,
        message: "Artist ID is required",
        data: null,
      });
    }

    const message = await createMessage({
      artistId,
      customerId,
      sender: "client",
      text,
      image,
      time,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send message",
      data: null,
    });
  }
};
