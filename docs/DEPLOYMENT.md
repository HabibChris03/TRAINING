Cloud Deployment Guide (Render & Zero Secrets)

This guide explains how to deploy the Task Manager API to the cloud using Render free tier without exposing any secrets in the repository.

1. Prerequisites:
- A GitHub account with this repository pushed.
- A free Render account (https://render.com).
- A free MongoDB Atlas cluster connection string.

2. Deploying on Render (Option A: Blueprints via render.yaml):
- Log in to your Render dashboard.
- Click 'New +' and select 'Blueprint'.
- Connect your GitHub repository 'HabibChris03/TRAINING'.
- Render will detect the render.yaml file automatically.
- When prompted for environment variables:
  Set MONGODB_URL to your MongoDB Atlas connection string.
  Set JWT_SECRET to your strong secret key.
- Click 'Apply'. Render will build and deploy the service.

3. Deploying on Render (Option B: Web Service directly):
- Click 'New +' and select 'Web Service'.
- Connect your GitHub repository.
- Configure the service:
  Name: task-manager-api
  Runtime: Node
  Build Command: npm ci
  Start Command: npm start
  Health Check Path: /health
- In the 'Environment Variables' section, add:
  PORT = 3000
  NODE_ENV = production
  MONGODB_URL = your MongoDB Atlas connection URI
  JWT_SECRET = your secure random secret key
- Click 'Create Web Service'.

4. Verifying Cloud Deployment:
- Once deployed, Render provides a public URL (e.g., https://task-manager-api.onrender.com).
- Open the health endpoint in your browser:
  https://task-manager-api.onrender.com/health
- You will receive:
  {
    "status": "healthy",
    "timestamp": "...",
    "uptimeSeconds": 12,
    "database": {
      "status": "connected",
      "readyState": 1
    }
  }

5. Continuous Deployment & GitHub Actions:
- Render automatically re-deploys whenever a Pull Request is merged into the main branch.
- In Render Dashboard under Service Settings, you can copy the 'Deploy Hook' URL.
- In your GitHub Repository, go to Settings -> Secrets and variables -> Actions.
- Add a new repository secret:
  Name: RENDER_DEPLOY_HOOK_URL
  Value: <your Render deploy hook URL>
- Merging PRs to main will automatically trigger the CI/CD pipeline and deployment!
