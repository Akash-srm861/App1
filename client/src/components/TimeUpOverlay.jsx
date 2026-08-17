import React from 'react';
import { Clock, Lock } from 'lucide-react';

const TimeUpOverlay = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(9, 10, 15, 0.95)',
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
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '2px solid #f59e0b',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 0 50px rgba(245, 158, 11, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: '#f59e0b',
          borderRadius: '50%',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)'
        }}>
          <Clock size={48} color="#ffffff" />
        </div>

        <h1 style={{
          color: '#fbbf24',
          fontSize: '2.8rem',
          fontWeight: 900,
          letterSpacing: '2px',
          margin: 0
        }}>
          TIME UP
        </h1>

        <p style={{
          color: '#f1f3f9',
          fontSize: '1.2rem',
          fontWeight: 600,
          margin: 0
        }}>
          The 10-minute competition timer has expired.
        </p>

        <p style={{
          color: '#8c92a4',
          fontSize: '0.9rem',
          maxWidth: '400px',
          lineHeight: 1.6
        }}>
          Code editing, code execution, and submissions are now disabled. Your session results have been recorded on the server.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '10px',
          color: '#fbbf24',
          fontSize: '0.85rem',
          fontWeight: 700
        }}>
          <Lock size={16} />
          <span>SESSION LOCKED BY SERVER</span>
        </div>
      </div>
    </div>
  );
};

export default TimeUpOverlay;
