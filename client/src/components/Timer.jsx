import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const Timer = ({ startedAt, durationSeconds = 600, status, onTimeUp }) => {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (!startedAt || status !== 'ACTIVE') {
      return;
    }

    const computeRemaining = () => {
      const startMs = new Date(startedAt).getTime();
      const nowMs = Date.now();
      const elapsed = Math.floor((nowMs - startMs) / 1000);
      const left = Math.max(0, durationSeconds - elapsed);
      setRemaining(left);

      if (left <= 0 && status === 'ACTIVE') {
        if (onTimeUp) onTimeUp();
      }
    };

    computeRemaining();
    const interval = setInterval(computeRemaining, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationSeconds, status, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${formattedMins}:${formattedSecs}`;
  };

  const isWarning = remaining < 120 && remaining > 0;
  const isTimeUp = remaining <= 0 || status === 'TIME_UP';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: isTimeUp
        ? 'rgba(239, 68, 68, 0.2)'
        : isWarning
        ? 'rgba(245, 158, 11, 0.2)'
        : 'rgba(255, 42, 75, 0.1)',
      border: `1px solid ${
        isTimeUp
          ? 'rgba(239, 68, 68, 0.6)'
          : isWarning
          ? 'rgba(245, 158, 11, 0.6)'
          : 'var(--border-accent)'
      }`,
      padding: '6px 16px',
      borderRadius: '20px',
      boxShadow: isWarning ? '0 0 15px rgba(245, 158, 11, 0.3)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      {isWarning || isTimeUp ? (
        <AlertTriangle size={18} color={isTimeUp ? '#ef4444' : '#f59e0b'} />
      ) : (
        <Clock size={18} color="var(--accent-red)" />
      )}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '1.1rem',
        fontWeight: 800,
        color: isTimeUp ? '#f87171' : isWarning ? '#fbbf24' : '#ffffff',
        letterSpacing: '1px'
      }}>
        {formatTime(remaining)}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        REMAINING
      </span>
    </div>
  );
};

export default Timer;
