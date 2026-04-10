# Task Management Frontend

Multi-tenant SaaS task management system frontend built with React and Vite.

## Features

- **Organization Registration**: Self-service organization setup
- **Admin Dashboard**: 
  - User management (create users with default passwords)
  - Team management (create teams, assign members)
  - Autocomplete user search
- **Team Collaboration**:
  - Project management
  - Task management with filtering and sorting
  - Kanban board view with drag-and-drop
  - List view with advanced filters
- **Notifications**: In-app team invite notifications
- **Password Management**: Force password change on first login
- **Role-Based UI**: Different views for super admin, admin, and users

## Tech Stack

- React 18
- Vite
- React Router
- Inline CSS (no external CSS frameworks)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

## Running

```bash
npm run dev
```

App runs on `http://localhost:5173`

## User Roles

### Super Admin
- Created when organization registers
- Full access to admin panel
- Can create admins and users
- Sees all teams in organization
- Can view all projects and tasks

### Admin
- Can create users (not other admins)
- Can create and manage teams
- Cannot see teams (pure management role)
- Access admin panel only

### User
- Works within assigned teams
- Can create projects and tasks
- Can view/edit team content
- No admin access

## Key Features

### Admin Panel
- **Users Tab**: Create users, view all organization users
- **Teams Tab**: Create teams, assign members with roles, autocomplete search

### Dashboard
- **Super Admin**: Sees all organization teams
- **Admin**: Welcome message with admin panel link
- **User**: Sees assigned teams only

### Tasks
- **List View**: Filtering by project, assignee, priority, status
- **Board View**: Kanban-style with drag-and-drop
- **Create Task**: Dedicated page with full form
- **Task Details**: Title, description, project, assignee, priority, status, due date

### Team Invites
- Notification badge in header
- Expandable invite panel
- Accept/Reject functionality
- No email - all in-app

## Default Password

When admin creates a user:
- Password: `Welcome@123`
- User must change on first login
- Minimum 6 characters for new password

## Routes

- `/login` - Login and organization registration
- `/` - Dashboard (role-based view)
- `/admin/users` - User management (admin only)
- `/admin/teams` - Team management (admin only)
- `/tasks/:teamId` - Team tasks (list/board view)
- `/tasks/:teamId/new` - Create new task

## Components

- **Login**: Organization registration and user login
- **Dashboard**: Role-based main view
- **AdminUsers**: User management with creation
- **AdminTeams**: Team management with member assignment
- **TeamSelector**: Team list and selection
- **TasksPage**: Task list/board with view toggle
- **TaskList**: Filterable task list
- **TaskBoard**: Drag-and-drop Kanban board
- **NewTask**: Task creation form
- **ChangePassword**: Password change modal
- **ProjectList**: Project CRUD

## Styling

All components use inline styles for simplicity and portability. No external CSS dependencies.

## License

MIT
