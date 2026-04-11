import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { taskService } from '../services/task';

export default function TaskBoard({ teamId, projects, teamMembers }) {
  const [tasks, setTasks] = useState({ todo: [], in_progress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const loadTasksRef = useRef(null);

  useEffect(() => {
    if (teamId) loadTasks();
  }, [teamId]);

  useEffect(() => { loadTasksRef.current = loadTasks; });

  useEffect(() => {
    if (!teamId) return;
    const socket = io(import.meta.env.VITE_API_URL);
    socket.emit('join_team', teamId);
    socket.on('task_changed', () => loadTasksRef.current?.());
    return () => {
      socket.emit('leave_team', teamId);
      socket.disconnect();
    };
  }, [teamId]);

  const loadTasks = async () => {
    try {
      const data = await taskService.getTasks(teamId);
      groupTasksByStatus(data.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupTasksByStatus = (taskList) => {
    const grouped = {
      todo: taskList.filter(t => t.status === 'todo'),
      in_progress: taskList.filter(t => t.status === 'in_progress'),
      done: taskList.filter(t => t.status === 'done')
    };
    setTasks(grouped);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      // Update task status - only send required fields
      await taskService.updateTask(draggedTask.id, {
        title: draggedTask.title,
        description: draggedTask.description,
        project_id: draggedTask.project_id,
        assigned_to: draggedTask.assigned_to,
        priority: draggedTask.priority,
        status: newStatus,
        due_date: draggedTask.due_date
      });

      // Update local state
      const updatedTask = { ...draggedTask, status: newStatus };
      const allTasks = [...tasks.todo, ...tasks.in_progress, ...tasks.done]
        .filter(t => t.id !== draggedTask.id);
      allTasks.push(updatedTask);
      groupTasksByStatus(allTasks);
      
      setDraggedTask(null);
    } catch (err) {
      console.error('Drag update error:', err);
      alert('Failed to update task status');
      setDraggedTask(null);
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.updateTask(editingTask.id, editingTask);
      loadTasks();
      setEditingTask(null);
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      loadTasks();
      setEditingTask(null);
    } catch (err) {
      alert('Failed to delete task');
    }
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

  const renderColumn = (status, title, taskList) => (
    <div 
      style={styles.column}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, status)}
    >
      <div style={styles.columnHeader}>
        <h3 style={styles.columnTitle}>{title}</h3>
        <span style={styles.columnCount}>{taskList.length}</span>
      </div>
      
      <div style={styles.taskList}>
        {taskList.map(task => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task)}
            style={{
              ...styles.taskCard,
              opacity: draggedTask?.id === task.id ? 0.5 : 1
            }}
          >
            <div style={styles.taskHeader}>
              <h4 style={styles.taskTitle}>{task.title}</h4>
              <button
                draggable="false"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setEditingTask({...task});
                }}
                style={styles.editBtn}
              >
                ✏️
              </button>
            </div>
            {task.description && (
              <p style={styles.taskDesc}>{task.description}</p>
            )}
            
            <div style={styles.taskMeta}>
              <span style={styles.metaItem}>📁 {getProjectName(task.project_id)}</span>
              <span style={styles.metaItem}>👤 {getMemberName(task.assigned_to)}</span>
            </div>

            {task.due_date && (
              <div style={styles.dueDate}>
                📅 {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}

            <div style={styles.taskFooter}>
              <span 
                style={{ 
                  ...styles.priorityBadge, 
                  background: getPriorityColor(task.priority) 
                }}
              >
                {task.priority}
              </span>
            </div>
          </div>
        ))}
        
        {taskList.length === 0 && (
          <div style={styles.emptyColumn}>
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );

  if (loading) return <div>Loading board...</div>;

  return (
    <div style={styles.container}>
      {editingTask && (
        <div style={styles.modal} onClick={() => setEditingTask(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Task</h3>
            <form onSubmit={handleEditTask}>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                style={styles.input}
                required
              />
              <textarea
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                style={styles.textarea}
                rows="3"
              />
              <select
                value={editingTask.project_id || ''}
                onChange={(e) => setEditingTask({...editingTask, project_id: e.target.value})}
                style={styles.select}
              >
                <option value="">Adhoc</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                value={editingTask.assigned_to || ''}
                onChange={(e) => setEditingTask({...editingTask, assigned_to: e.target.value})}
                style={styles.select}
              >
                <option value="">Unassigned</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select
                value={editingTask.priority}
                onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                style={styles.select}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                type="date"
                value={editingTask.due_date || ''}
                onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value})}
                style={styles.input}
              />
              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>Save</button>
                <button type="button" onClick={() => handleDeleteTask(editingTask.id)} style={styles.deleteBtn}>Delete</button>
                <button type="button" onClick={() => setEditingTask(null)} style={styles.cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h3>Task Board</h3>
        </div>
        <p style={styles.hint}>💡 Drag and drop tasks to change their status</p>
      </div>
      
      <div style={styles.board}>
        {renderColumn('todo', 'To Do', tasks.todo)}
        {renderColumn('in_progress', 'In Progress', tasks.in_progress)}
        {renderColumn('done', 'Done', tasks.done)}
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
    marginBottom: '20px'
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  hint: {
    color: '#666',
    fontSize: '14px',
    margin: 0
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    minHeight: '500px'
  },
  column: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column'
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e0e0e0'
  },
  columnTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600'
  },
  columnCount: {
    background: '#e0e0e0',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  taskList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto'
  },
  taskCard: {
    background: 'white',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    cursor: 'grab',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  },
  taskTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    flex: 1
  },
  taskDesc: {
    margin: 0,
    marginBottom: '12px',
    fontSize: '13px',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  taskMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '8px',
    fontSize: '12px',
    color: '#666'
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  dueDate: {
    fontSize: '12px',
    color: '#e74c3c',
    marginBottom: '8px'
  },
  taskFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: 'white',
    textTransform: 'capitalize',
    fontWeight: '600'
  },
  editBtn: {
    padding: '4px 8px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    flexShrink: 0,
    pointerEvents: 'auto'
  },
  emptyColumn: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    border: '2px dashed #ddd',
    borderRadius: '6px',
    background: 'white'
  },
  modal: {
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
  modalContent: {
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    width: '500px',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  select: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  saveBtn: {
    flex: 1,
    padding: '10px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  deleteBtn: {
    flex: 1,
    padding: '10px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    background: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  }
};
