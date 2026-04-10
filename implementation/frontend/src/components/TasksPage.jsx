import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/auth';
import { teamService } from '../services/team';
import { projectService } from '../services/project';
import TaskList from './TaskList';
import TaskBoard from './TaskBoard';

export default function TasksPage() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [currentTeam, setCurrentTeam] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [viewMode, setViewMode] = useState('board');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      loadData();
    }
  }, [teamId]);

  const loadData = async () => {
    try {
      const [projectsData, teamData] = await Promise.all([
        projectService.getProjects(teamId),
        teamService.getTeamDetails(teamId)
      ]);
      setCurrentTeam(teamData.team);
      setProjects(projectsData.projects);
      setTeamMembers(teamData.team.members || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  if (loading) return <div>Loading...</div>;
  if (!currentTeam) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate('/')} style={styles.backBtn}>
            ← Back to Dashboard
          </button>
          <h1 style={styles.title}>{currentTeam.name} - Tasks</h1>
        </div>
        <div style={styles.headerRight}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.contentHeader}>
          <h2 style={styles.contentTitle}>Tasks</h2>
          <div style={styles.headerActions}>
            <button onClick={() => navigate(`/tasks/${teamId}/new`)} style={styles.newTaskBtn}>
              + New Task
            </button>
            <div style={styles.viewToggle}>
              <button 
                onClick={() => setViewMode('list')}
                style={{
                  ...styles.toggleBtn,
                  ...(viewMode === 'list' ? styles.toggleBtnActive : {})
                }}
              >
                📋 List
              </button>
              <button 
                onClick={() => setViewMode('board')}
                style={{
                  ...styles.toggleBtn,
                  ...(viewMode === 'board' ? styles.toggleBtnActive : {})
                }}
              >
                📊 Board
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <TaskList 
            teamId={teamId} 
            projects={projects}
            teamMembers={teamMembers}
          />
        ) : (
          <TaskBoard 
            teamId={teamId} 
            projects={projects}
            teamMembers={teamMembers}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa'
  },
  header: {
    background: 'white',
    padding: '20px 40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  backBtn: {
    padding: '8px 16px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  title: {
    margin: 0,
    fontSize: '24px'
  },
  logoutBtn: {
    padding: '8px 16px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  content: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  contentTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600'
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  newTaskBtn: {
    padding: '8px 16px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  viewToggle: {
    display: 'flex',
    gap: '8px'
  },
  toggleBtn: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    background: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  toggleBtnActive: {
    background: '#3498db',
    color: 'white',
    borderColor: '#3498db'
  }
};
