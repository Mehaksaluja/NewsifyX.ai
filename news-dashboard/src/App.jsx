import React, { useState, useEffect } from 'react';
import './App.css';
import SettingsPanel from './components/SettingsPanel';
import TweetFeed from './components/TweetFeed';
import HowToUse from './components/HowToUse';
import StatsBar from './components/StatsBar';
import Login from './components/Login';
import { apiService } from './services/api';
import { useApiHealth, useApiStatus } from './hooks/useApi';
import {
  LayoutList,
  Settings,
  BookOpen,
  BarChart3,
  LogOut,
} from 'lucide-react';

function Dashboard({ username, onLogout }) {
  const [activeTab, setActiveTab] = useState('feed');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showGuide, setShowGuide] = useState(false);
  const { healthy, loading: healthLoading } = useApiHealth();
  const { data: statusData, loading: statusLoading } = useApiStatus();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-shell">
      <div className="dashboard-layout">
        <aside
          className={`sidebar ${isMobile && activeTab === 'settings' ? 'active' : ''} ${!isMobile ? 'active' : ''}`}
        >
          <div className="brand">
            <div className="brand-text">
              <span className="brand-name">NEWSIFYX.AI</span>
              <span className="brand-tagline">Autonomous broadcast</span>
            </div>
          </div>

          <div className="sidebar-scroll">
            <SettingsPanel onModalOpen={() => setActiveTab('feed')} />

            <div className="glass-card glass-card--compact">
              <div className="panel-header" style={{ marginBottom: 12 }}>
                <div className="panel-header__left">
                  <div className="panel-header__icon">
                    <BarChart3 size={16} />
                  </div>
                  <h2 className="panel-title">System health</h2>
                </div>
              </div>
              <div className="health-list">
                <div className="health-row">
                  <span className="health-row__label">API</span>
                  {healthLoading ? (
                    <span className="health-row__label">Checking…</span>
                  ) : (
                    <span className={`status-pill ${healthy ? 'status-pill--online' : 'status-pill--offline'}`}>
                      {healthy ? 'Online' : 'Offline'}
                    </span>
                  )}
                </div>
                <div className="health-row">
                  <span className="health-row__label">Agent</span>
                  {statusLoading ? (
                    <span className="health-row__label">Loading…</span>
                  ) : (
                    <span
                      className={`status-pill ${statusData?.is_active ? 'status-pill--active' : 'status-pill--paused'}`}
                    >
                      {statusData?.is_active ? 'Active' : 'Paused'}
                    </span>
                  )}
                </div>
                {statusData && (
                  <div className="health-row">
                    <span className="health-row__label">Frequency</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-bright)' }}>
                      {statusData.tweets_per_day || 0}/day
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isMobile && (
            <div className="sidebar-footer">v1.0.4 · Mission control</div>
          )}
        </aside>

        <main
          className={`main-content ${isMobile && activeTab === 'feed' ? 'active' : ''} ${!isMobile ? 'active' : ''}`}
        >
          <header className="page-header">
            <div>
              <h1 className="page-title">Mission Control</h1>
              <p className="page-subtitle">
                Monitor autonomous news curation and live broadcasts to X in real time.
              </p>
            </div>
            <div className="header-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowGuide(true)}>
                <BookOpen size={18} />
                <span>Guide</span>
              </button>
              <button type="button" className="btn btn-ghost" onClick={onLogout} title={`Signed in as ${username}`}>
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </header>

          <StatsBar statusData={statusData} healthy={healthy} healthLoading={healthLoading} />

          <TweetFeed />
        </main>

        {showGuide && <HowToUse onClose={() => setShowGuide(false)} />}

        <nav className="bottom-nav" aria-label="Mobile navigation">
          <button
            type="button"
            className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <LayoutList size={22} />
            <span>Feed</span>
          </button>
          <button
            type="button"
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={22} />
            <span>Controls</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

function App() {
  // 'checking' while we validate a stored token, then 'in' or 'out'
  const [authState, setAuthState] = useState(apiService.isAuthenticated() ? 'checking' : 'out');
  const [username, setUsername] = useState(apiService.username);

  useEffect(() => {
    apiService.onUnauthorized = () => setAuthState('out');
    return () => { apiService.onUnauthorized = null; };
  }, []);

  useEffect(() => {
    if (authState !== 'checking') return;
    apiService.verifySession().then((result) => {
      if (result.success) {
        setUsername(result.data.username);
        setAuthState('in');
      } else if (result.error?.includes('Cannot connect')) {
        // Backend unreachable: keep the session, the dashboard shows "Offline".
        setAuthState('in');
      } else {
        apiService.logout();
        setAuthState('out');
      }
    });
  }, [authState]);

  const handleLogin = (name) => {
    setUsername(name);
    setAuthState('in');
  };

  const handleLogout = () => {
    apiService.logout();
    setAuthState('out');
  };

  if (authState === 'checking') {
    return (
      <div className="login-screen">
        <span className="login-checking">Checking session…</span>
      </div>
    );
  }

  if (authState === 'out') {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard username={username} onLogout={handleLogout} />;
}

export default App;
