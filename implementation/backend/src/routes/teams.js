import express from 'express';
import { randomBytes } from 'crypto';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user's teams (or all teams for super_admin)
router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const organizationId = req.user.organizationId;

  // Super admin and admin see all organization teams
  if (userRole === 'super_admin' || userRole === 'admin') {
    req.db.all(
      `SELECT t.id, t.name, t.created_at, 'viewer' as role 
       FROM teams t 
       WHERE t.organization_id = ?
       ORDER BY t.created_at ASC`,
      [organizationId],
      (err, teams) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ teams });
      }
    );
  } else {
    // Regular users see only their teams
    req.db.all(
      `SELECT t.id, t.name, t.created_at, tm.role 
       FROM teams t 
       JOIN team_members tm ON t.id = tm.team_id 
       WHERE tm.user_id = ?
       ORDER BY t.created_at ASC`,
      [userId],
      (err, teams) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ teams });
      }
    );
  }
});

// Create new team (admin only)
router.post('/', authenticate, (req, res) => {
  const { name } = req.body;
  const organizationId = req.user.organizationId;
  const userRole = req.user.role;

  // Only admins and super_admins can create teams
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ error: 'Only admins can create teams' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Team name is required' });
  }

  const teamId = randomBytes(16).toString('hex');

  req.db.run('INSERT INTO teams (id, organization_id, name) VALUES (?, ?, ?)', [teamId, organizationId, name], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Team creation failed' });
    }

    res.status(201).json({ team: { id: teamId, name } });
  });
});

// Get team details
router.get('/:teamId', authenticate, (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const organizationId = req.user.organizationId;

  // Check if user has access (member, admin, or super_admin)
  if (userRole === 'super_admin' || userRole === 'admin') {
    // Admin or super admin can access any team in their organization
    req.db.get('SELECT * FROM teams WHERE id = ? AND organization_id = ?', [teamId, organizationId], (err, team) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Get team members
      req.db.all(
        `SELECT u.id, u.name, u.email, tm.role, tm.team_role, tm.added_at 
         FROM users u 
         JOIN team_members tm ON u.id = tm.user_id 
         WHERE tm.team_id = ?`,
        [teamId],
        (err, members) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ team: { ...team, role: 'viewer', members } });
        }
      );
    });
  } else {
    // Regular users must be team members
    req.db.get('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
      [teamId, userId],
      (err, membership) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!membership) {
          return res.status(403).json({ error: 'Access denied' });
        }

        // Get team info
        req.db.get('SELECT * FROM teams WHERE id = ?', [teamId], (err, team) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (!team) {
            return res.status(404).json({ error: 'Team not found' });
          }

          // Get team members
          req.db.all(
            `SELECT u.id, u.name, u.email, tm.role, tm.team_role, tm.added_at 
             FROM users u 
             JOIN team_members tm ON u.id = tm.user_id 
             WHERE tm.team_id = ?`,
            [teamId],
            (err, members) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({ team: { ...team, role: membership.role, members } });
            }
          );
        });
      }
    );
  }
});

// Send invite to user by email
router.post('/:teamId/invite', authenticate, (req, res) => {
  const { teamId } = req.params;
  const { email } = req.body;
  const userId = req.user.id;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if user is owner or admin
  req.db.get('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?',
    [teamId, userId],
    (err, membership) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
        return res.status(403).json({ error: 'Only owners and admins can invite' });
      }

      // Check if user exists
      req.db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
          return res.status(404).json({ error: 'User not found with this email' });
        }

        // Check if already a member
        req.db.get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
          [teamId, user.id],
          (err, existing) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            if (existing) {
              return res.status(400).json({ error: 'User is already a team member' });
            }

            // Check if invite already exists
            req.db.get('SELECT * FROM team_invites WHERE team_id = ? AND invited_email = ? AND status = ?',
              [teamId, email, 'pending'],
              (err, existingInvite) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }
                if (existingInvite) {
                  return res.status(400).json({ error: 'Invite already sent to this user' });
                }

                const inviteId = randomBytes(16).toString('hex');

                req.db.run(
                  'INSERT INTO team_invites (id, team_id, invited_email, invited_by) VALUES (?, ?, ?, ?)',
                  [inviteId, teamId, email, userId],
                  (err) => {
                    if (err) {
                      return res.status(500).json({ error: 'Failed to create invite' });
                    }

                    res.json({ message: 'Invite sent successfully' });
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});

// Add user to team (admin only)
router.post('/:teamId/members', authenticate, (req, res) => {
  const { teamId } = req.params;
  const { userId, role, teamRole = 'engineer' } = req.body;
  const currentUser = req.user;

  // Check if user is admin/super_admin OR a manager of this team
  const checkPermission = () => {
    return new Promise((resolve, reject) => {
      if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
        return resolve(true);
      }
      
      // Check if user is a manager of this team
      req.db.get(
        'SELECT team_role FROM team_members WHERE team_id = ? AND user_id = ? AND team_role = ?',
        [teamId, currentUser.id, 'manager'],
        (err, membership) => {
          if (err) return reject(err);
          resolve(!!membership);
        }
      );
    });
  };

  checkPermission()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Only admins or team managers can add members' });
      }

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const memberRole = role || 'member';

      // Check if user exists and is in same organization
      req.db.get('SELECT id FROM users WHERE id = ? AND organization_id = ?',
        [userId, currentUser.organizationId],
        (err, user) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (!user) {
            return res.status(404).json({ error: 'User not found in organization' });
          }

          // Check if already a member
          req.db.get('SELECT * FROM team_members WHERE team_id = ? AND user_id = ?',
            [teamId, userId],
            (err, existing) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              if (existing) {
                return res.status(400).json({ error: 'User is already a team member' });
              }

              // Add user to team
              req.db.run('INSERT INTO team_members (team_id, user_id, role, team_role) VALUES (?, ?, ?, ?)',
                [teamId, userId, memberRole, teamRole],
                (err) => {
                  if (err) {
                    return res.status(500).json({ error: 'Failed to add team member' });
                  }

                  res.json({ message: 'User added to team successfully' });
                }
              );
            }
          );
        }
      );
    })
    .catch(err => {
      res.status(500).json({ error: 'Database error' });
    });
});

