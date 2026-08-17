import React from 'react';
import { Terminal, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const ConsoleOutput = ({ output, error, status, executionTime, submitResult }) => {
  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      backgroundColor: '#0a0a0e',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '14px 18px'
    }}>
      {/* Console Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e2230',
        paddingBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} color="var(--accent-red)" />
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '1px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>
            PROGRAM OUTPUT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {executionTime !== null && executionTime !== undefined && (
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Clock size={12} />
              {executionTime}s
            </span>
          )}

          {status && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: (status.isCorrect || status.description?.includes('CORRECT') || status.description?.includes('MATCH'))
                ? '#34d399'
                : (status.description?.includes('COMPILATION') || status.description?.includes('TIME LIMIT'))
                ? '#fbbf24'
                : '#f87171'
            }}>
              STATUS: {
                status.description === 'Accepted'
                  ? (status.isCorrect ? 'CORRECT (Sample Match)' : 'WRONG ANSWER (Sample Mismatch)')
                  : (status.description || (status.isCorrect ? 'CORRECT' : 'WRONG ANSWER'))
              }
            </span>
          )}
        </div>
      </div>

      {/* Submission Feedback Banner if present */}
      {submitResult && (
        <div style={{
          backgroundColor: submitResult.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${submitResult.isCorrect ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
          padding: '10px 14px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: submitResult.isCorrect ? '#34d399' : '#f87171',
          fontWeight: 700,
          fontSize: '0.9rem'
        }}>
          {submitResult.isCorrect ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <div>
            <div>{submitResult.status || (submitResult.isCorrect ? 'CORRECT' : 'WRONG ANSWER')}</div>
            {submitResult.passed !== undefined && submitResult.total !== undefined && (
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: submitResult.isCorrect ? '#a7f3d0' : '#fca5a5' }}>
                Passed {submitResult.passed} of {submitResult.total} hidden test cases
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stdout Output Area */}
      <pre style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.9rem',
        color: error ? '#f87171' : '#f1f3f9',
        backgroundColor: 'transparent',
        margin: 0,
        whiteSpace: 'pre-wrap',
        minHeight: '80px',
        maxHeight: '180px',
        overflowY: 'auto'
      }}>
        {error ? error : (output !== null && output !== undefined && output !== '' ? output : '(No output returned)')}
      </pre>
    </div>
  );
};

export default ConsoleOutput;
