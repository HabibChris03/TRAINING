const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { register, login } = require("../controllers/authcontroller");

// Limit login attempts to protect against brute-force password guessing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", register);
router.post("/login", loginLimiter, login);

module.exports = router;
