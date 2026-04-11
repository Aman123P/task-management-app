import express from 'express';
import { randomBytes } from 'crypto';
import { authenticate, requireTeamMember } from '../middleware/auth.js';

const router = express.Router();

function logActivity(db, taskId, userId, action) {
  const id = randomBytes(16).toString('hex');
  db.run('INSERT INTO task_activity_logs (id, task_id, user_id, action) VALUES (?, ?, ?, ?)',
    [id, taskId, userId, action]);
}

// Get all tasks in a team
router.get('/team/:teamId', authenticate, requireTeamMember, (req, res) => {
  const { teamId } = req.params;
  const { project_id, status, priority, assigned_to, page = 1, limit = 10 } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  let baseQuery = 'FROM tasks WHERE team_id = ?';
  const params = [teamId];

  if (project_id) {
    if (project_id === 'adhoc') {
      baseQuery += ' AND project_id IS NULL';
    } else {
      baseQuery += ' AND project_id = ?';
      params.push(project_id);
    }
  }
  if (status) { baseQuery += ' AND status = ?'; params.push(status); }
  if (priority) { baseQuery += ' AND priority = ?'; params.push(priority); }
  if (assigned_to) { baseQuery += ' AND assigned_to = ?'; params.push(assigned_to); }

  // Get total count first
  req.db.get(`SELECT COUNT(*) as total ${baseQuery}`, params, (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const total = row.total;
    const totalPages = Math.ceil(total / parseInt(limit));

    req.db.all(
      `SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
      (err, tasks) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ tasks, total, page: parseInt(page), totalPages, limit: parseInt(limit) });
      }
    );
  });
});

// Create task
router.post('/team/:teamId', authenticate, requireTeamMember, (req, res) => {
  const { teamId } = req.params;
  const { title, description, project_id, assigned_to, priority, status, due_date } = req.body;
  const userId = req.user.id;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const taskId = randomBytes(16).toString('hex');

  req.db.run(
    `INSERT INTO tasks (id, team_id, title, description, project_id, assigned_to, created_by, priority, status, due_date) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [taskId, teamId, title, description || null, project_id || null, assigned_to || null, userId, priority || 'medium', status || 'todo', due_date || null],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to create task' });
      }

      logActivity(req.db, taskId, userId, `created task "${title}"`);
      req.io.to(`team_${teamId}`).emit('task_changed', { action: 'created', teamId });

      res.status(201).json({
        task: {
          id: taskId,
          team_id: teamId,
          title,
          description,
          project_id,
          assigned_to,
          created_by: userId,
          priority: priority || 'medium',
          status: status || 'todo',
          due_date
        }
      });
    }
  );
});

// Get task details
router.get('/:taskId', authenticate, (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;

  req.db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check team membership
    req.db.get(
      'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
      [task.team_id, userId],
      (err, membership) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!membership) {
          return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ task });
      }
    );
  });
});

// Update task
router.put('/:taskId', authenticate, (req, res) => {
  const { taskId } = req.params;
  const { title, description, project_id, assigned_to, priority, status, due_date } = req.body;
  const userId = req.user.id;

  // Get task and check access
  req.db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check team membership or super_admin/admin
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      // Admins can update any task in their organization
      req.db.get('SELECT t.organization_id FROM tasks tk JOIN teams t ON tk.team_id = t.id WHERE tk.id = ?', [taskId], (err, result) => {
        if (err || !result || result.organization_id !== req.user.organizationId) {
          return res.status(403).json({ error: 'Access denied' });
        }
        performUpdate();
      });
    } else {
      req.db.get(
        'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
        [task.team_id, userId],
        (err, membership) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
          }
          performUpdate();
        }
      );
    }

    function performUpdate() {
      // Build activity message from changes
      const changes = [];
      if (title !== task.title) changes.push(`title to "${title}"`);
      if (status !== task.status) changes.push(`status to "${status}"`);
      if (priority !== task.priority) changes.push(`priority to "${priority}"`);
      if (assigned_to !== task.assigned_to) changes.push(`assignee`);
      const action = changes.length ? `updated ${changes.join(', ')}` : 'updated task';

      req.db.run(
          `UPDATE tasks SET title = ?, description = ?, project_id = ?, assigned_to = ?, priority = ?, status = ?, due_date = ?, updated_at = datetime("now") 
           WHERE id = ?`,
          [title, description || null, project_id || null, assigned_to || null, priority, status, due_date || null, taskId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to update task' });
            }

            logActivity(req.db, taskId, userId, action);
            req.io.to(`team_${task.team_id}`).emit('task_changed', { action: 'updated', teamId: task.team_id });

            res.json({ 
              task: { 
                id: taskId, 
                title, 
                description, 
                project_id, 
                assigned_to, 
                priority, 
                status, 
                due_date 
              } 
            });
          }
        );
      }
  });
});

// Delete task
router.delete('/:taskId', authenticate, (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;

  // Get task and check access
  req.db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check team membership or admin
    const { role, organizationId } = req.user;
    if (role === 'super_admin' || role === 'admin') {
      req.db.get('SELECT organization_id FROM teams WHERE id = ?', [task.team_id], (err, team) => {
        if (err || !team || team.organization_id !== organizationId)
          return res.status(403).json({ error: 'Access denied' });
        performDelete();
      });
    } else {
      req.db.get('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
        [task.team_id, userId],
        (err, membership) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          if (!membership) return res.status(403).json({ error: 'Access denied' });
          performDelete();
        }
      );
    }

    function performDelete() {
      req.db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete task' });
        logActivity(req.db, taskId, userId, `deleted task "${task.title}"`);
        req.io.to(`team_${task.team_id}`).emit('task_changed', { action: 'deleted', teamId: task.team_id });
        res.json({ message: 'Task deleted successfully' });
      });
    }
  });
});

// Get activity log for a task
router.get('/:taskId/activity', authenticate, (req, res) => {
  const { taskId } = req.params;
  req.db.all(
    `SELECT tal.id, tal.action, tal.created_at, u.name as user_name
     FROM task_activity_logs tal
     LEFT JOIN users u ON tal.user_id = u.id
     WHERE tal.task_id = ?
     ORDER BY tal.created_at DESC`,
    [taskId],
    (err, logs) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ logs });
    }
  );
});

export default router;
