require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log("Database connected");
    return sequelize.sync(); // remove in strict production
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("DB Error:", err);
  });

