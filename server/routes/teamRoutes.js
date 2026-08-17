const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { db } = require('../db/database');
const { authenticateTeam, checkActiveCompetition } = require('../middleware/authMiddleware');
const { executeCode } = require('../services/judge0Service');
const { compareOutput } = require('../services/normalizationService');

// Rate limiting for code execution
const codeRunLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 runs per minute
  message: { error: 'Execution rate limit exceeded. Please wait a few seconds before running again.' }
});

/**
 * GET /api/team/me
 * Fetch current active session info for participant
 */
router.get('/me', authenticateTeam, (req, res) => {
  const team = req.team;

  // Fetch assigned question ONLY
  const question = team.question_id
    ? db.prepare('SELECT id, title, description, input, expected_output, allowed_languages FROM questions WHERE id = ?').get(team.question_id)
    : null;

  return res.json({
    team: {
      id: team.id,
      name: team.name,
      status: team.status,
      started_at: team.started_at,
      finish_at: team.finish_at,
      disqualification_at: team.disqualification_at,
      result: team.result,
      passed_tests: team.passed_tests || 0,
      total_tests: team.total_tests || 0,
      question,
      durationSeconds: req.durationSeconds,
      remainingSeconds: req.remainingSeconds
    }
  });
});

/**
 * POST /api/team/disqualify
 * Trigger disqualification on page switch / tab change / window blur
 */
router.post('/disqualify', authenticateTeam, (req, res) => {
  const team = req.team;

  // Only disqualify if team was ACTIVE
  if (team.status === 'ACTIVE') {
    const now = new Date().toISOString();
    db.prepare("UPDATE teams SET status = 'DISQUALIFIED', disqualification_at = ? WHERE id = ?").run(now, team.id);

    // Invalidate sessions
    db.prepare('UPDATE team_sessions SET is_active = 0 WHERE team_id = ?').run(team.id);

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, details, team_id, ip_address) VALUES (?, ?, ?, ?)').run(
      'TEAM_DISQUALIFIED',
      `Team ${team.name} disqualified for leaving competition page`,
      team.id,
      req.ip
    );
  }

  return res.json({
    status: 'DISQUALIFIED',
    message: 'DISQUALIFIED: Leaving the competition page is not allowed.'
  });
});

/**
 * POST /api/team/run-code
 * Execute participant code without submitting
 */
router.post('/run-code', authenticateTeam, checkActiveCompetition, codeRunLimiter, async (req, res) => {
  const { source_code, language } = req.body;
  const team = req.team;

  if (!source_code || !language) {
    return res.status(400).json({ error: 'source_code and language are required' });
  }

  if (source_code.length > 50000) {
    return res.status(400).json({ error: 'Source code size limit exceeded (max 50KB).' });
  }

  // Get assigned question's input and expected output
  const question = team.question_id
    ? db.prepare('SELECT input, expected_output FROM questions WHERE id = ?').get(team.question_id)
    : null;

  const stdin = question ? question.input : '';

  try {
    const execResult = await executeCode({
      source_code,
      language,
      stdin
    });

    let status = execResult.status;
    const statusDesc = (status?.description || '').toUpperCase();
    const isError = statusDesc.includes('COMPILATION') || statusDesc.includes('RUNTIME') || statusDesc.includes('TIME LIMIT') || status?.id === 6 || status?.id === 11 || status?.id === 5;

    let isMatch = false;
    if (!isError && question && question.expected_output !== undefined) {
      isMatch = compareOutput(execResult.stdout, question.expected_output);
      if (isMatch) {
        status = { id: 3, description: 'CORRECT (Sample Match)', isCorrect: true };
      } else {
        status = { id: 4, description: 'WRONG ANSWER (Sample Mismatch)', isCorrect: false };
      }
    }

    return res.json({
      stdout: execResult.stdout || '',
      stderr: execResult.stderr || '',
      execution_time: execResult.execution_time,
      status: status,
      isMatch
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Code execution error',
      details: err.message
    });
  }
});

/**
 * POST /api/team/submit
 * Submit participant answer for evaluation against ALL hidden test cases
 */
