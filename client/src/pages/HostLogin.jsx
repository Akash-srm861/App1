import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

const HostLogin = ({ onParticipantLoginClick }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginHost } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('Please enter username and password.');
      return;
    }

    setLoading(true);
    try {
      await loginHost(username, password);
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.error || 'Host login failed.');
      } else {
        setErrorMsg('Network error. Failed to connect to server.');
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
        maxWidth: '420px',
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        padding: '36px 32px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            padding: '14px',
            borderRadius: '16px',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={36} color="#60a5fa" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            HOST CONTROL LOGIN
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Competition Host Admin Console
          </p>
        </div>

        {/* Error Alert */}
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              HOST USERNAME
            </label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              HOST PASSWORD
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter host password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '0.95rem',
              backgroundColor: '#1d2238',
              borderColor: '#3b82f6',
              color: '#60a5fa'
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER HOST PANEL'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={onParticipantLoginClick}
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
            <ArrowLeft size={14} />
            <span>Return to Team Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostLogin;
