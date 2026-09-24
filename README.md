Task Manager Backend API

This is a REST API built with Node.js, Express, and MongoDB. It allows users to register, log in, and manage their daily tasks. Each user can create, view, update, and delete their own tasks.

What Each Task Contains:
Each task in the database has five main pieces of information:
1. Title: The name of the task. This is required and must be text.
2. Description: Extra details or notes about the task.
3. Status: Can only be one of three values: todo, in-progress, or done. The default is todo.
4. Due Date: An optional deadline date for the task.
5. User ID: The ID of the person who created it, so only they can see it.

How to Install and Set Up the Project:
First, open your terminal in the project folder and install the dependencies:
npm install

Next, create a file named .env in the project root folder and put your settings inside:
PORT=3000
MONGODB_URL=mongodb://localhost:27017/taskmanager
JWT_SECRET=set_a_long_random_secret_phrase_here

Important Note on JWT_SECRET:
You must provide your own strong secret key in the .env file. The application requires this variable to run securely. Do not share your secret key publicly.

If you use MongoDB Atlas in the cloud, you can replace the MONGODB_URL line with your own Atlas connection link.

How to Run the Application:
To run the project while developing with auto-restart:
npm run dev

To start the server normally:
npm start

The server will start listening at http://localhost:3000.

How to Run the Automated Tests:
To run the automated test suite, type:
npm test

This will run the test suite against a real MongoDB database instance to verify registration, login, rate limiting, NoSQL injection defenses, task creation, validation, filtering, updating, and deleting.

How to Use the API Endpoints:

1. Register a new user:
Send a POST request to /auth/register with this JSON body:
{
  "name": "Habib",
  "email": "habib@example.com",
  "password": "mypassword123"
}
The server will return a success message and your JWT token.

2. Login:
Send a POST request to /auth/login with this JSON body:
{
  "email": "habib@example.com",
  "password": "mypassword123"
}
The server will check your credentials and send back your JWT token.
Note: Login is protected by rate limiting. After 10 failed attempts from the same IP address within 15 minutes, requests will be temporarily blocked.

3. Create a task:
Send a POST request to /tasks.
Make sure to add the header:
Authorization: Bearer YOUR_TOKEN_HERE
And send this JSON body:
{
  "title": "Buy groceries",
  "description": "Milk, eggs, and bread",
  "status": "todo",
  "dueDate": "2026-10-01"
}

4. Get all tasks:
Send a GET request to /tasks.
Include the header:
Authorization: Bearer YOUR_TOKEN_HERE
You will get a list of all tasks created by your account.

5. Filter tasks by status:
You can filter your tasks by adding ?status= to the web address:
GET /tasks?status=todo
GET /tasks?status=in-progress
GET /tasks?status=done
Include the header:
Authorization: Bearer YOUR_TOKEN_HERE

6. Update a task:
Send a PUT request to /tasks/YOUR_TASK_ID with the fields you want to update:
{
  "status": "done"
}
Include the header:
Authorization: Bearer YOUR_TOKEN_HERE

7. Delete a task:
Send a DELETE request to /tasks/YOUR_TASK_ID.
Include the header:
Authorization: Bearer YOUR_TOKEN_HERE

Security Risks Handled:
Here is a summary of the security protections included in this project:

1. Secret Key Enforcement:
The API requires JWT_SECRET from the environment and does not fall back to any hardcoded default keys.

2. NoSQL Injection Prevention:
User inputs such as email and password are required to be text strings and are checked for valid email formats before querying MongoDB. Objects or query operators are rejected with a 400 Bad Request.

3. Protection Against Brute Force Guessing:
A rate limiter on the login endpoint limits repeated attempts to prevent password guessing.

4. Password Safety:
Passwords are never saved in plain text. They are hashed using bcrypt with 10 salt rounds before saving to the database.

5. Route Protection:
All task endpoints are protected by authentication middleware. Requests without a valid JWT token receive a 401 Unauthorized status.

6. User Data Isolation:
Tasks are scoped to the user ID of the owner. Users cannot view, update, or delete tasks belonging to other accounts.

7. Input Type Validation:
All fields are checked to ensure appropriate data types. Sending non-text values (such as numbers for titles) returns clear 400 validation messages rather than unhandled 500 server crashes.

8. HTTP Security Headers and Logging:
Helmet is enabled to configure standard security headers, and Morgan logs HTTP requests during development.
