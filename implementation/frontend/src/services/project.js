import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export const projectService = {
  async getProjects(teamId) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/projects/team/${teamId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(teamId, name, description) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/projects/team/${teamId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateProject(projectId, name, description) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async deleteProject(projectId) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  }
};
