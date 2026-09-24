const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

// Set JWT_SECRET for test environment before requiring app
process.env.JWT_SECRET = "test_environment_secure_jwt_secret_key";
process.env.NODE_ENV = "test";

const app = require("../src/app");
const Task = require("../src/models/task");
const User = require("../src/models/auth");

let mongoServer;
let token;
let userId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
  await User.deleteMany({});

  // Create a real test user in MongoDB
  const res = await request(app).post("/auth/register").send({
    name: "Habib",
    email: "habib@example.com",
    password: "password123",
  });

  token = res.body.token;
  userId = res.body.user.id;
});

describe("Authentication & Security", () => {
  test("registers a new user in MongoDB", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();

    const userInDb = await User.findOne({ email: "alice@example.com" });
    expect(userInDb).not.toBeNull();
    expect(userInDb.name).toBe("Alice");
  });

  test("logs in an existing user and returns token", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "habib@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("blocks NoSQL injection attempt when email is not text", async () => {
    const res = await request(app).post("/auth/login").send({
      email: { $gt: "" },
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/text/i);
  });

  test("blocks access to tasks without token", async () => {
    const res = await request(app).get("/tasks");
    expect(res.status).toBe(401);
  });
});

describe("Task CRUD with Real MongoDB", () => {
  test("creates a task in MongoDB", async () => {
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

    const savedTask = await Task.findOne({ title: "Finish assignment" });
    expect(savedTask).not.toBeNull();
    expect(savedTask.userId.toString()).toBe(userId);
  });

  test("rejects task creation if title is missing", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Missing title",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Title is required/i);
  });

  test("rejects non-text title with 400 instead of 500 server crash", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: 12345,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must be text/i);
  });

  test("retrieves tasks and filters by status from MongoDB", async () => {
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
    expect(filterRes.body[0].title).toBe("Task 1");
  });

  test("updates an existing task in MongoDB", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Original Title", status: "todo" });

    const taskId = createRes.body.task._id;

    const updateRes = await request(app)
      .put(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Title", status: "done" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.task.title).toBe("Updated Title");

    const updatedInDb = await Task.findById(taskId);
    expect(updatedInDb.title).toBe("Updated Title");
    expect(updatedInDb.status).toBe("done");
  });

  test("deletes a task by id from MongoDB", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task to delete", status: "todo" });

    const taskId = createRes.body.task._id;

    const deleteRes = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const deletedFromDb = await Task.findById(taskId);
    expect(deletedFromDb).toBeNull();
  });
});
