import React, { useState } from 'react';
import { BookOpen, ChevronRight, X, Zap, Settings, Activity, Clock, Power, RefreshCw, ExternalLink } from 'lucide-react';

const HowToUse = ({ onClose }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth <= 480);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsSmallMobile(window.innerWidth <= 480);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <BookOpen size={20} />,
      content: (
        <div>
          <p style={{marginBottom: '12px', lineHeight: '1.6'}}>
            NEWSIFYX.AI is an autonomous AI-powered news tweeting system that automatically finds breaking news, 
            writes engaging tweets, and posts them to X (Twitter) on your behalf.
          </p>
          <p style={{lineHeight: '1.6'}}>
            The system runs continuously, monitoring news sources and posting updates based on your configured schedule.
          </p>
        </div>
      )
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Zap size={20} />,
      content: (
        <div>
          <ol style={{paddingLeft: '20px', lineHeight: '1.8'}}>
            <li style={{marginBottom: '10px'}}>
              <strong>Start the Backend Server:</strong> Ensure the FastAPI backend is running and accessible
            </li>
            <li style={{marginBottom: '10px'}}>
              <strong>Configure API URL:</strong> Set <code style={{background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px'}}>VITE_API_URL</code> in <code style={{background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px'}}>.env</code> file with your backend URL
            </li>
            <li style={{marginBottom: '10px'}}>
              <strong>Check API Status:</strong> Look for "API Online" status in the System Health panel
            </li>
            <li style={{marginBottom: '10px'}}>
              <strong>Configure Settings:</strong> Set your preferred posting frequency and active hours
            </li>
            <li style={{marginBottom: '10px'}}>
              <strong>Activate System:</strong> Toggle "SYSTEM ONLINE" to start automatic posting
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'controls',
      title: 'Control Panel',
      icon: <Settings size={20} />,
      content: (
        <div>
          <div style={{marginBottom: '16px'}}>
            <h4 style={{marginBottom: '8px', color: '#3b82f6'}}>System Status</h4>
            <ul style={{paddingLeft: '20px', lineHeight: '1.8'}}>
              <li><strong>SYSTEM ONLINE:</strong> Activates automatic scheduled posting</li>
              <li><strong>SYSTEM PAUSED:</strong> Stops automatic posting (manual trigger still works)</li>
            </ul>
          </div>
          <div style={{marginBottom: '16px'}}>
            <h4 style={{marginBottom: '8px', color: '#3b82f6'}}>Frequency Slider</h4>
            <p style={{lineHeight: '1.6'}}>
              Adjust how many tweets to post per day (1-12). The system automatically calculates posting intervals 
              based on your active hours.
            </p>
          </div>
          <div>
            <h4 style={{marginBottom: '8px', color: '#3b82f6'}}>Manual Trigger</h4>
            <p style={{lineHeight: '1.6'}}>
              Click "TRIGGER POST NOW" to immediately find news and post a tweet. This works even when the system is paused.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'live-feed',
      title: 'Live Activity Feed',
      icon: <Activity size={20} />,
      content: (
        <div>
          <p style={{marginBottom: '12px', lineHeight: '1.6'}}>
            The Live Feed shows all tweets posted by the AI agent in reverse chronological order (newest first).
          </p>
          <ul style={{paddingLeft: '20px', lineHeight: '1.8'}}>
            <li>View the last 10 posted tweets</li>
            <li>See tweet content, topic, and timestamp</li>
            <li>Click "View Live Post" to open the tweet on X</li>
            <li>Auto-refreshes every 30 seconds</li>
            <li>Manual refresh button available</li>
          </ul>
        </div>
      )
    },
    {
      id: 'posting',
      title: 'How Posting Works',
      icon: <Clock size={20} />,
      content: (
        <div>
          <div style={{marginBottom: '16px'}}>
            <h4 style={{marginBottom: '8px', color: '#3b82f6'}}>Automatic Posting</h4>
            <ol style={{paddingLeft: '20px', lineHeight: '1.8'}}>
              <li>System finds top news stories from reliable sources</li>
              <li>AI selects the most interesting story</li>
              <li>AI writes an engaging tweet (2-3 sentences)</li>
              <li>Relevant hashtags are generated</li>
              <li>Tweet is posted to X (Twitter)</li>
              <li>Posted tweet appears in Live Feed</li>
            </ol>
          </div>
          <div>
            <h4 style={{marginBottom: '8px', color: '#3b82f6'}}>Active Hours</h4>
            <p style={{lineHeight: '1.6'}}>
              The system only posts during your configured active hours (default: 9 AM - 10 PM). 
              Posts are distributed evenly throughout the active period based on your frequency setting.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Tips & Best Practices',
      icon: <Power size={20} />,
      content: (
        <div>
          <ul style={{paddingLeft: '20px', lineHeight: '1.8'}}>
            <li style={{marginBottom: '8px'}}>
              <strong>Start with lower frequency:</strong> Begin with 2-4 tweets/day to test the system
            </li>
            <li style={{marginBottom: '8px'}}>
              <strong>Monitor the Live Feed:</strong> Check posted tweets to ensure quality
            </li>
            <li style={{marginBottom: '8px'}}>
              <strong>Use manual trigger:</strong> Test the system before enabling automatic posting
            </li>
            <li style={{marginBottom: '8px'}}>
              <strong>Check API status:</strong> Ensure backend is running for the dashboard to work
            </li>
            <li style={{marginBottom: '8px'}}>
              <strong>Refresh if needed:</strong> Use refresh buttons to manually update data
            </li>
            <li>
              <strong>Pause when needed:</strong> Toggle system off if you want to stop automatic posting temporarily
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <RefreshCw size={20} />,
      content: (
        <div>
          <div style={{marginBottom: '16px'}}>
            <h4 style={{marginBottom: '8px', color: '#ef4444'}}>API Offline</h4>
            <p style={{lineHeight: '1.6', marginBottom: '8px'}}>
              If you see "API Offline" error:
            </p>
            <ul style={{paddingLeft: '20px', lineHeight: '1.8'}}>
              <li>Ensure the FastAPI backend server is running</li>
              <li>Check <code style={{background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px'}}>VITE_API_URL</code> in <code style={{background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px'}}>.env</code> file points to correct backend URL</li>
              <li>Verify your network connection</li>
              <li>Check browser console (F12) for API connection errors</li>
            </ul>
          </div>
          <div style={{marginBottom: '16px'}}>
            <h4 style={{marginBottom: '8px', color: '#ef4444'}}>No Tweets Appearing</h4>
            <ul style={{paddingLeft: '20px', lineHeight: '1.8'}}>
              <li>Check if system is set to "SYSTEM ONLINE"</li>
              <li>Verify active hours include current time</li>
              <li>Wait for the next scheduled post time</li>
              <li>Try manual trigger to test</li>
            </ul>
          </div>
          <div>
            <h4 style={{marginBottom: '8px', color: '#ef4444'}}>Errors During Posting</h4>
            <ul style={{paddingLeft: '20px', lineHeight: '1.8'}}>
              <li>Check error message in the modal</li>
              <li>Verify Twitter API credentials are configured</li>
              <li>Check Firebase connection</li>
              <li>Use "Retry" button to try again</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const [expandedSection, setExpandedSection] = useState('overview');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(5px)',
      zIndex: 1000,
      overflowY: 'auto',
      padding: isMobile ? '20px 10px' : '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: '#0f0f0f',
        border: '1px solid #262626',
        borderRadius: '16px',
        padding: isMobile ? '20px' : '30px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid #262626'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <BookOpen size={24} color="#3b82f6" />
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              color: '#ededed'
            }}>
              How to Use NEWSIFYX.AI
            </h1>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '8px',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {sections.map((section) => (
            <div
              key={section.id}
              style={{
                background: '#1a1a1a',
                border: '1px solid #262626',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s'
              }}
            >
              <button
                onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                style={{
                  width: '100%',
                  padding: isMobile ? '16px' : '20px',
                  background: 'none',
                  border: 'none',
                  color: '#ededed',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left'
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <div style={{color: '#3b82f6'}}>{section.icon}</div>
                  <h3 style={{
                    margin: 0,
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontWeight: 600
                  }}>
                    {section.title}
                  </h3>
                </div>
                <ChevronRight
                  size={20}
                  style={{
                    transform: expandedSection === section.id ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                    color: '#a1a1aa'
                  }}
                />
              </button>
              {expandedSection === section.id && (
                <div style={{
                  padding: isMobile ? '0 16px 16px' : '0 20px 20px',
                  color: '#a1a1aa',
                  fontSize: isMobile ? '0.875rem' : '0.9rem',
                  lineHeight: '1.6',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{margin: 0, color: '#3b82f6', fontSize: '0.9rem'}}>
            Need more help? Check the API documentation or review the system logs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowToUse;

