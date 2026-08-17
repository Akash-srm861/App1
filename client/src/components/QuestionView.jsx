import React from 'react';
import { FileCode, Terminal, CheckCircle2, Code } from 'lucide-react';

const QuestionView = ({ question }) => {
  if (!question) {
    return (
      <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <p>No question assigned. Please contact the host.</p>
      </div>
    );
  }

  const allowedLangs = question.allowed_languages
    ? question.allowed_languages.split(',').map(l => l.trim().toUpperCase())
    : ['PYTHON', 'C', 'CPP', 'JAVA', 'JAVASCRIPT'];

  return (
    <div className="card" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            backgroundColor: 'rgba(255, 42, 75, 0.15)',
            color: 'var(--accent-red)',
            fontSize: '0.75rem',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            Q{question.id < 10 ? `0${question.id}` : question.id}
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {question.title}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          {allowedLangs.map(lang => (
            <span key={lang} style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--bg-panel)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              padding: '2px 6px',
              borderRadius: '4px'
            }}>
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={{ flexGrow: 1 }}>
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <FileCode size={16} color="var(--accent-red)" />
          <span>Description</span>
        </h3>
        <div style={{
          fontSize: '0.95rem',
          lineHeight: 1.6,
          color: 'var(--text-main)',
          whiteSpace: 'pre-wrap'
        }}>
          {question.description}
        </div>
      </div>

      {/* Input */}
      <div>
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Terminal size={16} color="#3b82f6" />
          <span>Input (stdin)</span>
        </h3>
        <pre style={{
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          padding: '10px 14px',
          borderRadius: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          color: '#60a5fa',
          whiteSpace: 'pre-wrap',
          margin: 0
        }}>
          {question.input || '(No stdin input required)'}
        </pre>
      </div>

      {/* Expected Output */}
      <div>
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span>Expected Output</span>
        </h3>
        <pre style={{
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          padding: '10px 14px',
          borderRadius: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.9rem',
          color: '#34d399',
          whiteSpace: 'pre-wrap',
          margin: 0
        }}>
          {question.expected_output}
        </pre>
      </div>
    </div>
  );
};

export default QuestionView;
