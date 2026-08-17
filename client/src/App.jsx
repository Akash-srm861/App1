import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import TeamLogin from './pages/TeamLogin';
import HostLogin from './pages/HostLogin';
import ParticipantDashboard from './pages/ParticipantDashboard';
import HostDashboard from './pages/HostDashboard';
import './index.css';

const MainApp = () => {
  const { role, token, loading } = useAuth();
  const [showHostLogin, setShowHostLogin] = useState(false);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-main)',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-red)' }}>
            CODE THE OUTPUT
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Loading competition environment...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!token || !role) {
    return showHostLogin ? (
      <HostLogin onParticipantLoginClick={() => setShowHostLogin(false)} />
    ) : (
      <TeamLogin onHostLoginClick={() => setShowHostLogin(true)} />
    );
  }

  // Team Participant view
  if (role === 'team') {
    return <ParticipantDashboard />;
  }

  // Host Admin view
  if (role === 'admin') {
    return <HostDashboard />;
  }

  return <TeamLogin onHostLoginClick={() => setShowHostLogin(true)} />;
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
