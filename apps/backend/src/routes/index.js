import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';

const router= express.Router();

Router.use("/auth", authRoutes);

export default router;