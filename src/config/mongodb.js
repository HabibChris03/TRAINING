const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function connectDB() {
  const url = process.env.MONGODB_URL || "mongodb://localhost:27017/taskmanager";
  try {
    await mongoose.connect(url);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err.message);
  }
}

module.exports = { connectDB };