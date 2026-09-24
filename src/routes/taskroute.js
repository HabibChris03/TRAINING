const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} = require("../controllers/taskcontroller");

// Protect all routes with auth middleware
router.use(auth);

// CRUD routes
router.post("/", createTask);
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;