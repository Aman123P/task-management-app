import express from 'express';
import { randomBytes } from 'crypto';
import { authenticate, requireTeamMember } from '../middleware/auth.js';

const router = express.Router();

// Get all projects in a team
router.get('/team/:teamId', authenticate, requireTeamMember, (req, res) => {
  const { teamId } = req.params;

  req.db.all(
    'SELECT * FROM projects WHERE team_id = ? ORDER BY created_at DESC',
    [teamId],
    (err, projects) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ projects });
    }
  );
});

// Create project
router.post('/team/:teamId', authenticate, requireTeamMember, (req, res) => {
  const { teamId } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const projectId = randomBytes(16).toString('hex');

  req.db.run(
    'INSERT INTO projects (id, team_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)',
    [projectId, teamId, name, description || null, userId],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to create project' });
      }

      res.status(201).json({
        project: {
          id: projectId,
          team_id: teamId,
          name,
          description,
          created_by: userId
        }
      });
    }
  );
});

// Get project details
router.get('/:projectId', authenticate, (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  req.db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check team membership
    req.db.get(
      'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
      [project.team_id, userId],
      (err, membership) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!membership) {
          return res.status(403).json({ error: 'Access denied' });
        }

        res.json({ project });
      }
    );
  });
});

// Update project
router.put('/:projectId', authenticate, (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  // Get project and check access
  req.db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check team membership
    req.db.get(
      'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
      [project.team_id, userId],
      (err, membership) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!membership) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Update project
        req.db.run(
          'UPDATE projects SET name = ?, description = ?, updated_at = datetime("now") WHERE id = ?',
          [name, description || null, projectId],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to update project' });
            }

            res.json({ project: { id: projectId, name, description } });
          }
        );
      }
    );
  });
});

// Delete project
router.delete('/:projectId', authenticate, (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  // Get project and check access
  req.db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is owner or admin
    req.db.get(
      'SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
      [project.team_id, userId],
      (err, membership) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
          return res.status(403).json({ error: 'Only owners and admins can delete projects' });
        }

        // Delete project
        req.db.run('DELETE FROM projects WHERE id = ?', [projectId], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete project' });
          }

          res.json({ message: 'Project deleted successfully' });
        });
      }
    );
  });
});

export default router;
