# Task Management System

A full-stack task management application developed for the **Koncepthive Full Stack Web Developer Intern Technical Assessment**.

## Live Application

- **Frontend:** https://koncepthive-task-manager-frontend.vercel.app
- **Backend API:** https://koncepthive-task-manager-api.onrender.com
- **Health Check:** https://koncepthive-task-manager-api.onrender.com/api/health

> The Render backend may take a short time to start after inactivity.

## Demo Credentials

```text
Email: admin@test.com
Password: 123456
```

## Features

- JWT authentication
- Create, view, update, and delete tasks
- Search and sort tasks
- Filter tasks by status and priority
- Dashboard statistics
- Responsive user interface
- Form validation and error handling

## Technology Stack

- **Frontend:** React, Vite, Axios, React Router
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL, Prisma ORM
- **Authentication:** JWT, bcryptjs
- **Deployment:** Vercel, Render, Neon

## Run Locally

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/task_manager
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PORT=5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

- `POST /api/auth/login`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Author

**Anoja Chanthirakumar**
