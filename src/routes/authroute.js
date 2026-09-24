const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");

router.use("/", authController);

module.exports = router;
