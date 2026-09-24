const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/auth");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "Server misconfiguration: JWT_SECRET is not set" });
    }

    const { name, email, password } = req.body;

    // Validate types to prevent NoSQL injection and bad inputs
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ message: "Name, email, and password must be text" });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "1d" });

    res.status(201).json({
      message: "Registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "Server misconfiguration: JWT_SECRET is not set" });
    }

    const { email, password } = req.body;

    // Validate types to prevent NoSQL injection attacks (e.g. { "email": { "$gt": "" } })
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password must be text" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "1d" });

    res.status(200).json({
      message: "Logged in successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { register, login };