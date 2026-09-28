const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const requestId = require("./middleware/requestId");
const structuredLogger = require("./middleware/logger");
const healthRoute = require("./routes/healthroute");
const authRoutes = require("./routes/authroute");
const taskRoutes = require("./routes/taskroute");

const app = express();

// Request tracking and structured logging
app.use(requestId);
app.use(structuredLogger);

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Public health and root routes
app.use("/health", healthRoute);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Task Manager API is running",
    health: "/health",
  });
});

// Application routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

module.exports = app;
