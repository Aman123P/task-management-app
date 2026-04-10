import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL;

export const teamService = {
  async getTeams() {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  async createTeam(name) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },

  async getTeamDetails(teamId) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams/${teamId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch team details');
    return res.json();
  },

  async sendInvite(teamId, email) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams/${teamId}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send invite');
    }
    return res.json();
  },

  async getPendingInvites() {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams/invites/pending`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch invites');
    return res.json();
  },

  async acceptInvite(inviteId) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams/invites/${inviteId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to accept invite');
    }
    return res.json();
  },

  async rejectInvite(inviteId) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams/invites/${inviteId}/reject`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to reject invite');
    }
    return res.json();
  },

  async addTeamMember(teamId, userId, role, teamRole) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams/${teamId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, role, teamRole })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add team member');
    }
    return res.json();
  },

  async removeTeamMember(teamId, userId) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to remove team member');
    }
    return res.json();
  },

  async deleteTeam(teamId) {
    const token = authService.getToken();
    const res = await fetch(`${API_URL}/api/teams/${teamId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete team');
    }
    return res.json();
  }
};
