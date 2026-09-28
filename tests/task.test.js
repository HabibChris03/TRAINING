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

  // Create a test user in MongoDB
  const res = await request(app).post("/auth/register").send({
    name: "Habib",
    email: "habib@example.com",
    password: "password123",
  });

  token = res.body.token;
  userId = res.body.user.id;
});

describe("System Health & Request Tracking (TM-5)", () => {
  test("returns 200 and healthy status when database is connected", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.database.status).toBe("connected");
    expect(res.body.database.readyState).toBe(1);
    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  test("attaches an X-Request-Id header to responses", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-request-id"]).toBeDefined();
    expect(typeof res.headers["x-request-id"]).toBe("string");
  });

  test("preserves client-provided X-Request-Id header", async () => {
    const customId = "client-trace-id-12345";
    const res = await request(app)
      .get("/health")
      .set("X-Request-Id", customId);

    expect(res.headers["x-request-id"]).toBe(customId);
  });
});

describe("Authentication & Security (TM-2)", () => {
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

  test("enforces user isolation: users only see their own tasks", async () => {
    // Create task for Habib
    await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Habib Private Task", status: "todo" });

    // Register user Alice
    const aliceRes = await request(app).post("/auth/register").send({
      name: "Alice",
      email: "alice2@example.com",
      password: "password123",
    });
    const aliceToken = aliceRes.body.token;

    // Alice queries tasks
    const res = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0); // Alice cannot see Habib's task
  });
});

describe("Task CRUD & Null Handling Bugfix (TM-1)", () => {
  test("creates a task with valid data in MongoDB", async () => {
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

  test("rejects task creation if title is null", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: null,
        status: "todo",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/title/i);
  });

  test("rejects task creation if status is null", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Valid Title",
        status: null,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/status/i);
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

  test("rejects updating task with null title", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Original Title", status: "todo" });

    const taskId = createRes.body.task._id;

    const updateRes = await request(app)
      .put(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: null });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body.message).toMatch(/title/i);
  });

  test("rejects updating task with null status", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Original Title", status: "todo" });

    const taskId = createRes.body.task._id;

    const updateRes = await request(app)
      .put(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: null });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body.message).toMatch(/status/i);
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
