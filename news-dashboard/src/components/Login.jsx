import React, { useState } from 'react';
import { Sparkles, LogIn, Lock, User, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Enter your username and password.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await apiService.login(username.trim(), password);
    setLoading(false);
    if (result.success) {
      onLogin(result.data.username);
    } else {
      setError(result.error || 'Login failed');
      setPassword('');
    }
  };

  return (
    <div className="login-screen">
      <form className="glass-card login-card" onSubmit={handleSubmit} noValidate>
        <div className="brand login-brand">
          <div className="brand-mark">
            <Sparkles size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <span className="brand-name">NEWSIFYX.AI</span>
            <span className="brand-tagline">Mission control access</span>
          </div>
        </div>

        <h1 className="login-title">Sign in</h1>
        <p className="login-subtitle">This dashboard is private. Log in to continue.</p>

        <label className="login-field">
          <span className="login-label">Username</span>
          <div className="login-input-wrap">
            <User size={16} className="login-input-icon" />
            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>
        </label>

        <label className="login-field">
          <span className="login-label">Password</span>
          <div className="login-input-wrap">
            <Lock size={16} className="login-input-icon" />
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
        </label>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
          <LogIn size={18} />
          <span>{loading ? 'Signing in…' : 'Sign in'}</span>
        </button>
      </form>
    </div>
  );
}
