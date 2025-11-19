import React from 'react';
import './App.css';
import SettingsPanel from './components/SettingsPanel';
import TweetFeed from './components/TweetFeed';
import { Radio, BarChart3, Layers } from 'lucide-react';

function App() {
  return (
    <div className="dashboard-layout">
      
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <Radio color="#3b82f6" /> NEWS.AI
        </div>
        
        <div style={{flex: 1}}>
           <SettingsPanel />
           
           {/* Mini Stats (Static for now) */}
           <div className="panel" style={{marginTop: '20px', padding: '15px'}}>
              <div className="panel-header" style={{marginBottom:'10px'}}>
                <BarChart3 size={14}/> System Health
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:'8px'}}>
                 <span style={{color:'#666'}}>CPU Load</span>
                 <span style={{color:'#10b981'}}>12%</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem'}}>
                 <span style={{color:'#666'}}>Memory</span>
                 <span style={{color:'#3b82f6'}}>240MB</span>
              </div>
           </div>
        </div>

        <div style={{fontSize: '0.8rem', color: '#333'}}>
          v1.0.4 • Stable Build
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="header-section">
          <h1 className="page-title">Mission Control</h1>
          <p className="page-subtitle">Real-time feed from autonomous agents.</p>
        </div>

        <TweetFeed />
      </main>

    </div>
  );
}

export default App;