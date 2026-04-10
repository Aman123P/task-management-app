const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  async registerOrganization(organizationName, email, name, password) {
    const res = await fetch(`${API_URL}/api/auth/register-organization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationName, email, name, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }
    return res.json();
  },

  async createUser(email, name, password, role) {
    const token = this.getToken();
    const res = await fetch(`${API_URL}/api/auth/create-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, name, role })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'User creation failed');
    }
    return res.json();
  },

  async getOrganizationUsers() {
    const token = this.getToken();
    const res = await fetch(`${API_URL}/api/auth/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async register(email, name, password) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Registration failed');
    }
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    return res.json();
  },

  saveToken(token) {
    localStorage.setItem('token', token);
  },

  getToken() {
    return localStorage.getItem('token');
  },

  saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async searchUsers(query) {
    const token = this.getToken();
    const res = await fetch(`${API_URL}/api/auth/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to search users');
    return res.json();
  },

  async changePassword(currentPassword, newPassword) {
    const token = this.getToken();
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to change password');
    }
    return res.json();
  }
};
