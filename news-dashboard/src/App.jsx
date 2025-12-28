import React, { useState, useEffect } from 'react';
import './App.css';
import SettingsPanel from './components/SettingsPanel';
import TweetFeed from './components/TweetFeed';
import HowToUse from './components/HowToUse';
import { useApiHealth, useApiStatus } from './hooks/useApi';
import { Radio, BarChart3, LayoutList, Settings, Wifi, WifiOff, BookOpen } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showGuide, setShowGuide] = useState(false);
  const { healthy, loading: healthLoading } = useApiHealth();
  const { online, data: statusData, loading: statusLoading } = useApiStatus();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${isMobile && activeTab === 'settings' ? 'active' : ''} ${!isMobile ? 'active' : ''}`}>
        
        <div className="brand">
          <Radio color="#3b82f6" /> NEWSIFYX.AI
        </div>
        
        <div style={{flex: 1}}>
           <SettingsPanel />

           <div className="panel" style={{marginTop: '20px', padding: '15px'}}>
              <div className="panel-header" style={{marginBottom:'10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <BarChart3 size={14}/> System Health
                </div>
                {!healthLoading && (
                  <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                    {healthy ? (
                      <Wifi size={12} color="#10b981" />
                    ) : (
                      <WifiOff size={12} color="#ef4444" />
                    )}
                  </div>
                )}
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:'8px'}}>
                 <span style={{color:'#666'}}>API Status</span>
                 <span style={{color: healthy ? '#10b981' : '#ef4444'}}>
                   {healthLoading ? 'Checking...' : healthy ? 'Online' : 'Offline'}
                 </span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:'8px'}}>
                 <span style={{color:'#666'}}>Agent Status</span>
                 <span style={{color: statusData?.is_active ? '#3b82f6' : '#f59e0b'}}>
                   {statusLoading ? 'Loading...' : statusData?.is_active ? 'Active' : 'Paused'}
                 </span>
              </div>
              {statusData && (
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}>
                   <span style={{color:'#666'}}>Frequency</span>
                   <span style={{color:'#3b82f6'}}>{statusData.tweets_per_day || 0}/day</span>
                </div>
              )}
           </div>
        </div>

        {!isMobile && (
          <div style={{fontSize: '0.8rem', color: '#333'}}>
            v1.0.4 • Edge Node
          </div>
        )}
      </aside>

      <main className={`main-content ${isMobile && activeTab === 'feed' ? 'active' : ''} ${!isMobile ? 'active' : ''}`}>
        <div className="header-section" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h1 className="page-title">Mission Control</h1>
            <p className="page-subtitle">Live feed from autonomous agents.</p>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '10px',
              padding: isMobile ? '10px 14px' : '12px 18px',
              color: '#3b82f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(59, 130, 246, 0.1)';
            }}
          >
            <BookOpen size={isMobile ? 16 : 18} />
            <span>How to Use</span>
          </button>
        </div>

        <TweetFeed />
      </main>

      {showGuide && <HowToUse onClose={() => setShowGuide(false)} />}

      <div className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          <LayoutList size={24} />
          <span>Live Feed</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={24} />
          <span>Controls</span>
        </button>
      </div>

    </div>
  );
}

export default App;