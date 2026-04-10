import express from 'express';
import { randomBytes } from 'crypto';
import { authenticate, requireTeamMember } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks in a team
router.get('/team/:teamId', authenticate, requireTeamMember, (req, res) => {
  const { teamId } = req.params;
  const { project_id, status, priority, assigned_to } = req.query;

  let query = 'SELECT * FROM tasks WHERE team_id = ?';
  const params = [teamId];

  if (project_id) {
    if (project_id === 'adhoc') {
      query += ' AND project_id IS NULL';
    } else {
      query += ' AND project_id = ?';
      params.push(project_id);
    }
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }

  if (assigned_to) {
    query += ' AND assigned_to = ?';
    params.push(assigned_to);
  }

  query += ' ORDER BY created_at DESC';

  req.db.all(query, params, (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ tasks });
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
      // Update task
      req.db.run(
          `UPDATE tasks SET title = ?, description = ?, project_id = ?, assigned_to = ?, priority = ?, status = ?, due_date = ?, updated_at = datetime("now") 
           WHERE id = ?`,
          [title, description || null, project_id || null, assigned_to || null, priority, status, due_date || null, taskId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to update task' });
            }

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

        // Delete task
        req.db.run('DELETE FROM tasks WHERE id = ?', [taskId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete task' });
          }

          res.json({ message: 'Task deleted successfully' });
        });
      }
    );
  });
});

export default router;
