import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import QuestionView from '../components/QuestionView';
import CodeEditor from '../components/CodeEditor';
import ConsoleOutput from '../components/ConsoleOutput';
import DisqualifiedOverlay from '../components/DisqualifiedOverlay';
import TimeUpOverlay from '../components/TimeUpOverlay';
import api from '../api/api';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const ParticipantDashboard = () => {
  const { team, disqualifyTeam, refreshTeamStatus, setTeam } = useAuth();

  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleError, setConsoleError] = useState('');
  const [consoleStatus, setConsoleStatus] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAwayWarning, setShowAwayWarning] = useState(false);

  const mountTimeRef = useRef(Date.now());
  const graceTimerRef = useRef(null);

  const handleDisqualify = useCallback((reason = 'Violation detected') => {
    if (team && team.status === 'ACTIVE') {
      console.warn(`Disqualification condition triggered: ${reason}`);
      disqualifyTeam();
    }
  }, [team, disqualifyTeam]);

  // Anti-Inspection & DevTools Detection with Immediate Disqualification
  useEffect(() => {
    if (!team || team.status !== 'ACTIVE') return;

    // 1. Detect Inspect Keyboard Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDown = (e) => {
      const isF12 = e.key === 'F12' || e.keyCode === 123;
      const isInspectCombo = (e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key);
      const isViewSource = (e.ctrlKey || e.metaKey) && ['U', 'u'].includes(e.key);

      if (isF12 || isInspectCombo || isViewSource) {
        e.preventDefault();
        e.stopPropagation();
        handleDisqualify('DevTools / Inspect shortcut pressed');
      }
    };

    // 2. Disable Right-Click Context Menu (Prevents 'Inspect Element' menu)
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 3. DevTools Dimension / Docking Detection
    const checkDevTools = () => {
      if (Date.now() - mountTimeRef.current < 4000) return;
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        handleDisqualify('DevTools panel opened');
      }
    };

    // 4. Console getter trigger for Detached DevTools
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function () {
        if (Date.now() - mountTimeRef.current >= 4000) {
          handleDisqualify('Console inspected');
        }
      }
    });

    const consoleInterval = setInterval(() => {
      if (team && team.status === 'ACTIVE') {
        console.dir(element);
        checkDevTools();
      }
    }, 1000);

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('resize', checkDevTools);

    return () => {
      clearInterval(consoleInterval);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('resize', checkDevTools);
    };
  }, [team, handleDisqualify]);

  // Safe tab-switch & page exit detection (ONLY triggers when tab is hidden or left, never on browser password popups)
  useEffect(() => {
    if (!team || team.status !== 'ACTIVE') {
      setShowAwayWarning(false);
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      return;
    }

    const cancelGraceTimer = () => {
      if (graceTimerRef.current) {
        clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
      setShowAwayWarning(false);
    };

    const handleVisibilityChange = () => {
      // 6s initial grace period after login for save password prompt
      if (Date.now() - mountTimeRef.current < 6000) {
        return;
      }

      if (document.hidden) {
        setShowAwayWarning(true);
        if (!graceTimerRef.current) {
          graceTimerRef.current = setTimeout(() => {
            if (document.hidden) {
              handleDisqualify('Tab switched / window minimized');
            } else {
              cancelGraceTimer();
            }
          }, 1500); // 1.5 second grace period
        }
      } else {
        cancelGraceTimer();
      }
    };

    const handleBeforeUnload = () => {
      if (Date.now() - mountTimeRef.current >= 3000) {
        handleDisqualify('Page reload / closed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelGraceTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [team, handleDisqualify]);

  // Periodic status sync with server every 5 seconds
  useEffect(() => {
    if (!team || team.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      refreshTeamStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [team, refreshTeamStatus]);

  // Run Code Action
  const handleRunCode = async (source_code, language) => {
    setRunning(true);
    setConsoleError('');
    setConsoleStatus(null);
    setConsoleOutput('Executing code against sample input...');
    setSubmitResult(null);

    try {
      const res = await api.post('/team/run-code', { source_code, language });
      const stdout = res.data.stdout || '';
      const stderr = res.data.stderr || '';
      const rawStatus = res.data.status;

      // Ensure accuracy against sample expected output
      let finalStatus = rawStatus;
      const expected = team?.question?.expected_output;
      const norm = (s) => (s || '').replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).filter(Boolean).join('\n');
      
      const hasError = (rawStatus?.description || '').toUpperCase().includes('COMPILATION') ||
                       (rawStatus?.description || '').toUpperCase().includes('RUNTIME') ||
                       (rawStatus?.description || '').toUpperCase().includes('TIME LIMIT') ||
                       (rawStatus?.id === 6 || rawStatus?.id === 11 || rawStatus?.id === 5) ||
                       stderr.length > 0;

      if (hasError) {
        finalStatus = {
          id: 6,
          description: rawStatus?.description || 'ERROR',
          isCorrect: false
        };
      } else if (expected !== undefined) {
        const isMatch = norm(stdout) === norm(expected);
        if (isMatch && stdout.trim().length > 0) {
          finalStatus = {
            id: 3,
            description: 'CORRECT (Sample Match)',
            isCorrect: true
          };
        } else {
          finalStatus = {
            id: 4,
            description: 'WRONG ANSWER (Sample Mismatch)',
            isCorrect: false
          };
        }
      }

      setConsoleOutput(stdout);
      setConsoleError(stderr);
      setConsoleStatus(finalStatus);
      setExecutionTime(res.data.execution_time);
    } catch (err) {
      if (err.response && err.response.data) {
        setConsoleError(err.response.data.error || err.response.data.message || 'Execution error');
      } else {
        setConsoleError('Network connection error while calling code runner.');
      }
      setConsoleOutput('');
    } finally {
      setRunning(false);
    }
  };

  // Submit Answer Action
  const handleSubmitAnswer = async (source_code, language) => {
    setSubmitting(true);
    setConsoleError('');
    setConsoleStatus(null);
    setConsoleOutput('Evaluating submission against hidden test cases...');
    setSubmitResult(null);

    try {
      const res = await api.post('/team/submit', { source_code, language });
      const data = res.data;

      setConsoleOutput(data.stdout || '');
      setConsoleError(data.stderr || '');
      setConsoleStatus({ id: data.isCorrect ? 3 : 4, description: data.result || (data.isCorrect ? 'CORRECT' : 'WRONG ANSWER') });
      setExecutionTime(data.execution_time);

      setSubmitResult({
        isCorrect: data.isCorrect,
        status: data.result || (data.isCorrect ? 'CORRECT' : 'WRONG ANSWER'),
        passed: data.passed,
        total: data.total,
        message: data.message
      });

      if (data.isCorrect) {
        setTeam(prev => prev ? { ...prev, status: 'FINISHED', result: 'CORRECT', passed_tests: data.passed, total_tests: data.total } : null);
      } else {
        setTeam(prev => prev ? { ...prev, status: 'ACTIVE', result: data.result || 'WRONG ANSWER', passed_tests: data.passed, total_tests: data.total } : null);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setConsoleError(err.response.data.error || err.response.data.message || 'Submission error');
      } else {
        setConsoleError('Network error submitting answer.');
      }
      setConsoleOutput('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!team) return null;

  const isLocked = team.status !== 'ACTIVE';

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Disqualified Full Screen Overlay */}
      {team.status === 'DISQUALIFIED' && (
        <DisqualifiedOverlay timestamp={team.disqualification_at} />
      )}

      {/* Time Up Full Screen Overlay */}
      {team.status === 'TIME_UP' && (
        <TimeUpOverlay />
      )}

      {/* Header */}
      <Header onTimeUp={() => setTeam(prev => prev ? { ...prev, status: 'TIME_UP' } : null)} />

      {/* Temporary Tab Switch / Away Warning Banner */}
      {showAwayWarning && team.status === 'ACTIVE' && (
        <div style={{
          position: 'fixed',
          top: '75px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: '#ef4444',
          color: '#ffffff',
          padding: '10px 24px',
          borderRadius: '30px',
          fontWeight: 800,
          fontSize: '0.9rem',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={20} />
          <span>WARNING: Return to the competition tab immediately!</span>
        </div>
      )}

      {/* Main Competition View Split Screen */}
      <main style={{
        flexGrow: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 420px) 1fr',
        gap: '16px',
        padding: '16px',
        maxWidth: '1800px',
        width: '100%',
        margin: '0 auto',
        height: 'calc(100vh - 65px)'
      }}>
        {/* Left Pane: Question Details */}
        <div style={{ height: '100%', overflow: 'hidden' }}>
          <QuestionView question={team.question} />
        </div>

        {/* Right Pane: Code Editor + Program Output */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Success Banner if Finished */}
          {team.status === 'FINISHED' && (
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '12px 18px',
              color: '#34d399',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={24} />
              <div>
                <div>CHALLENGE COMPLETED SUCCESSFULLY!</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#a7f3d0' }}>
                  Your solution was accepted. Further editing has been disabled.
                </div>
              </div>
            </div>
          )}

          {/* Upper Editor */}
          <div style={{ flexGrow: 1, minHeight: '350px' }}>
            <CodeEditor
              onRun={handleRunCode}
              onSubmit={handleSubmitAnswer}
              disabled={isLocked}
              running={running}
              submitting={submitting}
            />
          </div>

          {/* Lower Console Output */}
          <div style={{ flexShrink: 0 }}>
            <ConsoleOutput
              output={consoleOutput}
              error={consoleError}
              status={consoleStatus}
              executionTime={executionTime}
              submitResult={submitResult}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParticipantDashboard;
