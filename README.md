# 📝 Task Management System
**Developed during my internship at Developer Hub corporation**  
**Developed by:** AbdulGhaffar-Dev-tech

## 📖 Project Description
A full-stack MERN application that allows users to manage tasks in real-time. This project has evolved from a basic CRUD app into a secure, multi-user collaboration platform featuring real-time notifications and role-based access control.


## ✨ New Features & Enhancements
* User Authentication: Secure Signup and Login system using JWT (JSON Web Tokens).
* Role-Based Access (RBAC): Distinction between Admin and User roles.
* Task Collaboration: Admins can share specific tasks with other users via email.
* Real-Time Notifications: Integrated Socket.io for instant alerts when tasks are shared or status updates occur.
* Task Ownership: Secure logic ensuring users only manage tasks they own or are authorized to collaborate on.
* Password Recovery: Integrated Nodemailer for "Forgot Password" and "Reset Password" functionality.
* Progress Tracking: Dynamic progress bar calculating completion percentage in real-time.
* Theme Management: Persistent Dark/Light mode toggle.

## 🚀 Tech Stack
*    **Frontend: React.js, Socket.io-client, Tailwind CSS

*    **Backend: Node.js & Express.js

*    **Real-Time: Socket.io

*    **Database: MongoDB (via Mongoose)

*    **Authentication: JWT & Bcrypt.js

*    **Mail Service: Nodemailer

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
* Authentication
* POST /api/auth/login — Authenticate user & return token.

* POST /api/auth/signup — Register a new user.

* Tasks & Collaboration
* GET /api/tasks — Retrieves tasks (Owned & Shared) for the authenticated user.

* POST /api/tasks — Adds a new task linked to the creator.

* PUT /api/tasks/:id — Updates an existing task (Authorized for Owner/Collaborator).

* PUT /api/tasks/:id/share — (Admin Only) Shares a task with another user.

* DELETE /api/tasks/:id — (Owner Only) Removes a specific task.
## 📸 Project Showcase
🔔 Real-Time Collaboration
* When an Admin shares a task, the user receives an instant notification without refreshing the page.

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