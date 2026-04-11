# Smart Task & Activity Management System — Interview Context

## Project Overview
A full-stack multi-user task management system built with Node.js + React.js. Supports multiple organizations, teams, projects, and tasks with real-time collaboration.

---

## Tech Stack

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js v4
- **Database:** SQLite3 (via `sqlite3` npm package)
- **Auth:** JWT (access token 15min) + Refresh Token (7 days, rotated)
- **Real-time:** Socket.io v4
- **Security:** bcrypt (password hashing), express-rate-limit
- **Other:** dotenv, cors

### Frontend
- **Framework:** React 19 + Vite
- **Routing:** React Router DOM v7
- **Real-time:** socket.io-client v4
- **State:** React Context API + useState/useEffect
- **Styling:** Inline styles (no CSS framework)

---

## Database Schema (SQLite)

### Tables
| Table | Purpose |
|---|---|
| `organizations` | Top-level tenant (multi-tenant) |
| `users` | Users with roles: super_admin, admin, user |
| `teams` | Teams within an organization |
| `team_members` | Many-to-many: users ↔ teams, with role + team_role |
| `team_invites` | Email-based invite system (pending/accepted/rejected) |
| `projects` | Projects within a team |
| `tasks` | Tasks with status, priority, due date, assignee |
| `task_activity_logs` | Audit trail for every task change |
| `refresh_tokens` | Stored refresh tokens for token rotation |

### Indexes
- All foreign keys indexed for query performance
- `task_activity_logs.task_id`, `refresh_tokens.token`, `tasks.status`, `tasks.due_date` etc.

---

## Architecture

### Multi-tenant Structure
```
Organization
  └── Users (super_admin, admin, user)
  └── Teams
        └── Team Members (owner, admin, member) + team_role (manager, engineer, designer, qa)
        └── Projects
              └── Tasks (todo, in_progress, done)
                    └── Activity Logs
```

### Backend Structure
```
src/
  server.js       — Express + Socket.io setup, rate limiting, middleware
  db.js           — SQLite connection + schema creation
  middleware/
    auth.js       — JWT authenticate + requireTeamMember middleware
  routes/
    auth.js       — Register org, login, refresh token, logout, create user, change password
    teams.js      — CRUD teams, team members, invites
    projects.js   — CRUD projects
    tasks.js      — CRUD tasks + activity log endpoint
```

### Frontend Structure
```
src/
  App.jsx                — Routes setup
  services/
    auth.js              — Auth API calls + apiFetch (auto token refresh on 401)
    team.js              — Team API calls
    project.js           — Project API calls
    task.js              — Task API calls including activity log + pagination
  components/
    Login.jsx            — Login + Register Organization
    Dashboard.jsx        — Team overview, projects, quick stats
    TasksPage.jsx        — Team task page with List/Board toggle
    TaskList.jsx         — List view: filters, sort, pagination, activity log modal, real-time
    TaskBoard.jsx        — Kanban board: drag & drop, real-time
    AdminTeams.jsx       — Admin: manage teams, members, invites
    AdminUsers.jsx       — Admin: create users, view org users
    NewTask.jsx          — Create task form
    ChangePassword.jsx   — Change password flow
```

---

## Key Features Implemented

### 1. Authentication & Authorization
- **JWT access token** (15 min expiry) + **refresh token** (7 days, rotated on use)
- Auto-refresh: `apiFetch` wrapper retries any 401 with refresh token silently
- **RBAC:** super_admin > admin > user, enforced on every route
- Password hashed with bcrypt (salt rounds: 10)
- `must_change_password` flag for admin-created users (default password: Welcome@123)

### 2. Rate Limiting
- **Global:** 500 requests / 15 min / IP
- **Auth routes:** 10 requests / 15 min / IP (brute force protection on login/register)
- Returns `429 Too Many Requests` with clear error message

### 3. Task Management (CRUD)
- Fields: title, description, status (todo/in_progress/done), priority (low/medium/high/urgent), due_date, assigned_to, project_id
- **Filtering:** by project, assignee, priority, status (server-side)
- **Sorting:** by created_at, due_date, priority (client-side)
- **Pagination:** server-side with `page` + `limit` params, returns `total`, `totalPages`

### 4. Activity Log
- Every task create/update/delete is logged with user name, action description, timestamp
- Tracks specific field changes: "updated status to done", "updated priority to urgent"
- Displayed in a scrollable modal per task

