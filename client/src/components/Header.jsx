import React from 'react';
import { Code2, LogOut, ShieldAlert, Trophy, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Timer from './Timer';

const Header = ({ onTimeUp }) => {
  const { role, team, user, logout } = useAuth();

  return (
    <header style={{
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand Logo & Event Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          backgroundColor: 'rgba(255, 42, 75, 0.15)',
          border: '1px solid var(--accent-red)',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Code2 size={24} color="var(--accent-red)" />
        </div>
        <div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            letterSpacing: '1px',
            background: 'linear-gradient(90deg, #ffffff 0%, #ff2a4b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            CODE THE OUTPUT
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Annual College Coding Competition
          </span>
        </div>
      </div>

      {/* Middle section: Timer & Team Info (For Participant) */}
      {role === 'team' && team && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-panel)',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)'
          }}>
            <Trophy size={16} color="var(--accent-red)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>
              {team.name}
            </span>
          </div>

          <Timer
            startedAt={team.started_at}
            durationSeconds={team.durationSeconds || 600}
            status={team.status}
            onTimeUp={onTimeUp}
          />
        </div>
      )}

      {/* Host Admin Header details */}
      {role === 'admin' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700
          }}>
            <ShieldAlert size={16} />
            <span>HOST CONTROL PANEL</span>
          </div>
        </div>
      )}

      {/* Right Action: Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          title="Logout"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