// Remove user from team (admin or manager)
router.delete('/:teamId/members/:userId', authenticate, (req, res) => {
  const { teamId, userId } = req.params;
  const currentUser = req.user;

  // Check if user is admin/super_admin OR a manager of this team
  const checkPermission = () => {
    return new Promise((resolve, reject) => {
      if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
        return resolve(true);
      }
      
      // Check if user is a manager of this team
      req.db.get(
        'SELECT team_role FROM team_members WHERE team_id = ? AND user_id = ? AND team_role = ?',
        [teamId, currentUser.id, 'manager'],
        (err, membership) => {
          if (err) return reject(err);
          resolve(!!membership);
        }
      );
    });
  };

  checkPermission()
    .then(hasPermission => {
      if (!hasPermission) {
        return res.status(403).json({ error: 'Only admins or team managers can remove members' });
      }

      req.db.run('DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
        [teamId, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to remove team member' });
          }

          res.json({ message: 'User removed from team successfully' });
        }
      );
    })
    .catch(err => {
      res.status(500).json({ error: 'Database error' });
    });
});

// Get pending invites for current user
router.get('/invites/pending', authenticate, (req, res) => {
  const userEmail = req.user.email;

  req.db.all(
    `SELECT ti.id, ti.team_id, ti.created_at, t.name as team_name, u.name as invited_by_name
     FROM team_invites ti
     JOIN teams t ON ti.team_id = t.id
     JOIN users u ON ti.invited_by = u.id
     WHERE ti.invited_email = ? AND ti.status = 'pending'
     ORDER BY ti.created_at DESC`,
    [userEmail],
    (err, invites) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ invites });
    }
  );
});

// Accept invite
router.post('/invites/:inviteId/accept', authenticate, (req, res) => {
  const { inviteId } = req.params;
  const userId = req.user.id;
  const userEmail = req.user.email;

  req.db.get('SELECT * FROM team_invites WHERE id = ? AND invited_email = ? AND status = ?',
    [inviteId, userEmail, 'pending'],
    (err, invite) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      // Add user to team
      req.db.run(
        'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
        [invite.team_id, userId, 'member'],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to join team' });
          }

          // Update invite status
          req.db.run('UPDATE team_invites SET status = ? WHERE id = ?',
            ['accepted', inviteId],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({ message: 'Invite accepted successfully' });
            }
          );
        }
      );
    }
  );
});

// Reject invite
router.post('/invites/:inviteId/reject', authenticate, (req, res) => {
  const { inviteId } = req.params;
  const userEmail = req.user.email;

  req.db.get('SELECT * FROM team_invites WHERE id = ? AND invited_email = ? AND status = ?',
    [inviteId, userEmail, 'pending'],
    (err, invite) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      req.db.run('UPDATE team_invites SET status = ? WHERE id = ?',
        ['rejected', inviteId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ message: 'Invite rejected' });
        }
      );
    }
  );
});

// Delete team
router.delete('/:teamId', authenticate, (req, res) => {
  const { teamId } = req.params;
  const { role, organizationId } = req.user;

  if (role !== 'super_admin' && role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.db.get('SELECT * FROM teams WHERE id = ? AND organization_id = ?', [teamId, organizationId], (err, team) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    req.db.run('DELETE FROM teams WHERE id = ?', [teamId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete team' });
      res.json({ message: 'Team deleted' });
    });
  });
});

export default router;
