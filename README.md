# OpsBoard — Real-Time Operational Command Dashboard

> **Hackathon Project** | Interdictor Track — Full-Stack Development & Interactive Systems

A lightweight, production-ready real-time dashboard for small teams to track tasks, deadlines, progress, and blockers in a unified interface.

---

## Live Demo Flow

1. Register an account
2. Create a team (you become Admin)
3. Share the **invite code** with teammates
4. Teammates join via the code
5. Create tasks on the Kanban board
6. Move tasks across columns — all connected users see changes **instantly**
7. Mark a task **Blocked** with a reason → alert shows on the dashboard
8. Watch the activity feed update in real time

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS        |
| Backend    | Node.js, Express.js                 |
| Real-Time  | Socket.IO (WebSockets)              |
| Database   | MongoDB Atlas + Mongoose            |
| Auth       | JWT (jsonwebtoken + bcryptjs)       |
| API Client | Axios                               |

---

## Project Structure

```
OPS_VS/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT protect + role middleware
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Team.js
│   │   │   ├── Task.js
│   │   │   └── ActivityLog.js
│   │   ├── routes/
│   │   │   ├── auth.js            # POST /login, /register, GET /me
│   │   │   ├── teams.js           # CRUD teams, join, activity
│   │   │   └── tasks.js           # CRUD tasks per team
│   │   ├── socket/
│   │   │   └── socketHandler.js   # Socket.IO room management
│   │   └── server.js              # Express + Socket.IO entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # Navbar, Modal, Spinner
│   │   │   ├── kanban/            # KanbanBoard, KanbanColumn, TaskCard
│   │   │   ├── tasks/             # TaskModal (create/edit)
│   │   │   ├── team/              # TeamModals, TeamMembersList
│   │   │   └── dashboard/         # StatsBar, BlockerList, ActivityFeed
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Auth state + JWT management
│   │   │   └── TeamContext.jsx    # Team/task state + socket listeners
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx  # Team selector
│   │   │   └── TeamPage.jsx       # Main operational view
│   │   ├── services/
│   │   │   ├── api.js             # Axios instance + all API calls
│   │   │   └── socket.js          # Socket.IO client singleton
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## API Routes

### Auth
| Method | Route              | Description          |
|--------|--------------------|----------------------|
| POST   | /api/auth/register | Register user        |
| POST   | /api/auth/login    | Login + get JWT      |
| GET    | /api/auth/me       | Get current user     |

### Teams
| Method | Route                              | Description             |
|--------|------------------------------------|-------------------------|
| POST   | /api/teams                         | Create team             |
| POST   | /api/teams/join                    | Join via invite code    |
| GET    | /api/teams/:teamId                 | Get team + members      |
| GET    | /api/teams/:teamId/activity        | Get activity log        |
| PUT    | /api/teams/:teamId/members/:userId/role | Update member role |

### Tasks
| Method | Route                          | Description          |
|--------|--------------------------------|----------------------|
| GET    | /api/tasks/:teamId             | Get all team tasks   |
| POST   | /api/tasks/:teamId             | Create task          |
| PUT    | /api/tasks/:teamId/:taskId     | Update task          |
| DELETE | /api/tasks/:teamId/:taskId     | Delete task          |

### Socket.IO Events
| Event          | Direction       | Payload              |
|----------------|-----------------|----------------------|
| `join:team`    | Client → Server | teamId               |
| `leave:team`   | Client → Server | teamId               |
| `task:created` | Server → Client | full task object     |
| `task:updated` | Server → Client | full task object     |
| `task:deleted` | Server → Client | `{ taskId }`         |
| `user:joined`  | Server → Client | `{ userId, name }`   |

---

## Setup & Run

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Configure Environment

**backend/.env**
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/opsboard
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Visit: **http://localhost:5173**

---

## Deployment

### Backend → Render / Railway
1. Create a new Web Service
2. Set root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `.env`

### Frontend → Vercel
1. Import repository on Vercel
2. Set root directory: `frontend`
3. Framework: **Vite**
4. Add env vars: `VITE_API_URL`, `VITE_SOCKET_URL`

---

## Database Schema

### User
```js
{ name, email, password (hashed), teams: [TeamId], timestamps }
```

### Team
```js
{ name, description, inviteCode (8-char), members: [{ user, role, joinedAt }], createdBy, timestamps }
```

### Task
```js
{ title, description, status (todo|inprogress|completed|blocked),
  priority (low|medium|high), deadline, team, assignedTo, createdBy,
  blockerReason, blockedBy, blockedAt, timestamps }
```

### ActivityLog
```js
{ team, user, action (string), entityType, entityId, entityTitle, meta, timestamps }
```

---

## Key Design Decisions

- **Socket.IO rooms per team** — each team gets its own room, preventing cross-team data leaks
- **Server-side emit** — backend emits socket events after DB write, ensuring consistency
- **JWT in localStorage** — simple for hackathon demo; use httpOnly cookies for production
- **4-status Kanban** — To-Do, In Progress, Completed, Blocked matches real team workflows
- **Invite codes** — 8-char UUID slice, uppercase, easy to share verbally

---

*Built with ❤️ for the Interdictor Track Hackathon*
"# OPS_48_Hackathon" 
