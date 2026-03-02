<div align="center">

# OpsBoard

### Real-Time Operational Command Dashboard

**Interdictor Track — Hackathon Submission**

Precision task management, live execution risk scoring, and AI-generated standups — built for teams that ship.

</div>

---

## Overview

OpsBoard is a full-stack, real-time operational dashboard that gives small teams complete visibility into their work. It combines a drag-and-drop Kanban board, a live execution Risk Radar, an auto-generated Daily Standup engine, and a team chat — all synchronized in real time across every connected client via WebSockets.

---

## Features

### Kanban Command Board
- Four-column workflow: **To-Do → In Progress → Completed → Blocked**
- Drag-and-drop cards powered by `@dnd-kit/core` with optimistic UI updates
- Per-column task creation with priority (Low / Medium / High) and deadline assignment
- Inline task editing, deletion with confirmation (completed tasks only, admin only), and soft-block workflow (block reason required)
- **Admin Unblock** — admins can unblock any task, moving it back to To-Do and clearing the blocker reason
- Live **Deadline Banner** — auto-appears when any open task is overdue or due within 12 hours
- Task-level **Comments** thread on each card with live broadcast to all open modals
- **Filter Bar** — filter by assignee, priority, status, or free-text search in real time
- Keyboard shortcuts panel (`shift+?` to open)

### Execution Risk Radar
A 0–100 team health score calculated server-side from five weighted signals:
1. **Completion Rate** — proportion of tasks marked done
2. **Blocker Penalty** — each blocked task reduces the score
3. **Overdue Penalty** — past-deadline open tasks
4. **Deadline Pressure** — tasks due within the next 24 hours
5. **Workload Imbalance** — detects when one member carries disproportionate load

Displays a color-coded gauge (Critical / High / Medium / Healthy) with per-signal breakdowns and actionable advice.

### Auto-Generated Daily Standup
One-click standup report generated entirely by the backend, containing:
- Progress summary (completion ratio, velocity)
- Active blockers with assignee and reason
- Top contributor over the past 24 hours
- Upcoming deadlines (next 24 hours)
- Smart recommendations based on team signals
- Task deletions in the last 24 hours

Reports are copyable to clipboard and exportable as `.txt`.

### Real-Time Team Chat
- Floating chat drawer available on the Team page
- `@mention` autocomplete with dropdown
- Email notification sent to mentioned users
- Messages persisted in MongoDB and loaded on room join

### Dashboard Sidebar
- **Stats Bar** — total tasks, in-progress, blocked, and completed counts
- **Burndown Chart** — task completion trend over the sprint
- **Blocker List** — all currently blocked tasks with reasons
- **Activity Feed** — live stream of team actions (create, update, delete, block, unblock)
- **Team Members List** — roles, join dates

### Team Management
- Create a team → receive an 8-character invite code
- Join any team via invite code
- Role-based access: **Admin** and **Member**
- Admins can promote/demote members
- Admins can grant or revoke task-creation permission per member (email notification sent on change)
- Admins can delete the team — cascades deletion of all tasks and activity logs

### Authentication
- Register with email verification flow
- JWT-based auth (access token stored in `localStorage`)
- Protected routes on both frontend and backend

### UX
- Toast notifications for all real-time events
- Keyboard shortcut panel (`shift+?` to open)
- Smooth animations throughout
- Rate limiting on all auth endpoints (register, login, verify, resend)


---

## Demo Walkthrough

1. **Register** an account and verify your email
2. **Create a team** — you automatically become Admin
3. Copy the **invite code** and share it with teammates
4. Teammates visit the dashboard and **join via the code**
5. **Create tasks** on the Kanban board in any column
6. **Drag cards** between columns — every connected user sees the update instantly
7. Move a card to **Blocked** — enter a blocker reason — the Blocker List and Risk Radar update live
8. Click **Generate Standup** — receive a full team report in one click
9. Open the **chat drawer** — type `@` to mention a teammate and trigger an email notification

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Drag & Drop | @dnd-kit/core |
| Backend | Node.js, Express.js |
| Real-Time | Socket.IO (WebSockets) |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Email | Nodemailer |
| API Client | Axios |

---

## Project Structure

```
OPS_VS/
├── backend/
│   └── src/
│       ├── config/
│       │   └── db.js                   # MongoDB connection
│       ├── middleware/
│       │   ├── auth.js                 # JWT protect + role guard
│       │   └── validateTransition.js   # Workflow state-machine guard
│       ├── models/
│       │   ├── User.js
│       │   ├── Team.js
│       │   ├── Task.js
│       │   ├── ActivityLog.js
│       │   ├── ChatMessage.js
│       │   └── Comment.js
│       ├── routes/
│       │   ├── auth.js                 # Register, login, verify email
│       │   ├── teams.js                # CRUD teams, join, roles, activity
│       │   ├── tasks.js                # CRUD tasks + comments
│       │   ├── risk.js                 # Risk Radar endpoint
│       │   ├── standup.js              # Auto-standup generation
│       │   └── chat.js                 # Chat history
│       ├── services/
│       │   └── notificationService.js  # In-app notification dispatch
│       ├── socket/
│       │   └── socketHandler.js        # Socket.IO room management + chat
│       └── utils/
│           ├── riskRadar.js            # 0-100 health score engine
│           ├── standupGenerator.js     # Standup report builder
│           ├── escalationService.js    # Blocker escalation logic
│           └── mailer.js               # Email transport (mentions, verify)
│
└── frontend/
    └── src/
        ├── components/
        │   ├── chat/                   # ChatDrawer, ChatPanel, MentionDropdown
        │   ├── common/                 # Navbar, Modal, Spinner
        │   ├── dashboard/              # StatsBar, BlockerList, ActivityFeed,
        │   │                           # RiskMeter, StandupModal, BurndownChart,
        │   │                           # DeadlineBanner
        │   ├── kanban/                 # KanbanBoard, KanbanColumn, TaskCard,
        │   │                           # FilterBar, BlockReasonModal
        │   ├── tasks/                  # TaskModal, TaskComments
        │   └── team/                   # TeamModals, TeamMembersList
        ├── context/
        │   ├── AuthContext.jsx         # Auth state + JWT lifecycle
        │   ├── TeamContext.jsx         # Team/task state + socket listeners
        ├── hooks/
        │   ├── useNotifications.js
        │   └── useWorkflowController.js
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── VerifyEmailPage.jsx
        │   ├── DashboardPage.jsx       # Team selector
        │   └── TeamPage.jsx            # Main operational view
        └── services/
            ├── api.js                  # Axios instance + all API calls
            └── socket.js               # Socket.IO client singleton
```

