<p align="center">
  <img src="./assets/logo.png" width="90" height="90" alt="NeuralFlow logo" />
</p>

<h1 align="center">NeuralFlow</h1>
<p align="center"><b>A team task manager — projects, tasks, and a Kanban board.</b></p>

---

## Features

- **Auth** — sign up / log in with JWT. First user becomes admin.
- **Roles** — Global Admin, Project Admin, Member.
- **Projects** — create workspaces, invite members, track progress.
- **Tasks** — Todo → In Progress → Review → Done, priorities, due dates, comments.
- **Dashboard** — stats on projects, completed/overdue tasks, and what's assigned to you.
- **Kanban board** — drag-free, click-to-move task board per project.

## Tech Stack

- **Frontend:** React 18, React Router, TanStack Query
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt

## Project Structure

\`\`\`
neuralflow/
├── backend/       # Express API + MongoDB models
└── frontend/      # React app
\`\`\`

## Getting Started

### Backend
\`\`\`bash
cd backend
npm install
cp .env.example .env
# set MONGODB_URI and JWT_SECRET
npm run dev
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
cp .env.example .env
# set REACT_APP_API_URL=http://localhost:5000/api
npm start
\`\`\`

Open `http://localhost:3000`, sign up, and start creating projects and tasks. The first account you create becomes the admin.

## API Overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` |
| Projects | `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id`, member management |
| Tasks | `GET/POST /api/tasks`, `GET/PUT/DELETE /api/tasks/:id`, comments, dashboard stats |

---

<p align="center"><i>Built for the Ethara AI Internship Program.</i></p>
