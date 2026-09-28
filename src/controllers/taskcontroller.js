const Task = require("../models/task");

const validStatuses = ["todo", "in-progress", "done"];

async function createTask(req, res) {
  try {
    const { title, description, status, dueDate } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ message: "Title is required and must be text" });
    }

    if (description !== undefined && description !== null && typeof description !== "string") {
      return res.status(400).json({ message: "Description must be text" });
    }

    if (status !== undefined) {
      if (!status || typeof status !== "string" || !validStatuses.includes(status.trim())) {
        return res.status(400).json({ message: "Status must be todo, in-progress, or done" });
      }
    }

    if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
      if (typeof dueDate !== "string" && !(dueDate instanceof Date)) {
        return res.status(400).json({ message: "Invalid due date format" });
      }
      if (isNaN(Date.parse(dueDate))) {
        return res.status(400).json({ message: "Invalid due date format" });
      }
    }

    const task = new Task({
      title: title.trim(),
      description: description ? description.trim() : "",
      status: status ? status.trim() : "todo",
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: req.user.userId,
    });

    await task.save();
    res.status(201).json({ message: "Task created successfully", task });
  } catch (_err) {
    res.status(500).json({ message: "Server error" });
  }
}

async function getTasks(req, res) {
  try {
    const filter = { userId: req.user.userId };
    if (req.query.status) {
      if (!validStatuses.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (_err) {
    res.status(500).json({ message: "Server error" });
  }
}

async function getTaskById(req, res) {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (_err) {
    res.status(400).json({ message: "Invalid task ID or task not found" });
  }
}

async function updateTask(req, res) {
  try {
    const { title, description, status, dueDate } = req.body;

    if (title !== undefined) {
      if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ message: "Title cannot be empty and must be text" });
      }
    }

    if (description !== undefined && description !== null && typeof description !== "string") {
      return res.status(400).json({ message: "Description must be text" });
    }

    if (status !== undefined) {
      if (!status || typeof status !== "string" || !validStatuses.includes(status.trim())) {
        return res.status(400).json({ message: "Status must be todo, in-progress, or done" });
      }
    }

    if (dueDate !== undefined && dueDate !== null && dueDate !== "") {
      if (typeof dueDate !== "string" && !(dueDate instanceof Date)) {
        return res.status(400).json({ message: "Invalid due date format" });
      }
      if (isNaN(Date.parse(dueDate))) {
        return res.status(400).json({ message: "Invalid due date format" });
      }
    }

    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description ? description.trim() : "";
    if (status !== undefined) task.status = status.trim();
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    await task.save();
    res.status(200).json({ message: "Task updated successfully", task });
  } catch (_err) {
    res.status(400).json({ message: "Invalid task ID or server error" });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (_err) {
    res.status(400).json({ message: "Invalid task ID or server error" });
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};