import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Loader2, Code2 } from 'lucide-react';

const STARTER_TEMPLATES = {
  python: `# Python 3
import sys

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Write your solution here
    
if __name__ == '__main__':
    main()
`,
  c: `/* C (GCC) */
#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`,
  cpp: `// C++ (GCC)
#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Write your solution here
    
    return 0;
}
`,
  java: `// Java
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
        
        scanner.close();
    }
}
`,
  javascript: `// JavaScript (Node.js)
const fs = require('fs');

function main() {
    const input = fs.readFileSync('/dev/stdin', 'utf-8');
    // Write your solution here
}

main();
`
};

const MONACO_LANGUAGES = {
  python: 'python',
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript'
};

const CodeEditor = ({ onRun, onSubmit, disabled, running, submitting }) => {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(STARTER_TEMPLATES.python);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(STARTER_TEMPLATES[newLang] || '');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      overflow: 'hidden'
    }}>
      {/* Top Bar / Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Code2 size={18} color="var(--accent-red)" />
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Language:
          </label>
          <select
            value={language}
            onChange={handleLanguageChange}
            disabled={disabled || running || submitting}
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="python">Python 3</option>
            <option value="c">C (GCC)</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript (Node.js)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => onRun(code, language)}
            disabled={disabled || running || submitting}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            {running ? <Loader2 size={16} className="spin" /> : <Play size={16} color="#3b82f6" />}
            <span>RUN CODE</span>
          </button>

          <button
            onClick={() => onSubmit(code, language)}
            disabled={disabled || running || submitting}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            {submitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            <span>SUBMIT ANSWER</span>
          </button>
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div style={{ flexGrow: 1, minHeight: '320px', position: 'relative' }}>
        <Editor
          height="100%"
          language={MONACO_LANGUAGES[language]}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            readOnly: disabled,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'Fira Code', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            smoothScrolling: true
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
