# 📝 Task Management System
**Developed during my internship at Developer Hub**  
**Developed by:** AbdulGhaffar-Dev-tech

## 📖 Project Description
A full-stack MERN application that allows users to manage tasks in real-time. This project has been upgraded from a basic CRUD app to a secure, multi-user platform where each user manages their own private database of tasks.

## ✨ New Features & Enhancements

* User Authentication: Secure Signup and Login system using JWT (JSON Web Tokens).

* Task Ownership: Tasks are now linked to specific User IDs; users only see their own tasks.

* Password Recovery: Integrated Email service for "Forgot Password" and "Reset Password" functionality.

* Advanced Task Metadata: Added support for Priority Levels (Easy, Medium, Hard) and Due Dates.

* Progress Tracking: Dynamic progress bar that calculates completion percentage based on user tasks.

* Theme Management: Persistent Dark/Light mode toggle.

## 🚀 Tech Stack
*   **Frontend:** React.js
*   **Backend:** Node.js & Express.js
*   **Database:** MongoDB compass
*   **Authentication: JWT & Bcrypt.js
*   **Mail Service: Nodemailer

## ⚙️ Setup Instructions
To run this project locally, follow these steps:

1. **Backend Setup:**
   ```bash
   # Navigate to backend directory
   cd "INTERNSHIP PROJ"
   # Create a .env file add:
   # MONGO_URI, JWT_SECRET, EMAIL_USER, and EMAIL_PASS
   npm install
   npm start 

2. **Frontend Setup:**
   ```bash
   # Navigate to frontend directory
   cd task-frontend
   npm install
   npm run dev

## 🔌 API Endpoints
*  POST /api/auth/login — Authenticate user & return token.
*  POST /api/auth/signup — Register a new user.
*  GET /api/tasks/my-tasks/:userId — Retrieves tasks belonging to a specific user.
*  POST /api/tasks — Adds a new task linked to a User ID.
*  PUT /api/tasks/:id — Updates an existing task.
*  DELETE /api/tasks/:id — Removes a specific task.

## 📸 Screenshots

### Main Dashboard
![Dashboard](./screenshots/dashboard.png)

### Adding a New Task
![Add Task](./screenshots/add-task.png)

### Dark Mode
![Dark mode](./screenshots/Dark-mode.png)

### Edit Task
![Edit Task](./screenshots/editTask.png)

### Login Page
![Login Page](./screenshots/login.png)

### Signup Page
![Signup Page](./screenshots/Signup.png)

### Forgot
![Forgot](./screenshots/forgot.png)

### Resest
![Reset](./screenshots/reset.png)

*The dashboard displays the list of tasks fetched from MongoDB and allows for real-time task management.*