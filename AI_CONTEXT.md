# Task Management App - AI Context

## Current Status

### Latest Updates (April 2026)
- **Team Roles**: Manager and engineer roles implemented with permissions
- **Help System**: Public help page with animated UI elements
- **Task Editing**: Click-to-edit in board view with modal
- **UI/UX**: Toast notifications, custom dialogs, logout buttons
- **Permissions**: Admins/super_admins can create/edit tasks without team membership
- **Admin Dashboard**: Admins now see all teams on dashboard like super-admins
- **Team Management**: Delete team feature with confirmation dialog
- **Navigation**: Dashboard button added to Admin Teams page
- **Local Development**: Running on localhost with SQLite database

### GitHub Repositories
- **Backend**: https://github.com/Aman123P/task-management-backend
- **Frontend**: https://github.com/Aman123P/task-management-frontend
- **Note**: Local version has additional features not yet pushed to GitHub

### Running the Application

**Backend** (Port 3000):
```bash
cd ~/Documents/task-management-design/implementation/backend
npm start
```

**Frontend** (Port 5173):
```bash
cd ~/Documents/task-management-design/implementation/frontend
npm run dev
```

**Access URLs**:
- Dashboard: http://localhost:5173/
- Admin Users: http://localhost:5173/admin/users
- Admin Teams: http://localhost:5173/admin/teams
- Help Page: http://localhost:5173/help

### Database Location
`~/Documents/task-management-design/implementation/backend/database.db`

### Current Database State
- 1 organization created
- Multiple users (super_admin, admin, regular users)
- 3 teams with members
- Team roles assigned (manager/engineer)
- Sample credentials:
  - Super Admin: amanpanwar9277@gmail.com / aman@123
  - Admin: amanpanwar9277@gmail.com / aman@123
  - User: amandon@gmail.com / aman123

### API Routes
All routes use `/api` prefix:
- `/api/auth/*` - Authentication and user management
- `/api/teams/*` - Team management and invites
- `/api/tasks/*` - Task CRUD operations
- `/api/projects/*` - Project management
- `/api/health` - Health check endpoint

## Project Overview
Building a multi-tenant SaaS task management application with organization-based access control and role-based user management.

## Architecture
- **Multi-tenant:** Organization-level data isolation
- **Roles:** 
  - super_admin: Org creator, full visibility of all teams, can manage everything
  - admin: Create teams/users, manage via admin panel, sees all org teams
  - user: Work within assigned teams only
- **Team Roles:**
  - manager: Can add/remove members from their team
  - engineer: Regular team member
- **Access Control:** Organization-scoped, role-based permissions
- **Registration:** Self-service for organizations, admin-managed for users
- **Password Management:** Default password (Welcome@123), force change on first login

## Database
- **Type:** SQLite
- **Location:** `backend/database.db`
- **Schema Location:** `task-management-schema.html`

## Data Model

### Hierarchy
Organization → Teams → Projects → Tasks (with adhoc tasks at team level)

### Tables

**organizations** ✓
- id (TEXT, PK)
- name (TEXT, NOT NULL)
- created_at, updated_at (TEXT)

**users** ✓
- id (TEXT, PK)
- organization_id (TEXT, NOT NULL, FK → organizations.id)
- email (TEXT, UNIQUE, NOT NULL)
- name (TEXT, NOT NULL)
- password_hash (TEXT, NOT NULL)
- role (TEXT: super_admin|admin|user, DEFAULT 'user')
- must_change_password (INTEGER, DEFAULT 0)
- created_at (TEXT)

**teams** ✓
- id (TEXT, PK)
- organization_id (TEXT, NOT NULL, FK → organizations.id)
- name (TEXT, NOT NULL)
- created_at, updated_at (TEXT)

**team_members** ✓
- team_id (TEXT, PK, FK → teams.id)
- user_id (TEXT, PK, FK → users.id)
- role (TEXT: owner|admin|member)
- team_role (TEXT: manager|engineer, DEFAULT 'engineer')
- added_at (TEXT)

