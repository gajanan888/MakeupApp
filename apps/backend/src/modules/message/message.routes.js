import express from "express";
import {
  getArtistConversationsController,
  getCustomerConversationsController,
  sendMessageFromArtistController,
  sendMessageFromCustomerController,
} from "./message.controller.js";
import { protectCustomer } from "../../middleware/authMiddleware.js";
import { protectArtist } from "../../middleware/artistAuth.js";

const router = express.Router();

router.get("/artist/conversations", protectArtist, getArtistConversationsController);
router.post("/artist/send", protectArtist, sendMessageFromArtistController);

router.get("/customer/conversations", protectCustomer, getCustomerConversationsController);
router.post("/customer/send", protectCustomer, sendMessageFromCustomerController);

export default router;
