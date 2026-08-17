import React from 'react';
import { ShieldAlert, AlertOctagon, Lock } from 'lucide-react';

const DisqualifiedOverlay = ({ timestamp }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(9, 10, 15, 0.96)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '2px solid #ef4444',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 0 50px rgba(239, 68, 68, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: '#ef4444',
          borderRadius: '50%',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.6)'
        }}>
          <AlertOctagon size={48} color="#ffffff" />
        </div>

        <h1 style={{
          color: '#ef4444',
          fontSize: '2.5rem',
          fontWeight: 900,
          letterSpacing: '2px',
          margin: 0
        }}>
          DISQUALIFIED
        </h1>

        <p style={{
          color: '#f1f3f9',
          fontSize: '1.2rem',
          fontWeight: 600,
          margin: 0
        }}>
          Leaving the competition page is not allowed.
        </p>

        <p style={{
          color: '#8c92a4',
          fontSize: '0.9rem',
          maxWidth: '420px',
          lineHeight: 1.6
        }}>
          Your session was automatically flagged and terminated because a tab switch, window blur, or navigation event was detected by the server integrity monitor.
        </p>

        {timestamp && (
          <div style={{
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: '#5c6275',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: '6px 14px',
            borderRadius: '6px'
          }}>
            FLAGGED AT: {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '10px',
          color: '#ef4444',
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
          <Lock size={16} />
          <span>PLEASE CONTACT THE HOST FOR ASSISTANCE</span>
        </div>
      </div>
    </div>
  );
};

export default DisqualifiedOverlay;