---

## API Reference

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register new user |
| POST | `/login` | Login and receive JWT |
| GET | `/me` | Get authenticated user |
| GET | `/verify-email?token=` | Verify email address |
| POST | `/resend-verification` | Resend verification email |

### Teams — `/api/teams`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Create team |
| POST | `/join` | Join via invite code |
| GET | `/:teamId` | Get team + members |
| GET | `/:teamId/activity` | Paginated activity log |
| PUT | `/:teamId/members/:userId/role` | Update member role |
| PUT | `/:teamId/permissions/:memberId` | Grant or revoke task-creation permission |
| DELETE | `/:teamId` | Delete team + all its data (admin only) |

### Tasks — `/api/tasks`
| Method | Route | Description |
|---|---|---|
| GET | `/:teamId` | Get all team tasks |
| POST | `/:teamId` | Create task |
| PUT | `/:teamId/:taskId` | Update task |
| PUT | `/:teamId/:taskId/unblock` | Unblock task — moves back to To-Do (admin only) |
| DELETE | `/:teamId/:taskId` | Delete completed task (admin only) |
| GET | `/:teamId/burndown` | 14-day burndown dataset |
| GET | `/:teamId/:taskId/comments` | Get task comments |
| POST | `/:teamId/:taskId/comments` | Add comment |

### Chat — `/api/chat`
| Method | Route | Description |
|---|---|---|
| GET | `/:teamId` | Fetch chat history for a team |

### Risk & Standup
| Method | Route | Description |
|---|---|---|
| GET | `/api/risk/:teamId` | Get Risk Radar report |
| POST | `/api/risk/:teamId/broadcast` | Broadcast risk alert |
| GET | `/api/standup/:teamId` | Generate standup report |

### Socket.IO Events
| Event | Direction | Payload |
|---|---|---|
| `join:team` | Client → Server | `teamId` |
| `leave:team` | Client → Server | `teamId` |
| `sendMessage` | Client → Server | `{ teamId, message, mentions }` |
| `task:created` | Server → Client | Full task object |
| `task:updated` | Server → Client | Full task object |
| `task:deleted` | Server → Client | `{ taskId }` |
| `user:joined` | Server → Client | `{ userId, name }` |
| `chat:message` | Server → Client | Full message object |
| `risk:updated` | Server → Client | Risk Radar report |
| `comment:added` | Server → Client | `{ taskId, comment }` |
| `team:permissionUpdated` | Server → Client | Full populated team object |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier is sufficient)

### 1. Clone & Install

```bash
git clone https://github.com/Miren3865/OPS_48_Hackathon.git
cd OPS_48_Hackathon

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables

**`backend/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/opsboard
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Optional — required for @mention email notifications
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your@email.com
MAIL_PASS=yourpassword
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Deployment

### Backend → Render or Railway

1. Create a new **Web Service**
2. Set root directory to `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables from `backend/.env`

### Frontend → Vercel

1. Import the repository on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Framework preset: **Vite**
4. Add environment variables: `VITE_API_URL`, `VITE_SOCKET_URL`

---

## Database Schema

```js
// User
{ name, email, password (bcrypt), isVerified, verifyToken, teams: [ObjectId], timestamps }

// Team
{ name, description, inviteCode (8-char uppercase), members: [{ user, role, joinedAt }], createdBy, timestamps }

// Task
{ title, description, status (todo|inprogress|completed|blocked),
  priority (low|medium|high), deadline, team, assignedTo, createdBy,
  blockerReason, blockedBy, blockedAt, timestamps }

// ActivityLog
{ team, user, action, entityType, entityId, entityTitle, meta, timestamps }

// ChatMessage
{ team, sender, message, mentions: [ObjectId], timestamps }

// Comment
{ task, author, text, timestamps }
```

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| Socket.IO rooms per team | Scopes real-time events — no cross-team data leakage |
| Server-side event emit | Backend emits after DB write; clients never emit directly, ensuring consistency |
| Risk score server-side | Prevents client manipulation; single source of truth for team health |
| Standup generated server-side | Aggregates DB data the client doesn't fully hold; enables plaintext export |
| Workflow state-machine middleware | `validateTransition.js` enforces legal status transitions (e.g. blocked requires a reason) |
| JWT in `localStorage` | Acceptable for hackathon demo; production should use `httpOnly` cookies |
| Invite codes (8-char) | UUID slice, uppercase — easy to read aloud or share verbally |
| CSS-variable theming | All colour tokens are CSS custom properties on `:root`; |

---

<div align="center">

Built for the **Interdictor Track Hackathon**

</div>
