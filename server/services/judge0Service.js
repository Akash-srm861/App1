const axios = require('axios');
const config = require('../config/config');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Language ID Mapping for Judge0 CE
const JUDGE0_LANGUAGE_IDS = {
  python: 71,    // Python 3.8.1
  c: 50,         // C (GCC 9.2.0)
  cpp: 54,       // C++ (GCC 9.2.0)
  java: 62,      // Java (OpenJDK 13.0.1)
  javascript: 63 // Node.js (12.14.0)
};

/**
 * Execute code via Judge0 CE API, with fallback runner if unconfigured/unreachable.
 */
async function executeCode({ source_code, language, stdin = '' }) {
  const languageId = JUDGE0_LANGUAGE_IDS[language.toLowerCase()];
  if (!languageId) {
    return {
      status: { id: 6, description: 'Compilation / Configuration Error' },
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      execution_time: 0
    };
  }

  // Attempt Judge0 API call if configured
  if (config.JUDGE0_API_URL && (config.JUDGE0_API_KEY || config.EXECUTION_PROVIDER === 'judge0_public')) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (config.JUDGE0_API_KEY) {
        headers['X-RapidAPI-Key'] = config.JUDGE0_API_KEY;
        headers['X-RapidAPI-Host'] = config.JUDGE0_HOST;
      }

      // Submit job (using wait=true for synchronous response)
      const response = await axios.post(
        `${config.JUDGE0_API_URL}/submissions?wait=true&fields=stdout,stderr,status,time,memory,compile_output`,
        {
          source_code: Buffer.from(source_code).toString('base64'),
          language_id: languageId,
          stdin: Buffer.from(stdin).toString('base64')
        },
        { headers, timeout: 15000 }
      );

      const data = response.data;
      const decode = (str) => (str ? Buffer.from(str, 'base64').toString('utf-8') : '');

      return {
        status: data.status || { id: 3, description: 'Accepted' },
        stdout: decode(data.stdout),
        stderr: decode(data.stderr) || decode(data.compile_output),
        execution_time: parseFloat(data.time || '0')
      };
    } catch (err) {
      console.warn('Judge0 API call failed or timed out. Falling back to local execution engine:', err.message);
    }
  }

  // Local fallback runner for offline / non-key testing
  return runLocalFallback(source_code, language, stdin);
}

/**
 * Fallback code runner using local system binaries or smart evaluator if compilers are missing.
 */
function runLocalFallback(source_code, language, stdin) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-the-output-'));
  const lang = language.toLowerCase();
  let filename = '';
  let command = '';
  let args = [];

  try {
    if (lang === 'python') {
      filename = path.join(tempDir, 'script.py');
      fs.writeFileSync(filename, source_code);

      let pyCmd = process.platform === 'win32' ? 'python' : 'python3';
      const checkPy = spawnSync(pyCmd, ['--version']);
      if (checkPy.error && process.platform === 'win32') {
        const checkPy2 = spawnSync('py', ['--version']);
        if (!checkPy2.error) pyCmd = 'py';
      }
      command = pyCmd;
      args = ['-u', filename];
    } else if (lang === 'javascript') {
      filename = path.join(tempDir, 'script.js');
      fs.writeFileSync(filename, source_code);
      command = process.execPath;
      args = [filename];
    } else if (lang === 'c') {
      const srcFile = path.join(tempDir, 'code.c');
      const exeFile = path.join(tempDir, process.platform === 'win32' ? 'code.exe' : 'code');
      fs.writeFileSync(srcFile, source_code);

      const compile = spawnSync('gcc', [srcFile, '-o', exeFile], { encoding: 'utf-8' });
      if (compile.error || compile.status !== 0) {
        return {
          status: { id: 6, description: 'Compilation Error' },
          stdout: '',
          stderr: compile.stderr || compile.error?.message || 'GCC Compiler not available or compilation error.',
          execution_time: 0
        };
      }
      command = exeFile;
      args = [];
    } else if (lang === 'cpp') {
      const srcFile = path.join(tempDir, 'code.cpp');
      const exeFile = path.join(tempDir, process.platform === 'win32' ? 'code.exe' : 'code');
      fs.writeFileSync(srcFile, source_code);

      const compile = spawnSync('g++', [srcFile, '-o', exeFile], { encoding: 'utf-8' });
      if (compile.error || compile.status !== 0) {
        return {
          status: { id: 6, description: 'Compilation Error' },
          stdout: '',
          stderr: compile.stderr || compile.error?.message || 'G++ Compiler not available or compilation error.',
          execution_time: 0
        };
      }
      command = exeFile;
      args = [];
    } else if (lang === 'java') {
      const classMatch = source_code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const srcFile = path.join(tempDir, `${className}.java`);
      fs.writeFileSync(srcFile, source_code);

      const compile = spawnSync('javac', [srcFile], { encoding: 'utf-8' });
      if (compile.error || compile.status !== 0) {
        return {
          status: { id: 6, description: 'Compilation Error' },
          stdout: '',
          stderr: compile.stderr || compile.error?.message || 'Java Compiler not available or compilation error.',
          execution_time: 0
        };
      }
      command = 'java';
      args = ['-cp', tempDir, className];
    } else {
      return {
        status: { id: 6, description: 'Compilation Error' },
        stdout: '',
        stderr: `Unsupported language: ${language}`,
        execution_time: 0
      };
    }

    const inputFormatted = stdin !== undefined && stdin !== null ? (stdin.endsWith('\n') ? stdin : stdin + '\n') : '';
    const startTime = Date.now();
    const spawnEnv = { ...process.env };
    if (lang === 'javascript') {
      spawnEnv.ELECTRON_RUN_AS_NODE = '1';
    }

    const result = spawnSync(command, args, {
      input: inputFormatted,
      timeout: 5000,
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024,
      env: spawnEnv
    });

    const duration = (Date.now() - startTime) / 1000;

    if (result.error && result.error.code === 'ETIMEDOUT') {
      return {
        status: { id: 5, description: 'Time Limit Exceeded' },
        stdout: result.stdout || '',
        stderr: 'Execution timed out (5s limit)',
        execution_time: 5.0
      };
    }

    if (result.error) {
      return {
        status: { id: 11, description: 'Runtime Error' },
        stdout: result.stdout || '',
        stderr: result.error.message,
        execution_time: duration
      };
    }

    if (result.status !== 0) {
      const errText = result.stderr || '';
      const isCompileErr = errText.includes('SyntaxError') || errText.includes('IndentationError');
      return {
        status: {
          id: isCompileErr ? 6 : 11,
          description: isCompileErr ? 'Compilation Error' : 'Runtime Error'
        },
        stdout: result.stdout || '',
        stderr: errText,
        execution_time: duration
      };
    }

    return {
      status: { id: 3, description: 'Accepted' },
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      execution_time: duration
    };
  } catch (e) {
    return {
      status: { id: 11, description: 'Runtime Error' },
      stdout: '',
      stderr: e.message,
      execution_time: 0
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

module.exports = {
  executeCode,
  JUDGE0_LANGUAGE_IDS
};
