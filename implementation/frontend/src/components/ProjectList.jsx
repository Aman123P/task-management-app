import { useState, useEffect } from 'react';
import { projectService } from '../services/project';

export default function ProjectList({ teamId, teamRole }) {
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      loadProjects();
    }
  }, [teamId]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects(teamId);
      setProjects(data.projects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const data = await projectService.createProject(teamId, formData.name, formData.description);
      setProjects([data.project, ...projects]);
      setFormData({ name: '', description: '' });
      setShowCreate(false);
    } catch (err) {
      alert('Failed to create project');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await projectService.updateProject(editingProject.id, formData.name, formData.description);
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, name: formData.name, description: formData.description }
          : p
      ));
      setEditingProject(null);
      setFormData({ name: '', description: '' });
    } catch (err) {
      alert('Failed to update project');
    }
  };

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectService.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const startEdit = (project) => {
    setEditingProject(project);
    setFormData({ name: project.name, description: project.description || '' });
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '' });
    setShowCreate(false);
  };

  if (loading) return <div>Loading projects...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>Projects ({projects.length})</h3>
        <button onClick={() => setShowCreate(true)} style={styles.addBtn}>
          + New Project
        </button>
      </div>

      {(showCreate || editingProject) && (
        <form onSubmit={editingProject ? handleUpdate : handleCreate} style={styles.form}>
          <input
            type="text"
            placeholder="Project name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={styles.input}
            autoFocus
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={styles.textarea}
            rows={3}
          />
          <div style={styles.formActions}>
            <button type="submit" style={styles.saveBtn}>
              {editingProject ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={cancelEdit} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.projectList}>
        {projects.length === 0 ? (
          <div style={styles.empty}>No projects yet. Create your first project!</div>
        ) : (
          projects.map(project => (
            <div key={project.id} style={styles.projectCard}>
              <div style={styles.projectContent}>
                <h4 style={styles.projectName}>{project.name}</h4>
                {project.description && (
                  <p style={styles.projectDesc}>{project.description}</p>
                )}
              </div>
              <div style={styles.projectActions}>
                <button onClick={() => startEdit(project)} style={styles.editBtn}>
                  Edit
                </button>
                {(teamRole === 'owner' || teamRole === 'admin') && (
                  <button onClick={() => handleDelete(project.id)} style={styles.deleteBtn}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  addBtn: {
    padding: '8px 16px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  form: {
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '12px',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  formActions: {
    display: 'flex',
    gap: '8px'
  },
  saveBtn: {
    padding: '8px 16px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  cancelBtn: {
    padding: '8px 16px',
    background: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  projectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  projectCard: {
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start'
  },
  projectContent: {
    flex: 1
  },
  projectName: {
    margin: 0,
    marginBottom: '8px',
    fontSize: '16px'
  },
  projectDesc: {
    margin: 0,
    color: '#666',
    fontSize: '14px'
  },
  projectActions: {
    display: 'flex',
    gap: '8px'
  },
  editBtn: {
    padding: '6px 12px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  deleteBtn: {
    padding: '6px 12px',
    background: '#fee',
    color: '#e74c3c',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic'
  }
};
