const request = require("supertest");
const jwt = require("jsonwebtoken");

// In-memory data arrays for easy testing
let mockTasks = [];
let mockUsers = [];
let mockCounter = 1;

// Easy Mock Task Model
const mockTaskMethods = {
  find: (query = {}) => ({
    sort: () => {
      let result = mockTasks.filter((t) => t.userId === query.userId);
      if (query.status) {
        result = result.filter((t) => t.status === query.status);
      }
      return Promise.resolve(result);
    },
  }),
  findOne: async (query = {}) => {
    const task = mockTasks.find((t) => t._id === query._id && t.userId === query.userId);
    if (!task) return null;
    return {
      ...task,
      save: async function () {
        const index = mockTasks.findIndex((t) => t._id === task._id);
        mockTasks[index] = this;
        return this;
      },
    };
  },
  findOneAndDelete: async (query = {}) => {
    const index = mockTasks.findIndex((t) => t._id === query._id && t.userId === query.userId);
    if (index === -1) return null;
    return mockTasks.splice(index, 1)[0];
  },
};

function mockTaskModel(data) {
  this._id = "507f1f77bcf86cd79943901" + mockCounter++;
  this.title = data.title;
  this.description = data.description || "";
  this.status = data.status || "todo";
  this.dueDate = data.dueDate || null;
  this.userId = data.userId;
  this.save = async () => {
    mockTasks.push(this);
    return this;
  };
}
Object.assign(mockTaskModel, mockTaskMethods);

// Easy Mock User Model
const mockUserMethods = {
  findOne: async (query = {}) => {
    return mockUsers.find((u) => u.email === query.email) || null;
  },
};

function mockUserModel(data) {
  this._id = "507f191e810c19729de860e" + mockCounter++;
  this.name = data.name;
  this.email = data.email;
  this.password = data.password;
  this.save = async () => {
    mockUsers.push(this);
    return this;
  };
}
Object.assign(mockUserModel, mockUserMethods);

// Mock the models using mock prefix
jest.mock("../src/models/task", () => mockTaskModel);
jest.mock("../src/models/auth", () => mockUserModel);

const app = require("../src/app");

describe("Simple Task Management API Tests", () => {
  let token;
  const testUserId = "507f191e810c19729de860e1";

  beforeEach(() => {
    mockTasks = [];
    mockUsers = [];
    mockCounter = 1;

    // Create a simple test JWT token
    token = jwt.sign({ userId: testUserId }, "mysecretkey", { expiresIn: "1h" });
  });

  // 1. User Register
  test("1. Should register a user and return a token", async () => {
    const res = await request(app).post("/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.message).toBe("Registered successfully");
  });

  // 2. User Login
  test("2. Should login a registered user and return a token", async () => {
    // First register
    await request(app).post("/auth/register").send({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
    });

    // Then login
    const res = await request(app).post("/auth/login").send({
      email: "jane@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.message).toBe("Logged in successfully");
  });

  // 3. Reject access without token
  test("3. Should reject accessing /tasks without a token (401)", async () => {
    const res = await request(app).get("/tasks");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("No token provided, authorization denied");
  });

  // 4. Create Task
  test("4. Should create a task when authenticated", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Buy groceries",
        description: "Milk, Bread, Eggs",
        status: "todo",
        dueDate: "2026-10-01",
      });

    expect(res.status).toBe(201);
    expect(res.body.task).toBeDefined();
    expect(res.body.task.title).toBe("Buy groceries");
    expect(res.body.task.status).toBe("todo");
  });

  // 5. Validation error when title is missing
  test("5. Should return 400 if title is missing", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "No title here",
        status: "todo",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Title is required");
  });

  // 6. View all tasks and filter by status
  test("6. Should get tasks and filter tasks by status", async () => {
    // Create 2 tasks
    await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task 1", status: "todo" });

    await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task 2", status: "done" });

    // Get all tasks
    const allRes = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${token}`);
    expect(allRes.status).toBe(200);
    expect(allRes.body.length).toBe(2);

    // Filter by status = todo
    const filterRes = await request(app)
      .get("/tasks?status=todo")
      .set("Authorization", `Bearer ${token}`);
    expect(filterRes.status).toBe(200);
    expect(filterRes.body.length).toBe(1);
    expect(filterRes.body[0].status).toBe("todo");
  });

  // 7. Update Task
  test("7. Should update a task", async () => {
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
    expect(updateRes.body.task.status).toBe("done");
  });

  // 8. Delete Task
  test("8. Should delete a task by ID", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task to delete", status: "todo" });

    const taskId = createRes.body.task._id;

    const deleteRes = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Task deleted successfully");
  });
});