**team_invites** ✓
- id (TEXT, PK)
- team_id (TEXT, NOT NULL, FK → teams.id)
- invited_email (TEXT, NOT NULL)
- invited_by (TEXT, FK → users.id)
- status (TEXT: pending|accepted|rejected, DEFAULT 'pending')
- created_at (TEXT)

**projects**
- id (TEXT, PK)
- team_id (TEXT, NOT NULL, FK → teams.id)
- name (TEXT, NOT NULL)
- description (TEXT)
- created_by (TEXT, FK → users.id)
- created_at, updated_at (TEXT)

**tasks**
- id (TEXT, PK)
- team_id (TEXT, NOT NULL, FK → teams.id)
- title (TEXT, NOT NULL)
- description (TEXT)
- project_id (TEXT, FK → projects.id, nullable for adhoc)
- assigned_to (TEXT, FK → users.id)
- created_by (TEXT, FK → users.id)
- priority (TEXT: low|medium|high|urgent)
- status (TEXT: todo|in_progress|done)
- due_date (TEXT)
- created_at, updated_at (TEXT)
- role (TEXT: owner|admin|member)
- added_at (TEXT)

**team_invites** ✓
- id (TEXT, PK)
- team_id (TEXT, NOT NULL, FK → teams.id)
- invited_email (TEXT, NOT NULL)
- invited_by (TEXT, FK → users.id)
- status (TEXT: pending|accepted|rejected, DEFAULT 'pending')
- created_at (TEXT)

**projects**
- id (TEXT, PK)
- team_id (TEXT, NOT NULL, FK → teams.id)
- name (TEXT, NOT NULL)
- description (TEXT)
- created_by (TEXT, FK → users.id)
- created_at, updated_at (TEXT)

**tasks**
- id (TEXT, PK)
- team_id (TEXT, NOT NULL, FK → teams.id) - Every task belongs to a team
- title (TEXT, NOT NULL)
- description (TEXT)
- project_id (TEXT, FK → projects.id) - NULL = adhoc task at team level
- assigned_to (TEXT, FK → users.id)
- created_by (TEXT, FK → users.id)
- priority (TEXT: low|medium|high|urgent)
- status (TEXT: todo|in_progress|done)
- due_date (TEXT)
- created_at, updated_at (TEXT)

## Features

### Core Features
- Task creation, update, assignment
- Task tracking (status, priority, due dates)
- Project-level task grouping
- Adhoc tasks at team level (no project)

### Permission Model
- **View:** Anyone can view all tasks (public read within team context)
- **Edit:** Any team member can edit any task/project in their team
- **Access:** Outside team members cannot see any projects or tasks
- Team membership controls all access

## Key Decisions
1. Using SQLite (TEXT for IDs, TEXT for timestamps)
2. Team-based access control (no project-level permissions)
3. Adhoc tasks live at team level with NULL project_id
4. All tasks require team_id (NOT NULL)
5. Simple 3-state workflow: todo → in_progress → done
6. 4 priority levels: low, medium, high, urgent

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** SQLite

### Frontend
- **Framework:** React

## Project Structure
- Separate repositories for frontend and backend
- Location: `~/Documents/task-management-design/implementation/`
  - `backend/` - Node.js + Express API
  - `frontend/` - React application

## Implementation Status

### Backend - Authentication & Authorization ✓
- JWT-based authentication
- User registration and login (auto-creates personal team)
- Password hashing with bcrypt
- Auth middleware for protected routes
- Team membership verification middleware

**Completed:**
- Database schema with password_hash field
- `/api/auth/register` - User registration + auto-create personal team
- `/api/auth/login` - User login
- `/api/teams/*` - Team management endpoints
- `/api/projects/*` - Project management endpoints
- `/api/tasks/team/:teamId` - Get all tasks in team (with filters)
- `/api/tasks/team/:teamId` - Create task
- `/api/tasks/:taskId` - Get task details
- `/api/tasks/:taskId` - Update task
- `/api/tasks/:taskId` - Delete task
- Authentication middleware
- Team membership authorization middleware

