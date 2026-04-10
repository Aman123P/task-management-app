import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../services/team';
import { authService } from '../services/auth';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

export default function AdminTeams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [teamRole, setTeamRole] = useState('engineer');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsData, usersData] = await Promise.all([
        teamService.getTeams(),
        authService.getOrganizationUsers()
      ]);
      setTeams(teamsData.teams);
      setUsers(usersData.users);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId) => {
    if (!teamId) return;
    try {
      const data = await teamService.getTeamDetails(teamId);
      const team = teams.find(t => t.id === teamId);
      setSelectedTeam({ ...team, members: data.team.members });
    } catch (err) {
      console.error('Failed to load team details:', err);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const data = await teamService.createTeam(newTeamName);
      const newTeam = { ...data.team, members: [] };
      setTeams([...teams, newTeam]);
      setNewTeamName('');
      setShowCreateTeam(false);
      setSelectedTeam(newTeam);
      setToast({ message: 'Team created successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to create team', type: 'error' });
    }
  };

  const handleSearchUsers = (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const filtered = users.filter(u => 
      !selectedTeam.members?.find(m => m.id === u.id) &&
      (u.name.toLowerCase().includes(query.toLowerCase()) || 
       u.email.toLowerCase().includes(query.toLowerCase()))
    );
    setSearchResults(filtered);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user.id);
    setSearchQuery(user.name);
    setSearchResults([]);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await teamService.addTeamMember(selectedTeam.id, selectedUser, memberRole, teamRole);
      setToast({ message: 'Member added successfully!', type: 'success' });
      setSelectedUser('');
      setSearchQuery('');
      setMemberRole('member');
      setTeamRole('engineer');
      setShowAddMember(false);
      loadTeamDetails(selectedTeam.id);
    } catch (err) {
      setToast({ message: err.message || 'Failed to add member', type: 'error' });
    }
  };

  const handleRemoveMember = async (userId) => {
    const teamId = selectedTeam?.id;
    if (!teamId) {
      setToast({ message: 'No team selected', type: 'error' });
      return;
    }
    
    setConfirmDialog({
      message: 'Are you sure you want to remove this user from the team?',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await teamService.removeTeamMember(teamId, userId);
          setToast({ message: 'Member removed successfully!', type: 'success' });
          loadTeamDetails(teamId);
        } catch (err) {
          setToast({ message: err.message || 'Failed to remove member', type: 'error' });
        }
      }
    });
  };

  const handleDeleteTeam = async (teamId) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this team? This will delete all projects and tasks.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await teamService.deleteTeam(teamId);
          setToast({ message: 'Team deleted successfully!', type: 'success' });
          setSelectedTeam(null);
          loadData();
        } catch (err) {
          setToast({ message: err.message || 'Failed to delete team', type: 'error' });
        }
      }
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={styles.container}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirmDialog && <ConfirmDialog message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />}
      <div style={styles.header}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/')} style={styles.backBtn}>
            ← Dashboard
          </button>
          <button onClick={() => navigate('/admin/users')} style={styles.backBtn}>
            Users
          </button>
        </div>
        <h2>Team Management</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowCreateTeam(!showCreateTeam)} style={styles.createBtn}>
            {showCreateTeam ? 'Cancel' : '+ Create Team'}
          </button>
          <button onClick={() => { authService.logout(); navigate('/login'); }} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {showCreateTeam && (
        <form onSubmit={handleCreateTeam} style={styles.form}>
          <input
            type="text"
            placeholder="Team Name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.submitBtn}>Create</button>
        </form>
      )}

      <div style={styles.content}>
        <div style={styles.teamsList}>
          <h3>Teams ({teams.length})</h3>
          {teams.map(team => (
            <div
              key={team.id}
              style={{
                ...styles.teamItem,
                ...(selectedTeam?.id === team.id ? styles.teamItemActive : {}),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span onClick={() => loadTeamDetails(team.id)} style={{flex: 1, cursor: 'pointer'}}>
                {team.name}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }} 
                style={styles.deleteIconBtn}
                title="Delete team"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div style={styles.teamDetails}>
          {selectedTeam ? (
            <>
              <div style={styles.detailsHeader}>
                <h3>{selectedTeam.name}</h3>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button onClick={() => navigate(`/tasks/${selectedTeam.id}`)} style={styles.viewTasksBtn}>
                    📋 View Tasks
                  </button>
                  <button onClick={() => setShowAddMember(!showAddMember)} style={styles.addMemberBtn}>
                    + Add Member
                  </button>
                  <button onClick={() => handleDeleteTeam(selectedTeam.id)} style={styles.deleteTeamBtn}>
                    Delete Team
                  </button>
                </div>
              </div>

              {showAddMember && (
                <form onSubmit={handleAddMember} style={styles.addMemberForm}>
                  <div style={styles.searchContainer}>
                    <input
                      type="text"
                      placeholder="Search user by name or email..."
                      value={searchQuery}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      required
                      style={styles.searchInput}
                    />
                    {searchResults.length > 0 && (
                      <div style={styles.searchResults}>
                        {searchResults.map(user => (
                          <div
                            key={user.id}
                            style={styles.searchResultItem}
                            onClick={() => handleSelectUser(user)}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <div style={styles.resultName}>{user.name}</div>
                            <div style={styles.resultEmail}>{user.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    style={styles.select}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                  <select
                    value={teamRole}
                    onChange={(e) => setTeamRole(e.target.value)}
                    style={styles.select}
                  >
                    <option value="engineer">Engineer</option>
                    <option value="manager">Manager</option>
                  </select>
                  <button type="submit" style={styles.submitBtn} disabled={!selectedUser}>Add</button>
                </form>
              )}

              <div style={styles.membersList}>
                <h4>Members ({selectedTeam.members?.length || 0})</h4>
                {selectedTeam.members?.length > 0 ? (
                  selectedTeam.members.map(member => (
                    <div key={member.id} style={styles.memberItem}>
                      <div>
                        <div style={styles.memberName}>{member.name}</div>
                        <div style={styles.memberEmail}>{member.email}</div>
                      </div>
                      <div style={styles.memberActions}>
                        <span style={styles.roleBadge}>{member.role}</span>
                        <span style={styles.teamRoleBadge}>{member.team_role || 'engineer'}</span>
                        <button onClick={() => handleRemoveMember(member.id)} style={styles.removeBtn}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>No members yet</div>
                )}
              </div>
            </>
          ) : (
            <div style={styles.placeholder}>Select a team to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    minHeight: '100vh',
    background: '#f5f7fa'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    background: 'white',
    padding: '20px',
    borderRadius: '8px'
  },
  backBtn: {
    padding: '8px 16px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  createBtn: {
    padding: '10px 20px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  logoutBtn: {
    padding: '10px 20px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteTeamBtn: {
    padding: '10px 20px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteIconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
    opacity: 0.6,
    transition: 'all 0.2s ease',
    ':hover': {
      opacity: 1,
      transform: 'scale(1.2)'
    }
  },
  form: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
    display: 'flex',
    gap: '12px'
  },
  input: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  submitBtn: {
    padding: '10px 20px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '24px'
  },
  teamsList: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    height: 'fit-content'
  },
  teamItem: {
    padding: '12px',
    marginTop: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s'
  },
  teamItemActive: {
    background: '#3498db',
    color: 'white',
    borderColor: '#3498db'
  },
  teamDetails: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px'
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  addMemberBtn: {
    padding: '8px 16px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  viewTasksBtn: {
    padding: '8px 16px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  addMemberForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '4px',
    alignItems: 'flex-start'
  },
  searchContainer: {
    flex: 2,
    position: 'relative'
  },
  searchInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box'
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '1px solid #ddd',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    maxHeight: '200px',
    overflowY: 'auto',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 10
  },
  searchResultItem: {
    padding: '10px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0'
  },
  resultName: {
    fontWeight: '500',
    fontSize: '14px',
    marginBottom: '2px'
  },
  resultEmail: {
    fontSize: '12px',
    color: '#666'
  },
  select: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  membersList: {
    marginTop: '20px'
  },
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    marginTop: '8px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px'
  },
  memberName: {
    fontWeight: '500',
    marginBottom: '4px'
  },
  memberEmail: {
    fontSize: '12px',
    color: '#666'
  },
  memberActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  roleBadge: {
    padding: '4px 12px',
    background: '#3498db',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px'
  },
  teamRoleBadge: {
    padding: '4px 12px',
    background: '#9b59b6',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px'
  },
  removeBtn: {
    padding: '6px 12px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  placeholder: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
    fontStyle: 'italic'
  }
};

