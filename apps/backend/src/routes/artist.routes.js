const express = require('express');
const router = express.Router();

const artistController = require('../controllers/artist.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/signup', artistController.signup);
router.post('/login', artistController.login);

router.get('/profile', authMiddleware, artistController.getProfile);
router.put('/profile', authMiddleware, artistController.updateProfile);

module.exports = router;