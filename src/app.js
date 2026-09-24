const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authroute");
const taskRoutes = require("./routes/taskroute");

const app = express();

// Security and logging middlewares
app.use(helmet());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("Task Manager API is running");
});

module.exports = app;
