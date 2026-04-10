import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireTeamMember = (req, res, next) => {
  const { teamId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const organizationId = req.user.organizationId;

  // Super admin and admin have access to all teams in their organization
  if (userRole === 'super_admin' || userRole === 'admin') {
    req.db.get('SELECT * FROM teams WHERE id = ? AND organization_id = ?', [teamId, organizationId], (err, team) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }
      req.teamRole = 'viewer';
      next();
    });
  } else {
    // Regular users must be team members
    req.db.get('SELECT role FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId], (err, membership) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!membership) {
        return res.status(403).json({ error: 'Access denied. Not a team member.' });
      }
      req.teamRole = membership.role;
      next();
    });
  }
};
