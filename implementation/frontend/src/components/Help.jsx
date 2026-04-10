import { useNavigate } from 'react-router-dom';

export default function Help() {
  const navigate = useNavigate();

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    },
    content: {
      maxWidth: '900px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '12px',
      padding: '40px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '2px solid #f0f0f0'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: 0
    },
    backBtn: {
      padding: '10px 20px',
      background: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    section: {
      marginBottom: '30px'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#34495e',
      marginBottom: '15px'
    },
    stepTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#667eea',
      marginBottom: '10px',
      marginTop: '15px'
    },
    text: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#555',
      marginBottom: '10px'
    },
    list: {
      marginLeft: '20px',
      marginBottom: '15px'
    },
    listItem: {
      fontSize: '15px',
      lineHeight: '1.8',
      color: '#555',
      marginBottom: '8px'
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: '600',
      marginRight: '8px'
    },
    superAdminBadge: {
      background: '#e74c3c',
      color: 'white'
    },
    adminBadge: {
      background: '#f39c12',
      color: 'white'
    },
    userBadge: {
      background: '#3498db',
      color: 'white'
    },
    managerBadge: {
      background: '#9b59b6',
      color: 'white'
    },
    engineerBadge: {
      background: '#95a5a6',
      color: 'white'
    },
    highlight: {
      background: '#fff3cd',
      padding: '15px',
      borderRadius: '6px',
      borderLeft: '4px solid #ffc107',
      marginBottom: '20px'
    },
    highlightText: {
      fontSize: '15px',
      color: '#856404',
      margin: 0
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📚 How to Use</h1>
          <button onClick={() => navigate('/login')} style={styles.backBtn}>
            Back to Login
          </button>
        </div>

        <div style={styles.highlight}>
          <p style={styles.highlightText}>
            <strong>New here?</strong> Start by creating your organization on the login page. 
            You'll become the Super Admin with full access to manage everything.
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🚀 Getting Started</h2>
          
          <h3 style={styles.stepTitle}>Step 1: Create Your Organization</h3>
          <p style={styles.text}>
            On the login page, click "Register Organization" and fill in:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Organization name (your company/team name)</li>
            <li style={styles.listItem}>Your email address</li>
            <li style={styles.listItem}>Your full name</li>
            <li style={styles.listItem}>A secure password</li>
          </ul>
          <p style={styles.text}>
            You'll be automatically logged in as the <span style={{...styles.badge, ...styles.superAdminBadge}}>Super Admin</span>
          </p>

          <h3 style={styles.stepTitle}>Step 2: Create Users</h3>
          <p style={styles.text}>
            Navigate to <strong>Admin → Users</strong> and create team members:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Click "+ Create User"</li>
            <li style={styles.listItem}>Enter email, name, and select role</li>
            <li style={styles.listItem}>Default password is <code>Welcome@123</code></li>
            <li style={styles.listItem}>Users must change password on first login</li>
          </ul>

          <h3 style={styles.stepTitle}>Step 3: Create Teams</h3>
          <p style={styles.text}>
            Navigate to <strong>Admin → Teams</strong>:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Click "+ Create Team"</li>
            <li style={styles.listItem}>Enter team name (e.g., "Engineering", "Marketing")</li>
            <li style={styles.listItem}>Note: You're not automatically added as a member</li>
          </ul>

          <h3 style={styles.stepTitle}>Step 4: Add Team Members</h3>
          <p style={styles.text}>
            Select a team and add members:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Click "+ Add Member"</li>
            <li style={styles.listItem}>Search for users (type at least 2 characters)</li>
            <li style={styles.listItem}>Select team role: <span style={{...styles.badge, ...styles.managerBadge}}>Manager</span> or <span style={{...styles.badge, ...styles.engineerBadge}}>Engineer</span></li>
            <li style={styles.listItem}>Select access level: Owner, Admin, or Member</li>
          </ul>

          <h3 style={styles.stepTitle}>Step 5: Create Projects & Tasks</h3>
          <p style={styles.text}>
            Regular users can now:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Select their team from the dashboard</li>
            <li style={styles.listItem}>Create projects to organize work</li>
            <li style={styles.listItem}>Create tasks and assign to team members</li>
            <li style={styles.listItem}>Switch between List and Kanban Board views</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👥 User Roles Explained</h2>
          
          <div style={{marginBottom: '20px'}}>
            <p style={styles.text}>
              <span style={{...styles.badge, ...styles.superAdminBadge}}>Super Admin</span>
              <strong>Organization Creator</strong>
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>See all teams in the organization</li>
              <li style={styles.listItem}>Create admins and users</li>
              <li style={styles.listItem}>Full access to everything</li>
            </ul>
          </div>

          <div style={{marginBottom: '20px'}}>
            <p style={styles.text}>
              <span style={{...styles.badge, ...styles.adminBadge}}>Admin</span>
              <strong>Team & User Manager</strong>
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Create users (not other admins)</li>
              <li style={styles.listItem}>Create and manage all teams</li>
              <li style={styles.listItem}>Add/remove members from any team</li>
              <li style={styles.listItem}>Access admin dashboard only</li>
            </ul>
          </div>

          <div style={{marginBottom: '20px'}}>
            <p style={styles.text}>
              <span style={{...styles.badge, ...styles.userBadge}}>User</span>
              <strong>Regular Team Member</strong>
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Work within assigned teams</li>
              <li style={styles.listItem}>Create projects and tasks</li>
              <li style={styles.listItem}>View and update assigned tasks</li>
            </ul>
          </div>

          <div style={{marginBottom: '20px'}}>
            <p style={styles.text}>
              <span style={{...styles.badge, ...styles.managerBadge}}>Manager</span>
              <strong>Team-Level Role</strong>
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Add/remove members from their team</li>
              <li style={styles.listItem}>Full access to team projects and tasks</li>
            </ul>
          </div>

          <div>
            <p style={styles.text}>
              <span style={{...styles.badge, ...styles.engineerBadge}}>Engineer</span>
              <strong>Team-Level Role</strong>
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>Regular team member</li>
              <li style={styles.listItem}>Work on projects and tasks</li>
            </ul>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💡 Quick Tips</h2>
          <ul style={styles.list}>
            <li style={styles.listItem}><strong>Hierarchy:</strong> Organization → Teams → Projects → Tasks</li>
            <li style={styles.listItem}><strong>Team Managers:</strong> Assign at least one manager per team</li>
            <li style={styles.listItem}><strong>Password Security:</strong> Change default passwords immediately</li>
            <li style={styles.listItem}><strong>Task Views:</strong> Use Board for visual management, List for filtering</li>
            <li style={styles.listItem}><strong>Logout:</strong> Find logout button in admin pages header</li>
          </ul>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>❓ Common Questions</h2>
          
          <p style={styles.text}><strong>Q: Can't see any teams?</strong></p>
          <p style={styles.text}>A: Regular users only see teams they're members of. Ask your admin to add you.</p>
          
          <p style={styles.text}><strong>Q: Can't add team members?</strong></p>
          <p style={styles.text}>A: Only admins, super admins, and team managers can add members.</p>
          
          <p style={styles.text}><strong>Q: Forgot password?</strong></p>
          <p style={styles.text}>A: Contact your organization admin to reset it to the default.</p>
        </div>

        <div style={{textAlign: 'center', marginTop: '40px'}}>
          <button onClick={() => navigate('/login')} style={{...styles.backBtn, fontSize: '16px', padding: '12px 30px'}}>
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}
