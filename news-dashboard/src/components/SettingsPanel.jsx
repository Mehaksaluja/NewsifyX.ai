import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { Sliders, Power, Clock, Zap } from 'lucide-react';

const SettingsPanel = () => {
  const [config, setConfig] = useState({
    is_active: true,
    tweets_per_day: 4,
    active_hours_start: 9,
    active_hours_end: 22
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const configRef = doc(db, "bot_config", "main_settings");
    
    const unsubscribe = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      } else {
        setDoc(configRef, config);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = async (key, value) => {
    const configRef = doc(db, "bot_config", "main_settings");
    await updateDoc(configRef, { [key]: value });
  };

  const triggerPostNow = async () => {
    const confirmPost = window.confirm("Are you sure you want to force a tweet immediately?");
    if (confirmPost) {
        const configRef = doc(db, "bot_config", "main_settings");
        await updateDoc(configRef, { force_run: true });
        alert("Command Sent! The bot will execute in the next 10-30 seconds.");
    }
  };

  if (loading) return <div className="panel">Connecting to Mainframe...</div>;

  return (
    <div className="panel">
      <div className="panel-header">
        <Sliders size={14} /> Configuration
      </div>

      <div className="control-group" style={{borderBottom: '1px solid #262626', paddingBottom: '20px', marginBottom: '20px'}}>
        <button 
          className="power-btn"
          style={{
            background: 'rgba(59, 130, 246, 0.1)', 
            color: '#3b82f6', 
            borderColor: 'rgba(59, 130, 246, 0.3)'
          }}
          onClick={triggerPostNow}
        >
          <Zap size={18} fill="#3b82f6" />
          TRIGGER POST NOW
        </button>
        <small style={{display:'block', marginTop:'8px', color:'#52525b', textAlign:'center', fontSize: '0.8rem'}}>
            Overrides schedule. Posts immediately.
        </small>
      </div>

      <div className="control-group">
        <button 
          className={`power-btn ${config.is_active ? 'active' : 'inactive'}`}
          onClick={() => updateConfig('is_active', !config.is_active)}
        >
          <Power size={18} />
          {config.is_active ? "SYSTEM ONLINE" : "SYSTEM PAUSED"}
        </button>
      </div>

      <div className="control-group">
        <div className="label-row">
          <span>Frequency</span>
          <span style={{color: '#3b82f6'}}>{config.tweets_per_day} posts/day</span>
        </div>
        <input 
          type="range" 
          min="1" max="12" 
          value={config.tweets_per_day}
          onChange={(e) => updateConfig('tweets_per_day', parseInt(e.target.value))}
        />
        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'#52525b', marginTop:'5px'}}>
            <span>1/day</span>
            <span>12/day</span>
        </div>
      </div>

      <div className="control-group">
        <div className="label-row">
          <span>Active Hours (24h)</span>
          <Clock size={14} color="#666"/>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            <div>
                <label style={{fontSize:'0.7rem', color:'#52525b'}}>Start</label>
                <input 
                    className="input-dark"
                    type="number" min="0" max="23"
                    value={config.active_hours_start}
                    onChange={(e) => updateConfig('active_hours_start', parseInt(e.target.value))}
                />
            </div>
            <div>
                <label style={{fontSize:'0.7rem', color:'#52525b'}}>End</label>
                <input 
                    className="input-dark"
                    type="number" min="0" max="23"
                    value={config.active_hours_end}
                    onChange={(e) => updateConfig('active_hours_end', parseInt(e.target.value))}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;