### 5. Real-time Updates (Socket.io)
- Users join a `team_{teamId}` room on page load
- On task create/update/delete → server emits `task_changed` to the team room
- All connected clients auto-reload tasks without page refresh
- Works in both List view and Board view
- Uses `useRef` to avoid stale closure issue with `loadTasks`

### 6. Team Invites
- Admin invites user by email → invite stored with pending status
- User sees pending invites → accepts/rejects
- On accept → added to `team_members`

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register-organization` | Create org + super_admin user |
| POST | `/login` | Login, returns access + refresh token |
| POST | `/refresh` | Exchange refresh token for new access token |
| POST | `/logout` | Invalidate refresh token |
| POST | `/create-user` | Admin creates user (default password) |
| POST | `/change-password` | Change own password |
| GET | `/users` | Get all org users (admin only) |
| GET | `/search?q=` | Search users by name/email |

### Teams (`/api/teams`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get user's teams |
| POST | `/` | Create team (admin only) |
| GET | `/:teamId` | Team details + members |
| POST | `/:teamId/members` | Add member to team |
| DELETE | `/:teamId/members/:userId` | Remove member |
| POST | `/:teamId/invite` | Send email invite |
| GET | `/invites/pending` | Get pending invites |
| POST | `/invites/:id/accept` | Accept invite |
| POST | `/invites/:id/reject` | Reject invite |
| DELETE | `/:teamId` | Delete team (admin only) |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/team/:teamId?page=&limit=&status=&priority=` | Get tasks (paginated + filtered) |
| POST | `/team/:teamId` | Create task |
| GET | `/:taskId` | Get task details |
| PUT | `/:taskId` | Update task |
| DELETE | `/:taskId` | Delete task |
| GET | `/:taskId/activity` | Get activity log |

---

## Trade-offs & Assumptions

- **SQLite over PostgreSQL:** Chosen for simplicity and zero-config local setup. For production, would migrate to PostgreSQL with connection pooling.
- **In-memory rate limiting:** Rate limit counters reset on server restart. For production, would use Redis store with `rate-limit-redis`.
- **Client-side sorting:** Sorting is done on the already-fetched page of tasks. For large datasets, would move to server-side ORDER BY.
- **No email service:** Invites are stored in DB but no actual email is sent. Would integrate SendGrid/Nodemailer in production.
- **SQLite ephemeral on free hosting:** Data resets on redeploy on free tiers (Render/Railway). Would use persistent volume or PostgreSQL.
- **Refresh token in localStorage:** For production, refresh token should be in httpOnly cookie to prevent XSS.

---

## How to Run Locally

```bash
# Backend
cd implementation/backend
cp .env.example .env   # set JWT_SECRET
npm install
npm start              # runs on http://localhost:3000

# Frontend
cd implementation/frontend
echo "VITE_API_URL=http://localhost:3000" > .env
npm install
npm run dev            # runs on http://localhost:5173
```

---

## Common Interview Questions

**Q: Why SQLite instead of PostgreSQL?**
A: For this assessment, SQLite provides zero-config setup and is sufficient for the scale. The schema is fully relational and would migrate to PostgreSQL with minimal changes — just swap the driver and connection string.

**Q: How does the refresh token work?**
A: On login, two tokens are issued — a short-lived access token (15 min) and a long-lived refresh token (7 days) stored in the DB. The frontend's `apiFetch` wrapper automatically detects 401 responses, calls `/api/auth/refresh`, gets a new access token, and retries the original request. Refresh tokens are rotated on each use for security.

**Q: How does real-time work?**
A: Socket.io is used. When a user opens a team's task page, the frontend emits `join_team` to join a room. When any task is created/updated/deleted, the backend emits `task_changed` to that team's room. All connected clients receive it and reload their task list automatically.

**Q: How is rate limiting implemented?**
A: Using `express-rate-limit`. Auth routes (login, register) are limited to 10 requests per 15 minutes per IP to prevent brute force. All other routes have a global limit of 500 requests per 15 minutes.

**Q: How does RBAC work?**
A: Three org-level roles: `super_admin`, `admin`, `user`. Two team-level roles: `owner/admin/member` (access) and `manager/engineer/designer/qa` (functional). The `authenticate` middleware verifies JWT. The `requireTeamMember` middleware checks team membership. Route handlers check role before performing sensitive operations.

**Q: How is the activity log implemented?**
A: A `task_activity_logs` table stores every change with task_id, user_id, action string, and timestamp. The `logActivity` helper is called after every successful task create/update/delete. The frontend fetches logs on demand via `GET /api/tasks/:taskId/activity` and displays them in a scrollable modal.