router.post('/submit', authenticateTeam, checkActiveCompetition, async (req, res) => {
  const { source_code, language } = req.body;
  const team = req.team;

  if (!source_code || !language) {
    return res.status(400).json({ error: 'source_code and language are required' });
  }

  if (!team.question_id) {
    return res.status(400).json({ error: 'No question assigned to this team.' });
  }

  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(team.question_id);
  if (!question) {
    return res.status(404).json({ error: 'Assigned question not found.' });
  }

  try {
    let testCases = db.prepare('SELECT input, expected_output FROM test_cases WHERE question_id = ? ORDER BY id ASC').all(question.id);
    if (!testCases || testCases.length === 0) {
      testCases = [{ input: question.input || '', expected_output: question.expected_output }];
    }

    let passedCount = 0;
    const totalCount = testCases.length;
    let finalStatus = 'CORRECT';
    let lastStdout = '';
    let lastStderr = '';
    let totalExecTime = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const execResult = await executeCode({
        source_code,
        language,
        stdin: tc.input
      });

      totalExecTime += execResult.execution_time || 0;
      lastStdout = execResult.stdout || '';
      lastStderr = execResult.stderr || '';

      const statusDesc = (execResult.status?.description || '').toUpperCase();

      if (statusDesc.includes('COMPILATION') || execResult.status?.id === 6) {
        finalStatus = 'COMPILATION ERROR';
        break;
      }
      if (statusDesc.includes('TIME LIMIT') || execResult.status?.id === 5) {
        finalStatus = 'TIME LIMIT EXCEEDED';
        break;
      }
      if (statusDesc.includes('RUNTIME') || execResult.status?.id === 11) {
        finalStatus = 'RUNTIME ERROR';
        break;
      }

      const isMatch = compareOutput(execResult.stdout, tc.expected_output);
      if (isMatch) {
        passedCount++;
      } else {
        if (finalStatus === 'CORRECT') {
          finalStatus = 'WRONG ANSWER';
        }
      }
    }

    totalExecTime = Math.round(totalExecTime * 100) / 100;
    const now = new Date().toISOString();

    if (finalStatus === 'CORRECT' && passedCount === totalCount) {
      // Mark team FINISHED with CORRECT result
      db.prepare(`
        UPDATE teams
        SET status = 'FINISHED', result = 'CORRECT', finish_at = ?, passed_tests = ?, total_tests = ?
        WHERE id = ?
      `).run(now, passedCount, totalCount, team.id);

      db.prepare(`
        INSERT INTO submissions (team_id, question_id, language, code, status, stdout, stderr, execution_time)
        VALUES (?, ?, ?, ?, 'CORRECT', ?, ?, ?)
      `).run(team.id, question.id, language, source_code, lastStdout, lastStderr, totalExecTime);

      db.prepare('INSERT INTO audit_logs (action, details, team_id, ip_address) VALUES (?, ?, ?, ?)').run(
        'SUBMISSION_CORRECT',
        `Team ${team.name} submitted CORRECT solution (${passedCount}/${totalCount} tests passed)`,
        team.id,
        req.ip
      );

      return res.json({
        isCorrect: true,
        status: 'FINISHED',
        result: 'CORRECT',
        passed: passedCount,
        total: totalCount,
        message: `CORRECT (${passedCount}/${totalCount} test cases passed)`,
        stdout: lastStdout,
        stderr: lastStderr,
        execution_time: totalExecTime
      });
    } else {
      // Keep team ACTIVE, update result
      db.prepare(`
        UPDATE teams
        SET result = ?, passed_tests = ?, total_tests = ?
        WHERE id = ?
      `).run(finalStatus, passedCount, totalCount, team.id);

      db.prepare(`
        INSERT INTO submissions (team_id, question_id, language, code, status, stdout, stderr, execution_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(team.id, question.id, language, source_code, finalStatus, lastStdout, lastStderr, totalExecTime);

      db.prepare('INSERT INTO audit_logs (action, details, team_id, ip_address) VALUES (?, ?, ?, ?)').run(
        'SUBMISSION_FAILED',
        `Team ${team.name} submission result: ${finalStatus} (${passedCount}/${totalCount} tests passed)`,
        team.id,
        req.ip
      );

      return res.json({
        isCorrect: false,
        status: 'ACTIVE',
        result: finalStatus,
        passed: passedCount,
        total: totalCount,
        message: `${finalStatus} (${passedCount}/${totalCount} test cases passed)`,
        stdout: lastStdout,
        stderr: lastStderr,
        execution_time: totalExecTime
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: 'Submission processing error',
      details: err.message
    });
  }
});

module.exports = router;
