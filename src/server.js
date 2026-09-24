const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const { connectDB } = require("./config/mongodb");

const PORT = process.env.PORT || 3000;

connectDB();

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;