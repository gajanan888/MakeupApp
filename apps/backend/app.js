const express = require('express');
const app = express();

const artistRoutes = require('./src/routes/artist.routes');

app.use(express.json());

app.use('/api/artists', artistRoutes);

module.exports = app;
