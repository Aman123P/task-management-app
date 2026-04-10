import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teamService } from '../services/team';
import { authService } from '../services/auth';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    const user = authService.getUser();
    if (!user) {
      // Store invite token and redirect to login
      localStorage.setItem('pendingInvite', token);
      setStatus('redirect');
      setMessage('Please login or register to accept this invite');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    acceptInvite();
  }, [token]);

  const acceptInvite = async () => {
    try {
      const data = await teamService.acceptInvite(token);
      setStatus('success');
      setTeamName(data.team.name);
      setMessage(`Successfully joined ${data.team.name}!`);
      
      // Clear pending invite
      localStorage.removeItem('pendingInvite');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/');
        window.location.reload(); // Reload to refresh team list
      }, 2000);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'loading' && (
          <>
            <h2>Joining Team...</h2>
            <p style={styles.message}>Please wait while we process your invite.</p>
          </>
        )}

        {status === 'redirect' && (
          <>
            <div style={styles.infoIcon}>ℹ</div>
            <h2>Login Required</h2>
            <p style={styles.message}>{message}</p>
            <p style={styles.subtext}>Redirecting to login...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={styles.successIcon}>✓</div>
            <h2>Success!</h2>
            <p style={styles.message}>{message}</p>
            <p style={styles.subtext}>Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={styles.errorIcon}>✗</div>
            <h2>Invite Error</h2>
            <p style={styles.errorMessage}>{message}</p>
            <button onClick={() => navigate('/')} style={styles.button}>
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#f5f7fa'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  successIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#27ae60',
    color: 'white',
    fontSize: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  errorIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#e74c3c',
    color: 'white',
    fontSize: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  infoIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: '#3498db',
    color: 'white',
    fontSize: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  message: {
    color: '#666',
    marginTop: '16px',
    fontSize: '16px'
  },
  errorMessage: {
    color: '#e74c3c',
    marginTop: '16px',
    fontSize: '16px'
  },
  subtext: {
    color: '#999',
    fontSize: '14px',
    marginTop: '12px'
  },
  button: {
    marginTop: '20px',
    padding: '12px 24px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  }
};

