import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export const taskService = {
  async getTasks(teamId, filters = {}) {
    const token = authService.getToken();
    const params = new URLSearchParams();
    
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);

    const queryString = params.toString();
    const url = `${API_URL}/api/tasks/team/${teamId}${queryString ? '?' + queryString : ''}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async createTask(teamId, taskData) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/tasks/team/${teamId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(taskId, taskData) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(taskId) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  }
};