**Dependencies:**
- express, sqlite3, bcrypt, jsonwebtoken, dotenv, cors

### Task Management Features ✓
- Create tasks with title, description, project, assignee, priority, status, due date
- List all tasks in a team
- Update task details
- Delete tasks
- Filter tasks by project, status, priority, assignee
- Support for adhoc tasks (no project)
- All team members can create and edit tasks

### Frontend - Authentication UI ✓
- Login/Register form
- JWT token management
- Protected dashboard
- Auth service layer
- Team management UI

**Completed:**
- Multi-tenant organization system with data isolation
- Role-based access control (super_admin, admin, user)
- Team roles (manager, engineer) with permissions
- Organization self-service registration
- Admin user management dashboard with default passwords
- Admin team management with member assignment
- User search with autocomplete (organization-scoped)
- Password management (default: Welcome@123, force change on first login)
- Login component with organization registration and Help link
- Help page with comprehensive usage guide (accessible without login)
- Dashboard component (role-based: super admin/admin see all teams, users see assigned teams)
- Dashboard Help button for logged-in users
- Notification system for team invites (badge, panel, accept/reject)
- TasksPage component with team-based URL routing
- NewTask component (dedicated page for creating tasks)
- TeamSelector component (admin-only create, users see assigned teams)
- Team details view with members list
- AdminUsers component (create and manage users with logout button)
- AdminTeams component (create teams, assign members with autocomplete, logout button)
- ChangePassword component (modal for first login)
- Toast notifications (success/error messages)
- ConfirmDialog component (custom confirmation modals)
- Routing for tasks (/tasks/:teamId), new task (/tasks/:teamId/new), admin (/admin/users, /admin/teams), help (/help)
- ProjectList component (create, edit, delete projects)
- TaskList component (filtering and sorting)
- TaskBoard component (Kanban with drag-and-drop and click-to-edit)
- Task editing in board view (modal with full CRUD)
- Auth service (org registration, user creation, login, search, password change)
- Team service (get teams, create, get details, add/remove members, invites)
- Project service (CRUD operations)
- Task service (CRUD with filters)
- Super admin middleware (access to all teams in organization)
- Manager permissions (add/remove team members)
- README files for both frontend and backend
- USAGE.md comprehensive user guide
- GitHub repositories created and pushed

**Dependencies:**
- react, react-dom, react-router-dom, vite

### Task Board View ✓
- Kanban-style board with 3 columns (To Do, In Progress, Done)
- Drag and drop tasks between columns to change status
- Visual task cards with project, assignee, due date, priority
- Real-time status updates
- Toggle between List and Board views

### Task Filtering & Sorting ✓
- Filter by project (including adhoc tasks)
- Filter by assignee (including unassigned)
- Filter by priority (urgent, high, medium, low)
- Filter by status (todo, in progress, done)
- Clear all filters button
- Sort by: Newest first, Due date, Priority
- Shows filtered count vs total count
- Real-time filtering (no page reload)

### Separate Tasks Page ✓
- Dedicated `/tasks/:teamId` route for task management
- Back button to return to dashboard
- Team context preserved across pages
- View toggle (List/Board) on tasks page
- Clean separation between dashboard and task views
- Default view is Board
- "+ New Task" button navigates to `/tasks/:teamId/new`

### Notification-Based Invite System ✓
- Team owners/admins invite users by entering email address
- Invites stored in database with status tracking
- Notification badge shows count of pending invites
- Expandable notification panel in dashboard header
- Users can accept or reject invites directly from dashboard
- Accepting invite adds user to team and refreshes page
- Rejecting invite removes from pending list
- No URL tokens or expiry - all handled in-app

### Multi-Tenant Organization System ✓
- Self-service organization registration
- Creates organization and super_admin user
- Organization-level data isolation
- All users, teams, and data scoped to organization
- Users can only see/search within their organization

