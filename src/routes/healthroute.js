const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/", (req, res) => {
  const readyState = mongoose.connection.readyState;
  const isDbConnected = readyState === 1;

  const healthData = {
    status: isDbConnected ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: isDbConnected ? "connected" : "disconnected",
      readyState,
    },
  };

  const statusCode = isDbConnected ? 200 : 503;
  res.status(statusCode).json(healthData);
});

module.exports = router;
