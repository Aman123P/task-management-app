import { useState } from 'react';
import { authService } from '../services/auth';

export default function ChangePassword({ onSuccess, onCancel, isRequired }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      
      // Update user in localStorage to remove mustChangePassword flag
      const user = authService.getUser();
      user.mustChangePassword = false;
      authService.saveUser(user);
      
      alert('Password changed successfully!');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>{isRequired ? 'Change Your Password' : 'Change Password'}</h2>
        {isRequired && (
          <p style={styles.warning}>
            ⚠️ You must change your password before continuing. Your current password is: <strong>Welcome@123</strong>
          </p>
        )}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={styles.input}
          />
          
          <input
            type="password"
            placeholder="New Password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={styles.input}
          />
          
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
          />
          
          {error && <div style={styles.error}>{error}</div>}
          
          <div style={styles.actions}>
            {!isRequired && (
              <button type="button" onClick={onCancel} style={styles.cancelBtn}>
                Cancel
              </button>
            )}
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  modal: {
    background: 'white',
    borderRadius: '8px',
    padding: '32px',
    width: '90%',
    maxWidth: '450px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  warning: {
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#856404'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    padding: '8px',
    background: '#fee',
    borderRadius: '4px'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px'
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitBtn: {
    padding: '10px 20px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};
