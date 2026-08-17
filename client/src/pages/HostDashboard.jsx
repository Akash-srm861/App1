import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import api from '../api/api';
import {
  Users, HelpCircle, RefreshCw, AlertTriangle, CheckCircle,
  Clock, ShieldAlert, Settings, Plus, Edit2, Trash2, RotateCcw, Key, FileText
} from 'lucide-react';

const HostDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, teams, questions, settings, logs
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [resetModalTeam, setResetModalTeam] = useState(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [questionsList, setQuestionsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settingsData, setSettingsData] = useState({ event_name: '', duration: '600' });
  const [hostPasswordData, setHostPasswordData] = useState({ currentPassword: '', newPassword: '' });

  const [msg, setMsg] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/host/dashboard');
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch host dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/host/questions');
      setQuestionsList(res.data.questions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/host/settings');
      setSettingsData(res.data.settings || {});
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/host/audit-logs');
      setAuditLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchQuestions();
    fetchSettings();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') fetchAuditLogs();
    if (activeTab === 'questions') fetchQuestions();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  // Handle Team Reset
  const handleResetTeam = async () => {
    if (!resetModalTeam) return;
    try {
      await api.post(`/host/reset-team/${resetModalTeam.id}`);
      setMsg(`Team ${resetModalTeam.name} has been reset.`);
      setResetModalTeam(null);
      fetchDashboardData();
    } catch (err) {
      alert('Reset failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Team Form Submit
  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      password: formData.get('password'),
      question_id: formData.get('question_id') ? parseInt(formData.get('question_id'), 10) : null
    };

    try {
      if (editingTeam) {
        await api.put(`/host/teams/${editingTeam.id}`, payload);
        setMsg('Team updated successfully');
      } else {
        await api.post('/host/teams', payload);
        setMsg('Team added successfully');
      }
      setTeamModalOpen(false);
      setEditingTeam(null);
      fetchDashboardData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // Delete Team
  const handleDeleteTeam = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete team ${name}?`)) return;
    try {
      await api.delete(`/host/teams/${id}`);
      setMsg(`Team ${name} deleted.`);
      fetchDashboardData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Question Form Submit
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      title: formData.get('title'),
      description: formData.get('description'),
      input: formData.get('input'),
      expected_output: formData.get('expected_output'),
      allowed_languages: formData.get('allowed_languages')
    };

    try {
      if (editingQuestion) {
        await api.put(`/host/questions/${editingQuestion.id}`, payload);
        setMsg('Question updated successfully');
      } else {
        await api.post('/host/questions', payload);
        setMsg('Question added successfully');
      }
      setQuestionModalOpen(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete question: "${title}"?`)) return;
    try {
      await api.delete(`/host/questions/${id}`);
      setMsg(`Question deleted successfully.`);
      fetchQuestions();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Update Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.post('/host/settings', settingsData);
      setMsg('Event settings saved.');
      fetchDashboardData();
    } catch (err) {
      alert('Failed to save settings: ' + (err.response?.data?.error || err.message));
    }
  };

  // Change Admin Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/host/change-password', hostPasswordData);
      setMsg('Admin password changed successfully.');
      setHostPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      alert('Password change failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const formatSecs = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  if (loading) return <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading Host Dashboard...</div>;

  const stats = data?.stats || {};
  const teams = data?.teams || [];

  return (
    <div className="app-container">
      <Header />

      <main style={{ padding: '24px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
        {/* Banner Alert Msg */}
        {msg && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{msg}</span>
            <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Users size={16} />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`btn ${activeTab === 'questions' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <HelpCircle size={16} />
            <span>Manage Questions ({questionsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Settings size={16} />
            <span>Event Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileText size={16} />
            <span>Audit Logs</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Stat Counter Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL TEAMS</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.totalTeams}</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #64748b' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>NOT STARTED</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#94a3b8' }}>{stats.notStarted}</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #60a5fa' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#60a5fa' }}>{stats.active}</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #34d399' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>FINISHED</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{stats.finished}</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DISQUALIFIED</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>{stats.disqualified}</div>
              </div>

              <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIME UP</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24' }}>{stats.timeUp}</div>
              </div>
            </div>

            {/* Team Management Controls Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Team Competition Status</h2>
              <button
                onClick={() => { setEditingTeam(null); setTeamModalOpen(true); }}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Add Team</span>
              </button>
            </div>

            {/* Main Teams Table */}
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '14px 18px' }}>TEAM</th>
                    <th style={{ padding: '14px 18px' }}>ASSIGNED QUESTION</th>
                    <th style={{ padding: '14px 18px' }}>STATUS</th>
                    <th style={{ padding: '14px 18px' }}>STARTED AT</th>
                    <th style={{ padding: '14px 18px' }}>REMAINING TIME</th>
                    <th style={{ padding: '14px 18px' }}>PASSED TESTS</th>
                    <th style={{ padding: '14px 18px' }}>TOTAL TESTS</th>
                    <th style={{ padding: '14px 18px' }}>SUBMISSION RESULT</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {t.name}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {t.question_title ? (
                          <span style={{ color: '#60a5fa' }}>Q{t.question_id}: {t.question_title}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`badge badge-${t.status}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {t.started_at ? new Date(t.started_at).toLocaleTimeString() : '-'}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {t.status === 'ACTIVE' ? (
                          <span style={{ color: t.remainingSeconds < 120 ? '#fbbf24' : '#34d399' }}>
                            {formatSecs(t.remainingSeconds)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'center' }}>
                        {t.total_tests > 0 ? (
                          <span style={{ color: t.passed_tests === t.total_tests ? '#34d399' : '#fbbf24' }}>
                            {t.passed_tests}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'center' }}>
                        {t.total_tests > 0 ? t.total_tests : <span style={{ color: 'var(--text-dim)' }}>-</span>}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {t.result === 'CORRECT' && <span style={{ color: '#34d399', fontWeight: 700 }}>CORRECT</span>}
                        {(t.result === 'WRONG ANSWER' || t.result === 'WRONG_ANSWER') && <span style={{ color: '#f87171', fontWeight: 700 }}>WRONG ANSWER</span>}
                        {(t.result === 'COMPILATION ERROR' || t.result === 'COMPILATION_ERROR') && <span style={{ color: '#fbbf24', fontWeight: 700 }}>COMPILATION ERROR</span>}
                        {(t.result === 'RUNTIME ERROR' || t.result === 'RUNTIME_ERROR') && <span style={{ color: '#f87171', fontWeight: 700 }}>RUNTIME ERROR</span>}
                        {(t.result === 'TIME LIMIT EXCEEDED' || t.result === 'TIME_LIMIT_EXCEEDED') && <span style={{ color: '#f59e0b', fontWeight: 700 }}>TIME LIMIT EXCEEDED</span>}
                        {(t.result === 'NONE' || !t.result) && <span style={{ color: 'var(--text-dim)' }}>-</span>}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setResetModalTeam(t)}
                            className="btn btn-outline"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            title="Reset Team Session"
                          >
                            <RotateCcw size={14} />
                            <span>Reset</span>
                          </button>

                          <button
                            onClick={() => { setEditingTeam(t); setTeamModalOpen(true); }}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            title="Edit Team"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteTeam(t.id, t.name)}
                            className="btn btn-danger"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            title="Delete Team"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: QUESTIONS MANAGEMENT */}
        {activeTab === 'questions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Question Bank</h2>
              <button
                onClick={() => { setEditingQuestion(null); setQuestionModalOpen(true); }}
                className="btn btn-primary"
              >
                <Plus size={16} />
                <span>Create New Question</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
              {questionsList.map((q) => (
                <div key={q.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ backgroundColor: 'rgba(255, 42, 75, 0.15)', color: 'var(--accent-red)', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                      Q{q.id < 10 ? `0${q.id}` : q.id}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => { setEditingQuestion(q); setQuestionModalOpen(true); }}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id, q.title)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{q.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {q.description}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Input length: {q.input ? q.input.length : 0} chars</span>
                    <span>Expected length: {q.expected_output ? q.expected_output.length : 0} chars</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: EVENT SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Competition Event Settings */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Competition Settings</h3>
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    EVENT NAME
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settingsData.event_name || ''}
                    onChange={(e) => setSettingsData({ ...settingsData, event_name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    COMPETITION DURATION (SECONDS) - Default: 600 (10 mins)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={settingsData.duration || '600'}
                    onChange={(e) => setSettingsData({ ...settingsData, duration: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                  Save Settings
                </button>
              </form>
            </div>

            {/* Host Admin Password Change */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Change Host Password</h3>
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    CURRENT HOST PASSWORD
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={hostPasswordData.currentPassword}
                    onChange={(e) => setHostPasswordData({ ...hostPasswordData, currentPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    NEW HOST PASSWORD
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={hostPasswordData.newPassword}
                    onChange={(e) => setHostPasswordData({ ...hostPasswordData, newPassword: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-secondary" style={{ marginTop: '10px' }}>
                  Update Admin Password
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="card" style={{ padding: 0 }}>
            <h3 style={{ padding: '18px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>System Audit Logs</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px 18px' }}>ACTION</th>
                  <th style={{ padding: '12px 18px' }}>DETAILS</th>
                  <th style={{ padding: '12px 18px' }}>IP ADDRESS</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#60a5fa' }}>{log.action}</td>
                    <td style={{ padding: '12px 18px' }}>{log.details}</td>
                    <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* CONFIRM RESET MODAL */}
      {resetModalTeam && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', border: '1px solid var(--border-accent)', padding: '28px' }}>
            <h3 style={{ color: 'var(--accent-red)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} />
              Confirm Reset Team Session
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to reset <strong>{resetModalTeam.name}</strong>?<br /><br />
              This action will:
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--text-muted)' }}>
                <li>Invalidate current team session</li>
                <li>Clear started time & finish time</li>
                <li>Clear result & disqualification flag</li>
                <li>Set team status back to <strong>NOT_STARTED</strong></li>
              </ul>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setResetModalTeam(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleResetTeam} className="btn btn-primary">Confirm Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT TEAM MODAL */}
      {teamModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h3 style={{ marginBottom: '16px' }}>{editingTeam ? 'Edit Team' : 'Add New Team'}</h3>
            <form onSubmit={handleTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>TEAM NAME</label>
                <input
                  name="name"
                  type="text"
                  className="input-field"
                  defaultValue={editingTeam ? editingTeam.name : ''}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  PASSWORD {editingTeam && '(Leave blank to keep unchanged)'}
                </label>
                <input
                  name="password"
                  type="password"
                  className="input-field"
                  required={!editingTeam}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ASSIGNED QUESTION</label>
                <select name="question_id" className="input-field" defaultValue={editingTeam ? (editingTeam.question_id || '') : ''}>
                  <option value="">None (Unassigned)</option>
                  {questionsList.map(q => (
                    <option key={q.id} value={q.id}>Q{q.id}: {q.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setTeamModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD/EDIT QUESTION MODAL */}
      {questionModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>{editingQuestion ? 'Edit Question' : 'Create New Question'}</h3>
            <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>TITLE</label>
                <input
                  name="title"
                  type="text"
                  className="input-field"
                  defaultValue={editingQuestion ? editingQuestion.title : ''}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>DESCRIPTION</label>
                <textarea
                  name="description"
                  className="input-field"
                  rows={4}
                  defaultValue={editingQuestion ? editingQuestion.description : ''}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>INPUT (stdin)</label>
                <textarea
                  name="input"
                  className="input-field"
                  rows={2}
                  defaultValue={editingQuestion ? editingQuestion.input : ''}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>EXPECTED OUTPUT</label>
                <textarea
                  name="expected_output"
                  className="input-field"
                  rows={3}
                  defaultValue={editingQuestion ? editingQuestion.expected_output : ''}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ALLOWED LANGUAGES (comma-separated)</label>
                <input
                  name="allowed_languages"
                  type="text"
                  className="input-field"
                  defaultValue={editingQuestion ? editingQuestion.allowed_languages : 'python,c,cpp,java,javascript'}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setQuestionModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
