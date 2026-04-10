import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function Login({ onSuccess }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = isRegister
        ? await authService.registerOrganization(organizationName, email, name, password)
        : await authService.login(email, password);
      
      authService.saveToken(data.token);
      authService.saveUser(data.user);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes point {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(10px); }
        }
      `}</style>
      <div style={styles.container}>
        <div style={styles.card}>
        <h2>{isRegister ? 'Register Organization' : 'Login'}</h2>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <input
              type="text"
              placeholder="Organization Name"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              style={styles.input}
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          
          {isRegister && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          )}
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          
          {error && <div style={styles.error}>{error}</div>}
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Loading...' : isRegister ? 'Register Organization' : 'Login'}
          </button>
        </form>
        
        <p style={styles.toggle}>
          {isRegister ? 'Already have an account?' : "Want to create an organization?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={styles.link}
          >
            {isRegister ? 'Login' : 'Register Organization'}
          </button>
        </p>
        
        <div style={styles.helpContainer}>
          <span style={styles.pointingFinger}>👉</span>
          <button
            type="button"
            onClick={() => navigate('/help')}
            style={styles.helpLink}
          >
            📚 How to Use
          </button>
        </div>
      </div>
      </div>
    </>
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
    maxWidth: '400px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '24px'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  button: {
    padding: '12px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  error: {
    color: '#e74c3c',
    fontSize: '14px',
    padding: '8px',
    background: '#fee',
    borderRadius: '4px'
  },
  toggle: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666'
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#3498db',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px'
  },
  helpLink: {
    background: '#e3f2fd',
    border: '2px solid #bbdefb',
    color: '#1976d2',
    cursor: 'pointer',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  helpContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '20px',
    gap: '8px',
    paddingRight: '30px'
  },
  pointingFinger: {
    fontSize: '24px',
    animation: 'point 1s ease-in-out infinite'
  }
};
