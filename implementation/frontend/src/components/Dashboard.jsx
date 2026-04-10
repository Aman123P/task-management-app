import { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { teamService } from '../services/team';
import { useNavigate } from 'react-router-dom';
import TeamSelector from './TeamSelector';
import ProjectList from './ProjectList';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [currentTeam, setCurrentTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showInvites, setShowInvites] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadPendingInvites();
  }, []);

  useEffect(() => {
    if (currentTeam) {
      loadTeamDetails();
    }
  }, [currentTeam]);

  const loadPendingInvites = async () => {
    try {
      const data = await teamService.getPendingInvites();
      setPendingInvites(data.invites || []);
      if (data.invites && data.invites.length > 0) {
        setShowInvites(true);
      }
    } catch (err) {
      console.error('Failed to load invites:', err);
    }
  };

  const loadTeamDetails = async () => {
    try {
      const data = await teamService.getTeamDetails(currentTeam.id);
      setTeamDetails(data.team);
    } catch (err) {
      console.error('Failed to load team details:', err);
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  const handleGenerateInvite = async () => {
    setShowInviteModal(true);
    setInviteEmail('');
    setSearchResults([]);
  };

  const handleSearchUsers = async (query) => {
    setInviteEmail(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await authService.searchUsers(query);
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user) => {
    setInviteEmail(user.email);
    setSearchResults([]);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      await teamService.sendInvite(currentTeam.id, inviteEmail);
      alert('Invite sent successfully!');
      setInviteEmail('');
      setSearchResults([]);
      setShowInviteModal(false);
    } catch (err) {
      alert(err.message || 'Failed to send invite');
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await teamService.acceptInvite(inviteId);
      alert('Invite accepted! Refreshing...');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Failed to accept invite');
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      await teamService.rejectInvite(inviteId);
      setPendingInvites(pendingInvites.filter(inv => inv.id !== inviteId));
    } catch (err) {
      alert(err.message || 'Failed to reject invite');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Task Management</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user.name}</span>
          <button onClick={() => navigate('/help')} style={styles.helpBtn}>
            📚 Help
          </button>
          {(user.role === 'admin' || user.role === 'super_admin') && (
            <button onClick={() => navigate('/admin/users')} style={styles.adminBtn}>
              👤 Admin
            </button>
          )}
          {pendingInvites.length > 0 && (
            <button onClick={() => setShowInvites(!showInvites)} style={styles.notificationBtn}>
              🔔 {pendingInvites.length} {pendingInvites.length === 1 ? 'Invite' : 'Invites'}
            </button>
          )}
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {showInvites && pendingInvites.length > 0 && (
        <div style={styles.invitesPanel}>
          <div style={styles.invitesPanelHeader}>
            <h3>Pending Team Invites</h3>
            <button onClick={() => setShowInvites(false)} style={styles.closeBtn}>✕</button>
          </div>
          {pendingInvites.map(invite => (
            <div key={invite.id} style={styles.inviteCard}>
              <div style={styles.inviteInfo}>
                <strong>{invite.team_name}</strong>
                <p style={styles.inviteDetail}>Invited by {invite.invited_by_name}</p>
                <p style={styles.inviteDate}>{new Date(invite.created_at).toLocaleDateString()}</p>
              </div>
              <div style={styles.inviteActions}>
                <button onClick={() => handleAcceptInvite(invite.id)} style={styles.acceptBtn}>
                  Accept
                </button>
                <button onClick={() => handleRejectInvite(invite.id)} style={styles.rejectBtn}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInviteModal && (
        <div style={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSendInvite} style={styles.modalForm}>
              <label style={styles.modalLabel}>Search by name or email</label>
              <div style={styles.searchContainer}>
                <input
                  type="text"
                  placeholder="Type to search users..."
                  value={inviteEmail}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  required
                  autoFocus
                  style={styles.modalInput}
                />
                {searching && <div style={styles.searchLoading}>Searching...</div>}
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
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowInviteModal(false)} style={styles.cancelModalBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.sendInviteBtn}>
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div style={styles.content}>
        <div style={styles.sidebar}>
          <TeamSelector 
            onTeamSelect={setCurrentTeam}
            currentTeamId={currentTeam?.id}
          />
        </div>

        <div style={styles.main}>
          {currentTeam ? (
            <>
              <div style={styles.teamHeader}>
                <h2>{currentTeam.name}</h2>
                <div style={styles.headerActions}>
                  {(currentTeam.role === 'owner' || currentTeam.role === 'admin') && (
                    <button onClick={handleGenerateInvite} style={styles.inviteBtn}>
                      Invite Members
                    </button>
                  )}
                  <button onClick={() => navigate(`/tasks/${currentTeam.id}`)} style={styles.tasksBtn}>
                    View Tasks →
                  </button>
                </div>
              </div>

              {teamDetails && (
                <div style={styles.section}>
                  <h3>Team Members ({teamDetails.members?.length || 0})</h3>
                  <div style={styles.memberList}>
                    {teamDetails.members?.map(member => (
                      <div key={member.id} style={styles.memberCard}>
                        <div>
                          <div style={styles.memberName}>{member.name}</div>
                          <div style={styles.memberEmail}>{member.email}</div>
                        </div>
                        <div style={styles.memberRole}>{member.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.section}>
                <ProjectList teamId={currentTeam.id} teamRole={currentTeam.role} />
              </div>
            </>
          ) : (
            <div style={styles.placeholder}>Select a team to get started</div>
          )}
        </div>
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
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  helpBtn: {
    padding: '8px 16px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  adminBtn: {
    padding: '8px 16px',
    background: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  notificationBtn: {
    padding: '8px 16px',
    background: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  logoutBtn: {
    padding: '8px 16px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  invitesPanel: {
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  invitesPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#666'
  },
  inviteCard: {
    background: 'white',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #ddd'
  },
  inviteInfo: {
    flex: 1
  },
  inviteDetail: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#666'
  },
  inviteDate: {
    margin: '4px 0',
    fontSize: '12px',
    color: '#999'
  },
  inviteActions: {
    display: 'flex',
    gap: '8px'
  },
  acceptBtn: {
    padding: '6px 16px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  rejectBtn: {
    padding: '6px 16px',
    background: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  modalLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  modalInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  },
  searchContainer: {
    position: 'relative'
  },
  searchLoading: {
    padding: '8px',
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic'
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
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.2s'
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
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px'
  },
  cancelModalBtn: {
    padding: '8px 20px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  sendInviteBtn: {
    padding: '8px 20px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  content: {
    display: 'flex',
    gap: '24px',
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  sidebar: {
    width: '280px',
    flexShrink: 0
  },
  main: {
    flex: 1
  },
  teamHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  inviteBtn: {
    padding: '8px 16px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  tasksBtn: {
    padding: '8px 16px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  section: {
    marginBottom: '24px'
  },
  memberList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  memberCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '4px'
  },
  memberName: {
    fontWeight: '500',
    marginBottom: '4px'
  },
  memberEmail: {
    fontSize: '13px',
    color: '#666'
  },
  memberRole: {
    fontSize: '12px',
    padding: '4px 8px',
    background: '#e3f2fd',
    borderRadius: '4px',
    textTransform: 'capitalize'
  },
  placeholder: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: '16px'
  },
  adminMessage: {
    textAlign: 'center',
    padding: '60px 40px',
    background: 'white',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '40px auto'
  },
  adminPanelBtn: {
    padding: '12px 32px',
    background: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px'
  }
};


