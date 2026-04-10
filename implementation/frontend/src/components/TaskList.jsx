import { useState, useEffect } from 'react';
import { taskService } from '../services/task';

export default function TaskList({ teamId, projects, teamMembers }) {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    priority: 'medium',
    status: 'todo',
    due_date: ''
  });
  const [filters, setFilters] = useState({
    project_id: '',
    assigned_to: '',
    priority: '',
    status: ''
  });
  const [sortBy, setSortBy] = useState('created_at'); // created_at, due_date, priority
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      loadTasks();
    }
  }, [teamId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [tasks, filters, sortBy]);

  const loadTasks = async () => {
    try {
      const data = await taskService.getTasks(teamId);
      setTasks(data.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...tasks];

    // Apply filters
    if (filters.project_id) {
      if (filters.project_id === 'adhoc') {
        filtered = filtered.filter(t => !t.project_id);
      } else {
        filtered = filtered.filter(t => t.project_id === filters.project_id);
      }
    }

    if (filters.assigned_to) {
      if (filters.assigned_to === 'unassigned') {
        filtered = filtered.filter(t => !t.assigned_to);
      } else {
        filtered = filtered.filter(t => t.assigned_to === filters.assigned_to);
      }
    }

    if (filters.priority) {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      } else if (sortBy === 'priority') {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else {
        // created_at (newest first)
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredTasks(filtered);
  };

  const clearFilters = () => {
    setFilters({
      project_id: '',
      assigned_to: '',
      priority: '',
      status: ''
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const data = await taskService.createTask(teamId, formData);
      setTasks([data.task, ...tasks]);
      resetForm();
    } catch (err) {
      alert('Failed to create task');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await taskService.updateTask(editingTask.id, formData);
      setTasks(tasks.map(t => 
        t.id === editingTask.id 
          ? { ...t, ...formData }
          : t
      ));
      resetForm();
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      project_id: task.project_id || '',
      assigned_to: task.assigned_to || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || ''
    });
  };

  const resetForm = () => {
    setEditingTask(null);
    setShowCreate(false);
    setFormData({
      title: '',
      description: '',
      project_id: '',
      assigned_to: '',
      priority: 'medium',
      status: 'todo',
      due_date: ''
    });
  };

  const getProjectName = (projectId) => {
    if (!projectId) return 'Adhoc';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown';
  };

  const getMemberName = (userId) => {
    if (!userId) return 'Unassigned';
    const member = teamMembers.find(m => m.id === userId);
    return member ? member.name : 'Unknown';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#95a5a6',
      medium: '#3498db',
      high: '#f39c12',
      urgent: '#e74c3c'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: '#95a5a6',
      in_progress: '#3498db',
      done: '#27ae60'
    };
    return colors[status] || colors.todo;
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>Tasks ({filteredTasks.length}{tasks.length !== filteredTasks.length ? ` of ${tasks.length}` : ''})</h3>
        <button onClick={() => setShowCreate(true)} style={styles.addBtn}>
          + New Task
        </button>
      </div>

      {/* Filters and Sort */}
      <div style={styles.filterBar}>
        <div style={styles.filters}>
          <select
            value={filters.project_id}
            onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
            style={styles.filterSelect}
          >
            <option value="">All Projects</option>
            <option value="adhoc">Adhoc Tasks</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select
            value={filters.assigned_to}
            onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })}
            style={styles.filterSelect}
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            style={styles.filterSelect}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={styles.filterSelect}
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} style={styles.clearBtn}>
              Clear Filters
            </button>
          )}
        </div>

        <div style={styles.sortContainer}>
          <label style={styles.sortLabel}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="created_at">Newest First</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {(showCreate || editingTask) && (
        <form onSubmit={editingTask ? handleUpdate : handleCreate} style={styles.form}>
          <input
            type="text"
            placeholder="Task title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={styles.input}
            autoFocus
            required
          />
          
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={styles.textarea}
            rows={2}
          />

          <div style={styles.formRow}>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              style={styles.select}
            >
              <option value="">Adhoc Task</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              style={styles.select}
            >
              <option value="">Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formRow}>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              style={styles.select}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={styles.select}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.saveBtn}>
              {editingTask ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={styles.taskList}>
        {filteredTasks.length === 0 ? (
          <div style={styles.empty}>
            {hasActiveFilters ? 'No tasks match the current filters' : 'No tasks yet. Create your first task!'}
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} style={styles.taskCard}>
              <div style={styles.taskContent}>
                <h4 style={styles.taskTitle}>{task.title}</h4>
                {task.description && (
                  <p style={styles.taskDesc}>{task.description}</p>
                )}
                <div style={styles.taskMeta}>
                  <span style={styles.metaItem}>📁 {getProjectName(task.project_id)}</span>
                  <span style={styles.metaItem}>👤 {getMemberName(task.assigned_to)}</span>
                  {task.due_date && (
                    <span style={styles.metaItem}>📅 {new Date(task.due_date).toLocaleDateString()}</span>
                  )}
                </div>
                <div style={styles.taskTags}>
                  <span style={{ ...styles.tag, background: getPriorityColor(task.priority) }}>
                    {task.priority}
                  </span>
                  <span style={{ ...styles.tag, background: getStatusColor(task.status) }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div style={styles.taskActions}>
                <button onClick={() => startEdit(task)} style={styles.editBtn}>
                  Edit
                </button>
                <button onClick={() => handleDelete(task.id)} style={styles.deleteBtn}>
                  Delete
                </button>
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
  filterBar: {
    background: '#f8f9fa',
    padding: '16px',
    borderRadius: '4px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  filters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    flex: 1
  },
  filterSelect: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    background: 'white'
  },
  clearBtn: {
    padding: '8px 12px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  sortContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  sortLabel: {
    fontSize: '13px',
    color: '#666'
  },
  sortSelect: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    background: 'white'
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
  select: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    background: 'white'
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px'
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
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  taskCard: {
    padding: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start'
  },
  taskContent: {
    flex: 1
  },
  taskTitle: {
    margin: 0,
    marginBottom: '8px',
    fontSize: '16px'
  },
  taskDesc: {
    margin: 0,
    marginBottom: '12px',
    color: '#666',
    fontSize: '14px'
  },
  taskMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '8px',
    fontSize: '13px',
    color: '#666'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  taskTags: {
    display: 'flex',
    gap: '8px'
  },
  tag: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'white',
    textTransform: 'capitalize'
  },
  taskActions: {
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
