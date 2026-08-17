import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Code2, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

const TeamLogin = ({ onHostLoginClick }) => {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginTeam } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!teamName || !password) {
      setErrorMsg('Please enter both team name and password.');
      return;
    }

    setLoading(true);
    try {
      await loginTeam(teamName, password);
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.message || err.response.data.error || 'Login failed.');
      } else {
        setErrorMsg('Network error. Failed to connect to competition server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card animate-fade-in" style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '36px 32px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(255, 42, 75, 0.15)',
            border: '1px solid var(--accent-red)',
            padding: '14px',
            borderRadius: '16px',
            marginBottom: '16px',
            boxShadow: '0 0 20px rgba(255, 42, 75, 0.25)'
          }}>
            <Code2 size={36} color="var(--accent-red)" />
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            letterSpacing: '1px',
            background: 'linear-gradient(90deg, #ffffff 0%, #ff2a4b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            CODE THE OUTPUT
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            Team Participant Login
          </p>
        </div>

        {/* Single-Use Warning Notice */}
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.78rem',
          color: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span>ATTENTION: Login is SINGLE-USE. Your 10-minute competition timer starts immediately upon login.</span>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#f87171',
            fontSize: '0.9rem',
            fontWeight: 700,
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              TEAM NAME
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. TEAM01"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              disabled={loading}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              TEAM PASSWORD
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter team password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '6px' }}
          >
            {loading ? 'STARTING SESSION...' : 'START COMPETITION'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Host Login Switch */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={onHostLoginClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lock size={14} />
            <span>Switch to Host Admin Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamLogin;
