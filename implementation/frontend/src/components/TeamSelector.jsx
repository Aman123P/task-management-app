import { useState, useEffect } from 'react';
import { teamService } from '../services/team';
import { authService } from '../services/auth';

export default function TeamSelector({ onTeamSelect, currentTeamId }) {
  const [teams, setTeams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = authService.getUser();
    setIsAdmin(user && (user.role === 'admin' || user.role === 'super_admin'));
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await teamService.getTeams();
      setTeams(data.teams);
      if (data.teams.length > 0 && !currentTeamId) {
        onTeamSelect(data.teams[0]);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const data = await teamService.createTeam(newTeamName);
      setTeams([...teams, data.team]);
      setNewTeamName('');
      setShowCreate(false);
      onTeamSelect(data.team);
    } catch (err) {
      alert('Failed to create team');
    }
  };

  if (loading) return <div>Loading teams...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>Teams</h3>
        {isAdmin && (
          <button onClick={() => setShowCreate(!showCreate)} style={styles.addBtn}>
            +
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreateTeam} style={styles.createForm}>
          <input
            type="text"
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <div style={styles.formActions}>
            <button type="submit" style={styles.saveBtn}>Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.teamList}>
        {teams.map(team => (
          <div
            key={team.id}
            onClick={() => onTeamSelect(team)}
            style={{
              ...styles.teamItem,
              ...(currentTeamId === team.id ? styles.teamItemActive : {})
            }}
          >
            <div style={styles.teamName}>{team.name}</div>
            <div style={styles.teamRole}>{team.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  addBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    background: '#3498db',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  createForm: {
    marginBottom: '16px',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '4px'
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '8px'
  },
  formActions: {
    display: 'flex',
    gap: '8px'
  },
  saveBtn: {
    padding: '6px 12px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  cancelBtn: {
    padding: '6px 12px',
    background: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  teamList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  teamItem: {
    padding: '12px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s'
  },
  teamItemActive: {
    background: '#e3f2fd',
    borderColor: '#3498db'
  },
  teamName: {
    fontWeight: '500',
    marginBottom: '4px'
  },
  teamRole: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'capitalize'
  }
};
