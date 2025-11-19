import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { Sliders, Power, Clock } from 'lucide-react';

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

  if (loading) return <div className="panel">Connecting...</div>;

  return (
    <div className="panel">
      <div className="panel-header">
        <Sliders size={14} /> Configuration
      </div>

      {/* MASTER SWITCH */}
      <div className="control-group">
        <button 
          className={`power-btn ${config.is_active ? 'active' : 'inactive'}`}
          onClick={() => updateConfig('is_active', !config.is_active)}
        >
          <Power size={18} />
          {config.is_active ? "SYSTEM ONLINE" : "SYSTEM PAUSED"}
        </button>
      </div>

      {/* FREQUENCY */}
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
      </div>

      {/* HOURS */}
      <div className="control-group">
        <div className="label-row">
          <span>Active Hours (24h)</span>
          <Clock size={14} color="#666"/>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            <input 
                className="input-dark"
                type="number" min="0" max="23"
                value={config.active_hours_start}
                onChange={(e) => updateConfig('active_hours_start', parseInt(e.target.value))}
            />
            <input 
                className="input-dark"
                type="number" min="0" max="23"
                value={config.active_hours_end}
                onChange={(e) => updateConfig('active_hours_end', parseInt(e.target.value))}
            />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;