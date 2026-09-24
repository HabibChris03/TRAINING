Task Manager Backend API

This is a simple REST API built with Node.js, Express, and MongoDB. It allows users to register, log in, and manage their daily tasks. Each user can create, view, update, and delete their own tasks.

What Each Task Contains:
Each task in the database has five main pieces of information:
1. Title: The name of the task. This is required.
2. Description: Extra details or notes about the task.
3. Status: Can only be one of three values: todo, in-progress, or done. The default is todo.
4. Due Date: An optional deadline date for the task.
5. User ID: The ID of the person who created it, so only they can see it.

How to Install and Set Up the Project:
First, open your terminal in the project folder and install the dependencies:
npm install

Next, create a file named .env in the project root folder and put your settings inside:
PORT=3000
MONGODB_URL=mongodb+srv://<>:<>@cluster0.q0jjlm9.mongodb.net/?appName=Cluster0
JWT_SECRET=mysecretkey
 I used MongoDB Atlas in the cloud, you can replace the MONGODB_URL line with your own Atlas connection link.

How to Run the Application:
To run the project while developing with auto-restart:
npm run dev

To start the server normally:
npm start

The server will start listening at http://localhost:3000.

How to Run the Automated Tests:
To run the automated test suite, type:
npm test

This will run all 8 tests with Jest to make sure registration, login, route protection, task creation, validation, filtering, updating, and deleting work properly.

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
Here is a quick summary of the security risks we took care of:

1. Password Safety:
We never save passwords in plain text. We hash every password using bcrypt before saving it into MongoDB. This protects user passwords if the database is ever inspected.

2. Protecting Private Routes:
We put an auth middleware on all /tasks routes. Any request without a valid JWT token gets blocked with a 401 Unauthorized status.

3. Keeping Users and Tasks Isolated:
Every task stores the creator userId. When anyone tries to view, edit, or delete a task, the code checks that the task belongs to that exact user. User A cannot view, edit, or delete tasks belonging to User B.

4. Input Checking and Clean Errors:
If someone forgets the title or gives an invalid status or bad date, the server sends back a clear error message instead of crashing.
