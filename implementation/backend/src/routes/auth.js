import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

function generateTokens(db, userId, payload) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const id = randomBytes(16).toString('hex');
  db.run('INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [id, userId, refreshToken, expiresAt]);
  return { accessToken, refreshToken };
}

// Get all users in organization (admin only)
router.get('/users', authenticate, (req, res) => {
  const organizationId = req.user.organizationId;
  const userRole = req.user.role;

  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.db.all(
    'SELECT id, name, email, role, created_at FROM users WHERE organization_id = ? ORDER BY created_at DESC',
    [organizationId],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ users });
    }
  );
});

// Search users by name or email (within same organization)
router.get('/search', authenticate, (req, res) => {
  const { q } = req.query;
  const organizationId = req.user.organizationId;
  
  if (!q || q.length < 2) {
    return res.json({ users: [] });
  }

  const searchTerm = `%${q}%`;
  req.db.all(
    'SELECT id, name, email, role FROM users WHERE organization_id = ? AND (name LIKE ? OR email LIKE ?) LIMIT 10',
    [organizationId, searchTerm, searchTerm],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ users });
    }
  );
});

// Register organization (self-service)
router.post('/register-organization', async (req, res) => {
  const { organizationName, email, name, password } = req.body;

  if (!organizationName || !email || !name || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    req.db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const orgId = randomBytes(16).toString('hex');
      const userId = randomBytes(16).toString('hex');

      // Create organization
      req.db.run('INSERT INTO organizations (id, name) VALUES (?, ?)',
        [orgId, organizationName],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to create organization' });
          }

          // Create super admin user
          req.db.run('INSERT INTO users (id, organization_id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, orgId, email, name, passwordHash, 'super_admin'],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to create user' });
              }

              const { accessToken, refreshToken } = generateTokens(req.db, userId,
                { id: userId, email, organizationId: orgId, role: 'super_admin' });

              res.status(201).json({
                token: accessToken,
                refreshToken,
                user: { id: userId, email, name, organizationId: orgId, role: 'super_admin' }
              });
            }
          );
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Create user (admin only)
router.post('/create-user', authenticate, async (req, res) => {
  const { email, name, role } = req.body;
  const adminUser = req.user;

  // Only admins and super_admins can create users
  if (adminUser.role !== 'admin' && adminUser.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only admins can create users' });
  }

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  // Super admin can create admins, regular admin can only create users
  const newUserRole = role || 'user';
  if (newUserRole === 'admin' && adminUser.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only super admin can create admin users' });
  }

  if (newUserRole === 'super_admin') {
    return res.status(403).json({ error: 'Cannot create super admin users' });
  }

  try {
    req.db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Default password: Welcome@123
      const defaultPassword = 'Welcome@123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const userId = randomBytes(16).toString('hex');

      // Create user with must_change_password flag
      req.db.run('INSERT INTO users (id, organization_id, email, name, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, adminUser.organizationId, email, name, passwordHash, newUserRole, 1],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'User creation failed' });
          }

          res.status(201).json({
            user: { id: userId, email, name, organizationId: adminUser.organizationId, role: newUserRole },
            defaultPassword: defaultPassword
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'User creation failed' });
  }
});

router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    req.db.get('SELECT * FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err || !user) {
        return res.status(500).json({ error: 'Database error' });
      }

      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      req.db.run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?',
        [newPasswordHash, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to update password' });
          }

          res.json({ message: 'Password changed successfully' });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    req.db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const { accessToken, refreshToken } = generateTokens(req.db, user.id,
        { id: user.id, email: user.email, organizationId: user.organization_id, role: user.role });

      res.json({ 
        token: accessToken,
        refreshToken,
        user: { 
          id: user.id, email: user.email, name: user.name,
          organizationId: user.organization_id, role: user.role,
          mustChangePassword: user.must_change_password === 1
        } 
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh access token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  req.db.get(
    'SELECT rt.*, u.email, u.organization_id, u.role FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.token = ?',
    [refreshToken],
    (err, row) => {
      if (err || !row) return res.status(401).json({ error: 'Invalid refresh token' });
      if (new Date(row.expires_at) < new Date()) {
        req.db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
        return res.status(401).json({ error: 'Refresh token expired' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(req.db, row.user_id,
        { id: row.user_id, email: row.email, organizationId: row.organization_id, role: row.role });

      // Rotate: delete old refresh token
      req.db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);

      res.json({ token: accessToken, refreshToken: newRefreshToken });
    }
  );
});

// Logout — invalidate refresh token
router.post('/logout', authenticate, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    req.db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
  }
  res.json({ message: 'Logged out' });
});

export default router;
