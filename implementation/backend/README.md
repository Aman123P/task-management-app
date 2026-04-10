# Task Management Backend

Multi-tenant SaaS task management system backend built with Node.js, Express, and SQLite.

## Features

- **Multi-tenant Architecture**: Organization-level data isolation
- **Role-Based Access Control**: 
  - Super Admin: Full organization control, sees all teams
  - Admin: Manage users and teams
  - User: Work within assigned teams
- **Authentication**: JWT-based with password management
- **Team Management**: Admin-controlled team creation and member assignment
- **Project & Task Management**: Full CRUD operations with filtering and sorting
- **Invite System**: Notification-based team invitations

## Tech Stack

- Node.js + Express
- SQLite database
- JWT authentication
- bcrypt for password hashing

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=3000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## Database Schema

- **organizations**: Multi-tenant isolation
- **users**: Organization members with roles
- **teams**: Organization teams
- **team_members**: Team membership
- **team_invites**: Notification-based invites
- **projects**: Team projects
- **tasks**: Project tasks with full metadata

## Running

```bash
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register-organization` - Register new organization
- `POST /api/auth/login` - User login
- `POST /api/auth/create-user` - Admin creates user (default password: Welcome@123)
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/users` - Get organization users (admin only)
- `GET /api/auth/search` - Search users by name/email

### Teams
- `GET /api/teams` - Get user's teams (super admin sees all)
- `POST /api/teams` - Create team (admin only)
- `GET /api/teams/:teamId` - Get team details
- `POST /api/teams/:teamId/members` - Add member to team (admin only)
- `DELETE /api/teams/:teamId/members/:userId` - Remove member (admin only)
- `POST /api/teams/:teamId/invite` - Send team invite
- `GET /api/teams/invites/pending` - Get pending invites
- `POST /api/teams/invites/:inviteId/accept` - Accept invite
- `POST /api/teams/invites/:inviteId/reject` - Reject invite

### Projects
- `GET /api/projects/:teamId` - Get team projects
- `POST /api/projects/:teamId` - Create project
- `PUT /api/projects/:projectId` - Update project
- `DELETE /api/projects/:projectId` - Delete project

### Tasks
- `GET /api/tasks/:teamId` - Get team tasks (with filters)
- `POST /api/tasks/:teamId` - Create task
- `PUT /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Delete task

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Organization-level data isolation
- Role-based access control
- Force password change on first login

## Default Credentials

When admin creates a user:
- Default Password: `Welcome@123`
- User must change password on first login

## License

MIT
