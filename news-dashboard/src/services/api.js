const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const TOKEN_KEY = 'newsifyx_auth_token';
const USER_KEY = 'newsifyx_auth_user';

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* storage unavailable */ }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = safeGet(TOKEN_KEY);
    this.username = safeGet(USER_KEY);
    this.onUnauthorized = null;
  }

  setSession(token, username) {
    this.token = token;
    this.username = username;
    safeSet(TOKEN_KEY, token);
    safeSet(USER_KEY, username);
  }

  clearSession() {
    this.setSession(null, null);
  }

  isAuthenticated() {
    return Boolean(this.token);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401 && endpoint !== '/api/login') {
        this.clearSession();
        if (this.onUnauthorized) this.onUnauthorized();
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Cannot connect to API server. Please check VITE_API_URL in .env file and ensure backend is running.',
        };
      }
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  async login(username, password) {
    const result = await this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (result.success) this.setSession(result.data.token, result.data.username);
    return result;
  }

  async verifySession() {
    return this.request('/api/me');
  }

  logout() {
    this.clearSession();
  }

  async getHealth() {
    return this.request('/api/health');
  }

  async getStatus() {
    return this.request('/api/status');
  }

  async runAgent() {
    return this.request('/api/run-agent', { method: 'POST' });
  }

  async getTweets(limit = 10) {
    return this.request(`/api/tweets?limit=${limit}`);
  }

  async getStats() {
    return this.request('/api/stats');
  }

  async updateConfig(config) {
    return this.request('/api/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }
}

export const apiService = new ApiService();

