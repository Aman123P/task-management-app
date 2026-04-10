import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'user' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await authService.getOrganizationUsers();
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const result = await authService.createUser(newUser.email, newUser.name, '', newUser.role);
      alert(`User created successfully!\n\nEmail: ${newUser.email}\nDefault Password: ${result.defaultPassword}\n\nUser will be required to change password on first login.`);
      setNewUser({ email: '', name: '', role: 'user' });
      setShowCreateForm(false);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>User Management</h2>
        <div style={styles.headerActions}>
          <button onClick={() => navigate('/admin/teams')} style={styles.teamsBtn}>
            Teams →
          </button>
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={styles.createBtn}>
            {showCreateForm ? 'Cancel' : '+ Create User'}
          </button>
          <button onClick={() => { authService.logout(); navigate('/login'); }} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateUser} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
            style={styles.input}
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            style={styles.select}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" style={styles.submitBtn}>Create User</button>
          <p style={styles.hint}>Default password: Welcome@123 (user must change on first login)</p>
        </form>
      )}

      <div style={styles.userList}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={styles.tr}>
                <td style={styles.td}>{user.name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    background: user.role === 'super_admin' ? '#e74c3c' : user.role === 'admin' ? '#f39c12' : '#3498db'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  teamsBtn: {
    padding: '10px 20px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  createBtn: {
    padding: '10px 20px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  logoutBtn: {
    padding: '10px 20px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  form: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr) auto',
    gap: '12px',
    alignItems: 'start'
  },
  hint: {
    gridColumn: '1 / -1',
    margin: 0,
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  submitBtn: {
    padding: '10px 20px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  userList: {
    background: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    background: '#f8f9fa',
    fontWeight: '600',
    borderBottom: '2px solid #ddd'
  },
  tr: {
    borderBottom: '1px solid #f0f0f0'
  },
  td: {
    padding: '12px'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500'
  }
};