### Role-Based Access Control ✓
- **super_admin**: 
  - Created on org registration
  - Can create admins and users
  - Sees ALL teams in organization (viewer role)
  - Full access to all projects and tasks
  - Can manage via admin panel
- **admin**: 
  - Can create users only (not other admins)
  - Can create teams and assign members
  - Sees all organization teams
  - Can add/remove members from any team
  - Access admin panel
- **user**: 
  - Regular user, no admin privileges
  - Sees only assigned teams
  - Can work on tasks within teams

### Team Roles ✓
- **Manager**:
  - Can add/remove members from their team
  - Full access to team projects and tasks
  - Team-level administrative control
- **Engineer**:
  - Regular team member
  - Can work on projects and tasks
  - Cannot manage team membership

### Admin Dashboard ✓
- **User Management** (`/admin/users`):
  - Create users with email, name, and role
  - Default password: Welcome@123
  - View all organization users in table
  - Role badges (color-coded)
  - Navigate to Teams tab and Dashboard
  - Logout button
- **Team Management** (`/admin/teams`):
  - Create teams (name only, members added separately)
  - Delete teams with confirmation dialog (🗑️ icon in sidebar)
  - Assign users to teams with roles (member/admin/owner)
  - Assign team roles (manager/engineer)
  - Autocomplete user search (min 2 chars)
  - Remove members from teams (with confirmation dialog)
  - View team details and members
  - View Tasks button to access task board
  - Navigate to Users tab and Dashboard
  - Logout button
- **Dashboard Access**:
  - Admins see all organization teams (same as super_admin)
  - Team selector in sidebar
  - View team members and projects
  - Create and edit tasks without team membership
  - Access task board via View Tasks button
  - Logout button

### Password Management ✓
- Default password: `Welcome@123` for admin-created users
- `must_change_password` flag in database
- Force password change modal on first login
- Minimum 6 characters for new password
- Current password verification required
- Flag cleared after successful change

### Super Admin Features ✓
- Sees all organization teams in Dashboard
- Can click any team to view details
- Access to all projects and tasks (viewer role)
- Middleware allows access without team membership
- Full visibility across organization

### Manager Features ✓
- Can add members to their teams
- Can remove members from their teams
- Permission checks in backend routes
- Same UI as admins for team management

### Help System ✓
- Public help page at `/help` (no login required)
- Accessible from login page with animated pointing finger
- Help button in Dashboard header for logged-in users
- Comprehensive usage guide with:
  - Getting started steps
  - Role explanations with badges
  - Common workflows
  - Quick tips
  - FAQ section

### UI/UX Features ✓
- Toast notifications for all actions (success/error)
- Custom confirmation dialogs (no browser alerts)
- Animated pointing finger on login page (guides to Help button)
- Pastel blue theme for help elements
- Logout buttons on all admin pages
- Click-to-edit tasks in board view (modal with full CRUD)
- Edit button on task cards (top-right corner with pencil icon)
- Drag-and-drop task status updates (proper field handling)
- Team role badges (manager/engineer) with color coding
- Responsive modal forms with proper styling

### Task Management ✓
- Create tasks with full details (title, description, project, assignee, priority, due date)
- Edit tasks via modal in board view
- Delete tasks with confirmation
- Drag-and-drop between status columns (todo, in_progress, done)
- Filter and sort in list view
- Kanban board view with visual organization
- Adhoc tasks (not linked to projects)
- Task assignment to team members
- Priority levels (low, medium, high, urgent) with color coding

### Permissions & Access ✓
- Team members can update tasks in their teams
- Admins can update any task in their organization
- Super admins can update any task in their organization
- Managers can add/remove members from their teams
- Admins can manage all teams and members
- Super admins have full visibility and access

## Files
- Schema HTML: `~/Documents/task-management-design/task-management-schema.html`
- Context: `~/Documents/task-management-design/AI_CONTEXT.md`
- Backend: `~/Documents/task-management-design/implementation/backend/`
- Frontend: `~/Documents/task-management-design/implementation/frontend/`
