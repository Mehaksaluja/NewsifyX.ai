import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { Sliders, Power, Clock, Zap, AlertTriangle, CheckCircle, X } from 'lucide-react';

const SettingsPanel = () => {
  const [config, setConfig] = useState({
    is_active: true,
    tweets_per_day: 4,
    active_hours_start: 9,
    active_hours_end: 22,
    force_run: false
  });
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 480);

  const [modalState, setModalState] = useState('idle');

  useEffect(() => {
    const handleResize = () => setIsSmallMobile(window.innerWidth <= 480);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const configRef = doc(db, "bot_config", "main_settings");
    
    const unsubscribe = onSnapshot(
      configRef, 
      (docSnap) => {
        setConnectionError(null);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig(data);

          if (modalState === 'processing' && data.force_run === false) {
              setModalState('success');
          }
        } else {
          const defaultConfig = {
            is_active: true,
            tweets_per_day: 4,
            active_hours_start: 9,
            active_hours_end: 22,
            force_run: false
          };
          setDoc(configRef, defaultConfig).catch(err => {
            console.error("Error creating config:", err);
            setConnectionError("Failed to create config. Check Firebase connection.");
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firebase connection error:", error);
        setConnectionError("Cannot connect to Firebase. Please check your internet connection and Firebase configuration.");
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [modalState]);

  const updateConfig = async (key, value) => {
    try {
      const configRef = doc(db, "bot_config", "main_settings");
      await updateDoc(configRef, { [key]: value });
      setConnectionError(null);
    } catch (error) {
      console.error("Error updating config:", error);
      setConnectionError("Failed to update config. Check Firebase connection.");
    }
  };

  const handleTriggerClick = () => {
    setModalState('confirm');
  };

  const confirmPost = async () => {
    setModalState('processing');
    try {
      const configRef = doc(db, "bot_config", "main_settings");
      await updateDoc(configRef, { force_run: true });
      setConnectionError(null);
    } catch (error) {
      console.error("Error triggering post:", error);
      setConnectionError("Failed to trigger post. Check Firebase connection.");
      setModalState('idle');
    }
  };

  const closeModal = () => {
    setModalState('idle');
  };

  if (loading) return <div className="panel">Connecting to Firebase...</div>;

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <Sliders size={14} /> Configuration
        </div>

        {connectionError && (
          <div style={{
            padding: isSmallMobile ? '10px' : '12px',
            marginBottom: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: isSmallMobile ? '0.8rem' : '0.85rem',
            wordWrap: 'break-word'
          }}>
            <strong>Connection Error:</strong> {connectionError}
          </div>
        )}

        <div className="control-group" style={{borderBottom:'1px solid #262626', paddingBottom:'20px'}}>
          <button 
            className="power-btn"
            style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: '#3b82f6'}}
            onClick={handleTriggerClick}
            disabled={config.force_run}
          >
            <Zap size={18} fill={config.force_run ? "currentColor" : "none"} /> 
            {config.force_run ? "AGENT WORKING..." : "TRIGGER POST NOW"}
          </button>
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
          <div className="label-row"><span>Frequency</span><span style={{color:'#3b82f6'}}>{config.tweets_per_day}/day</span></div>
          <input 
            type="range" min="1" max="12" 
            value={config.tweets_per_day}
            onChange={(e) => updateConfig('tweets_per_day', parseInt(e.target.value))}
          />
        </div>
      </div>

      {modalState === 'confirm' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon">
              <AlertTriangle size={30} />
            </div>
            <div className="modal-title">Deploy Agent?</div>
            <div className="modal-desc">
              This will force the AI to find news and post immediately. It overrides the schedule.
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn btn-confirm" onClick={confirmPost}>Yes, Post Now</button>
            </div>
          </div>
        </div>
      )}

      {modalState === 'processing' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="spinner"></div>
            <div className="modal-title">Agent is Working...</div>
            <div className="modal-desc">
              Finding news, writing tweet, and generating hashtags. Please wait (approx 20s).
            </div>
          </div>
        </div>
      )}

      {modalState === 'success' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon success">
              <CheckCircle size={30} />
            </div>
            <div className="modal-title">Tweet Posted!</div>
            <div className="modal-desc">
              Your AI agent has successfully broadcasted the update to X.
            </div>
            <div className="modal-actions">
              <button className="btn btn-confirm" onClick={closeModal}>Awesome</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPanel;