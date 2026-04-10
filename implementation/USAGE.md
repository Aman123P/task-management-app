# Task Management System - User Guide

A multi-tenant task management application with organization-based access control and role-based permissions.

## 🚀 Getting Started

### First Time Setup

1. **Create Your Organization**
   - Visit the application homepage
   - Click "Register Organization" on the login page
   - Enter your organization name, email, name, and password
   - You'll be automatically logged in as the **Super Admin**

2. **Create Admin Users (Optional)**
   - Navigate to Admin → Users
   - Click "+ Create User"
   - Assign the "admin" role to create additional administrators
   - Default password: `Welcome@123` (users must change on first login)

3. **Create Teams**
   - Navigate to Admin → Teams
   - Click "+ Create Team"
   - Enter team name and create
   - Note: Admins are not automatically added as team members

4. **Add Team Members**
   - Select a team from the list
   - Click "+ Add Member"
   - Search for users by name (minimum 2 characters)
   - Select team role:
     - **Manager**: Can add/remove team members
     - **Engineer**: Regular team member
   - Select access level:
     - **Owner**: Full team control
     - **Admin**: Team administration
     - **Member**: Regular access

5. **Create Projects**
   - Regular users: Select a team from the dashboard
   - Click on the team to view details
   - Navigate to Projects section
   - Click "+ New Project" to create

6. **Create Tasks**
   - Within a team, click "Tasks" or navigate to `/tasks/:teamId`
   - Click "+ New Task" button
   - Fill in task details:
     - Title and description
     - Assign to team member
     - Set priority (low, medium, high, urgent)
     - Set due date
     - Optionally link to a project
   - View tasks in List or Kanban Board view

## 👥 User Roles

### System Roles

**Super Admin** (Organization Creator)
- Full visibility of all teams in the organization
- Can create admins and users
- Can manage all teams, projects, and tasks
- Access to admin dashboard

**Admin**
- Can create users (not other admins)
- Can create and manage all teams
- Can add/remove members from any team
- Access to admin dashboard
- Cannot see teams in regular dashboard (management role only)

**User** (Regular)
- Can work within assigned teams
- Can create projects and tasks in their teams
- Can view and update tasks assigned to them
- No admin access

### Team Roles

**Manager**
- Can add/remove members from their team
- Full access to team projects and tasks
- Team-level administrative control

**Engineer**
- Regular team member
- Can work on projects and tasks
- Cannot manage team membership

## 📋 Features

### Organization Management
- Self-service organization registration
- Organization-level data isolation
- Multi-tenant architecture

### User Management
- Admin-controlled user creation
- Default password system with forced change
- Role-based access control
- User search with autocomplete

### Team Management
- Create and manage teams
- Assign members with roles
- Manager-level permissions
- Team-based project organization

### Project Management
- Create projects within teams
- Link tasks to projects
- Project-based task organization

### Task Management
- Create, edit, and delete tasks
- Assign tasks to team members
- Set priority levels (low, medium, high, urgent)
- Set due dates
- Task status tracking (todo, in_progress, done)
- Two view modes:
  - **List View**: Sortable and filterable task list
  - **Kanban Board**: Drag-and-drop task board

### Notifications
- Toast notifications for actions
- Custom confirmation dialogs
- Real-time feedback

## 🔐 Security

### Password Management
- Default password: `Welcome@123`
- Forced password change on first login
- Minimum 6 characters for new passwords
- Current password verification required

### Access Control
- JWT-based authentication
- Organization-scoped data access
- Role-based permissions
- Team membership validation

## 🎯 Common Workflows

### Admin Workflow
1. Log in as admin
2. Go to Admin → Users to create users
3. Go to Admin → Teams to create teams
4. Add members to teams with appropriate roles
5. Logout when done

### Manager Workflow
1. Log in as user with manager role
2. Select your team from dashboard
3. Add/remove team members as needed
4. Create projects for your team
5. Create and assign tasks

### User Workflow
1. Log in with your credentials
2. Change password on first login
3. Select a team from your dashboard
4. View projects and tasks
5. Create new tasks or update existing ones
6. Switch between List and Board views

## 📱 Navigation

### For Admins/Super Admins
- `/admin/users` - User management
- `/admin/teams` - Team management
- Logout button in admin header

### For Regular Users
- `/` - Dashboard with team list
- `/tasks/:teamId` - Team tasks page
- `/tasks/:teamId/new` - Create new task
- Admin button (if admin/super_admin role)

## 💡 Tips

1. **Organization Setup**: Start by creating your organization, then add admins if needed
2. **Team Structure**: Create teams based on departments or projects
3. **Manager Assignment**: Assign at least one manager per team for member management
4. **Task Organization**: Use projects to group related tasks
5. **View Switching**: Use Board view for visual task management, List view for detailed filtering
6. **Password Security**: Change default passwords immediately after first login

## 🆘 Troubleshooting

**Can't see any teams?**
- Regular users only see teams they're members of
- Admins need to be added as members to see teams in dashboard
- Super admins see all organization teams

**Can't add team members?**
- Only admins, super admins, and team managers can add members
- Ensure you have the correct role

**Forgot password?**
- Contact your organization's super admin or admin
- They can reset your password to the default

**Can't create tasks?**
- Ensure you're a member of the team
- Check that you have appropriate permissions

## 📞 Support

For technical issues or questions, contact your organization administrator.

---

**Version**: 1.0.0  
**Last Updated**: April 2026
