const artistService = require('../services/artist.service');

exports.signup = async (req, res) => {
  try {
    const result = await artistService.signup(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await artistService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const artist = await artistService.getProfile(req.user.id);
    res.status(200).json(artist);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const artist = await artistService.updateProfile(req.user.id, req.body);
    res.status(200).json(artist);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};