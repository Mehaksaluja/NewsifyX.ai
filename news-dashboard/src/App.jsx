import React, { useState, useEffect } from 'react';
import './App.css';
import SettingsPanel from './components/SettingsPanel';
import TweetFeed from './components/TweetFeed';
import { Radio, BarChart3, LayoutList, Settings } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${isMobile && activeTab === 'settings' ? 'active' : ''} ${!isMobile ? 'active' : ''}`}>
        
        <div className="brand">
          <Radio color="#3b82f6" /> NEWS.AI
        </div>
        
        <div style={{flex: 1}}>
           <SettingsPanel />

           <div className="panel" style={{marginTop: '20px', padding: '15px'}}>
              <div className="panel-header" style={{marginBottom:'10px'}}>
                <BarChart3 size={14}/> System Health
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:'8px'}}>
                 <span style={{color:'#666'}}>CPU Load</span>
                 <span style={{color:'#10b981'}}>Optimal</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}>
                 <span style={{color:'#666'}}>Status</span>
                 <span style={{color:'#3b82f6'}}>Running</span>
              </div>
           </div>
        </div>

        {!isMobile && (
          <div style={{fontSize: '0.8rem', color: '#333'}}>
            v1.0.4 • Edge Node
          </div>
        )}
      </aside>

      <main className={`main-content ${isMobile && activeTab === 'feed' ? 'active' : ''} ${!isMobile ? 'active' : ''}`}>
        <div className="header-section">
          <h1 className="page-title">Mission Control</h1>
          <p className="page-subtitle">Live feed from autonomous agents.</p>
        </div>

        <TweetFeed />
      </main>

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