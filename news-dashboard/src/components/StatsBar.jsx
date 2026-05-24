import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
const StatsBar = ({ statusData, healthy, healthLoading }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      const result = await apiService.getStats();
      if (result.success) setStats(result.data);
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const tweetsToday = stats?.tweets_today ?? '—';
  const tweetsWeek = stats?.tweets_this_week ?? '—';
  const frequency = statusData?.tweets_per_day ?? '—';
  const agentLabel = statusData?.is_active ? 'Active' : 'Paused';

  return (
    <div className="stats-grid">
      <div className="stat-card stat-card--accent">
        <div className="stat-card__label">Posted today</div>
        <div className="stat-card__value">{tweetsToday}</div>
        <div className="stat-card__meta">Tweets in last 24h</div>
      </div>
      <div className="stat-card stat-card--success">
        <div className="stat-card__label">This week</div>
        <div className="stat-card__value">{tweetsWeek}</div>
        <div className="stat-card__meta">Rolling 7-day total</div>
      </div>
      <div className="stat-card">
        <div className="stat-card__label">Schedule</div>
        <div className="stat-card__value">{frequency}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/d</span></div>
        <div className="stat-card__meta">Configured frequency</div>
      </div>
      <div className="stat-card stat-card--warning">
        <div className="stat-card__label">Agent</div>
        <div className="stat-card__value" style={{ fontSize: '1.25rem' }}>
          {healthLoading ? '…' : healthy ? agentLabel : 'Offline'}
        </div>
        <div className="stat-card__meta">
          {healthy ? 'API connected' : 'Backend unreachable'}
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
