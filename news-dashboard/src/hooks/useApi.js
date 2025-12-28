import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export function useApiStatus() {
  const [status, setStatus] = useState({
    loading: true,
    online: false,
    error: null,
    data: null,
  });

  useEffect(() => {
    const checkStatus = async () => {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      const result = await apiService.getStatus();
      
      if (result.success) {
        setStatus({
          loading: false,
          online: true,
          error: null,
          data: result.data,
        });
      } else {
        setStatus({
          loading: false,
          online: false,
          error: result.error,
          data: null,
        });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return status;
}

export function useApiHealth() {
  const [health, setHealth] = useState({
    loading: true,
    healthy: false,
    error: null,
  });

  useEffect(() => {
    const checkHealth = async () => {
      const result = await apiService.getHealth();
      setHealth({
        loading: false,
        healthy: result.success,
        error: result.error,
      });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return health;
}

