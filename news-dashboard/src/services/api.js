const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
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

