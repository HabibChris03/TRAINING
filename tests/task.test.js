const request = require("supertest");
const jwt = require("jsonwebtoken");

let mockTasks = [];
let mockUsers = [];

jest.mock("../src/models/task", () => {
  return function (data) {
    this._id = "task_" + (mockTasks.length + 1);
    Object.assign(this, data);
    this.save = async () => {
      mockTasks.push(this);
      return this;
    };
  };
});

const Task = require("../src/models/task");
Task.find = (filter = {}) => ({
  sort: () => Promise.resolve(
    mockTasks.filter((t) => t.userId === filter.userId && (!filter.status || t.status === filter.status))
  ),
});
Task.findOne = async (filter) => {
  const item = mockTasks.find((t) => t._id === filter._id && t.userId === filter.userId);
  if (!item) return null;
  return {
    ...item,
    save: async function () {
      const index = mockTasks.findIndex((t) => t._id === item._id);
      mockTasks[index] = this;
      return this;
    },
  };
};
Task.findOneAndDelete = async (filter) => {
  const index = mockTasks.findIndex((t) => t._id === filter._id && t.userId === filter.userId);
  return index !== -1 ? mockTasks.splice(index, 1)[0] : null;
};

jest.mock("../src/models/auth", () => {
  return function (data) {
    this._id = "user_" + (mockUsers.length + 1);
    Object.assign(this, data);
    this.save = async () => {
      mockUsers.push(this);
      return this;
    };
  };
});

const User = require("../src/models/auth");
User.findOne = async (filter) => mockUsers.find((u) => u.email === filter.email) || null;

const app = require("../src/app");

describe("Task API Tests", () => {
  let token;
  const userId = "test_user_1";

  beforeEach(() => {
    mockTasks = [];
    mockUsers = [];
    token = jwt.sign({ userId }, "mysecretkey", { expiresIn: "1h" });
  });

  test("registers a new user", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  test("logs in an existing user", async () => {
    await request(app).post("/auth/register").send({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
    });

    const res = await request(app).post("/auth/login").send({
      email: "jane@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("returns 401 when token is missing", async () => {
    const res = await request(app).get("/tasks");
    expect(res.status).toBe(401);
  });

  test("creates a task when authenticated", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Finish assignment",
        description: "Study for the exam",
        status: "todo",
      });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe("Finish assignment");
  });

  test("rejects task creation if title is missing", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Missing title",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Title is required");
  });

  test("retrieves tasks and filters by status", async () => {
    await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task 1", status: "todo" });

    await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task 2", status: "done" });

    const allRes = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${token}`);
    expect(allRes.status).toBe(200);
    expect(allRes.body.length).toBe(2);

    const filterRes = await request(app)
      .get("/tasks?status=todo")
      .set("Authorization", `Bearer ${token}`);
    expect(filterRes.status).toBe(200);
    expect(filterRes.body.length).toBe(1);
    expect(filterRes.body[0].status).toBe("todo");
  });

  test("updates an existing task", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Initial Title", status: "todo" });

    const taskId = createRes.body.task._id;

    const updateRes = await request(app)
      .put(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New Title", status: "done" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.task.title).toBe("New Title");
    expect(updateRes.body.task.status).toBe("done");
  });

  test("deletes a task by id", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Delete Me", status: "todo" });

    const taskId = createRes.body.task._id;

    const deleteRes = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Task deleted successfully");
  });
});
