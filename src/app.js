const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authroute");
const taskRoutes = require("./routes/taskroute");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// Simple health check route
app.get("/", (req, res) => {
  res.send("Task Manager API is running");
});

module.exports = app;
