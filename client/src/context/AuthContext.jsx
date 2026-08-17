import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('cto_token') || null);
  const [role, setRole] = useState(localStorage.getItem('cto_role') || null);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user or team profile on init or token change
  useEffect(() => {
    const initAuth = async () => {
      if (!token || !role) {
        setLoading(false);
        return;
      }

      try {
        if (role === 'team') {
          const res = await api.get('/team/me');
          setTeam(res.data.team);
        } else if (role === 'admin') {
          setUser({ username: 'admin', role: 'admin' });
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token, role]);

  const loginHost = async (username, password) => {
    const res = await api.post('/auth/host-login', { username, password });
    const { token, user } = res.data;
    localStorage.setItem('cto_token', token);
    localStorage.setItem('cto_role', 'admin');
    setToken(token);
    setRole('admin');
    setUser(user);
    return res.data;
  };

  const loginTeam = async (teamName, password) => {
    const res = await api.post('/auth/team-login', { teamName, password });
    const { token, team } = res.data;
    localStorage.setItem('cto_token', token);
    localStorage.setItem('cto_role', 'team');
    setToken(token);
    setRole('team');
    setTeam(team);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('cto_token');
    localStorage.removeItem('cto_role');
    setToken(null);
    setRole(null);
    setUser(null);
    setTeam(null);
  };

  const disqualifyTeam = async () => {
    if (role === 'team' && team && team.status === 'ACTIVE') {
      try {
        const res = await api.post('/team/disqualify');
        setTeam(prev => prev ? { ...prev, status: 'DISQUALIFIED', disqualification_at: new Date().toISOString() } : null);
        return res.data;
      } catch (err) {
        console.error('Disqualification error:', err);
      }
    }
  };

  const refreshTeamStatus = async () => {
    if (role === 'team' && token) {
      try {
        const res = await api.get('/team/me');
        setTeam(res.data.team);
      } catch (err) {
        console.error('Error refreshing team status:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        team,
        loading,
        loginHost,
        loginTeam,
        logout,
        disqualifyTeam,
        refreshTeamStatus,
        setTeam
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
