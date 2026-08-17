const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { authenticateHost } = require('../middleware/authMiddleware');
const config = require('../config/config');

// Require Host Admin authentication for all routes in this router
router.use(authenticateHost);

/**
 * GET /api/host/dashboard
 * Dashboard stats & complete team status overview
 */
router.get('/dashboard', (req, res) => {
  const durationSetting = db.prepare('SELECT value FROM event_settings WHERE key = ?').get('duration');
  const durationSeconds = parseInt(durationSetting ? durationSetting.value : config.DEFAULT_DURATION_SECONDS.toString(), 10);

  const teams = db.prepare(`
    SELECT
      t.id, t.name, t.status, t.started_at, t.finish_at, t.disqualification_at, t.result, t.passed_tests, t.total_tests,
      t.question_id, q.title as question_title
    FROM teams t
    LEFT JOIN questions q ON t.question_id = q.id
    ORDER BY t.id ASC
  `).all();

  // Compute stats and remaining time for each team
  let totalTeams = teams.length;
  let notStarted = 0;
  let active = 0;
  let finished = 0;
  let disqualified = 0;
  let timeUp = 0;

  const nowMs = Date.now();

  const formattedTeams = teams.map(team => {
    let remainingSeconds = 0;

    if (team.started_at && team.status === 'ACTIVE') {
      const startedAt = new Date(team.started_at).getTime();
      const elapsedSeconds = Math.floor((nowMs - startedAt) / 1000);
      remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      // Auto update if expired
      if (remainingSeconds <= 0) {
        db.prepare("UPDATE teams SET status = 'TIME_UP' WHERE id = ?").run(team.id);
        team.status = 'TIME_UP';
        remainingSeconds = 0;
      }
    }

    if (team.status === 'NOT_STARTED') notStarted++;
    else if (team.status === 'ACTIVE') active++;
    else if (team.status === 'FINISHED') finished++;
    else if (team.status === 'DISQUALIFIED') disqualified++;
    else if (team.status === 'TIME_UP') timeUp++;

    return {
      ...team,
      remainingSeconds
    };
  });

  return res.json({
    stats: {
      totalTeams,
      notStarted,
      active,
      finished,
      disqualified,
      timeUp
    },
    durationSeconds,
    teams: formattedTeams
  });
});

/**
 * GET /api/host/teams
 * Get all teams list
 */
router.get('/teams', (req, res) => {
  const teams = db.prepare(`
    SELECT t.id, t.name, t.question_id, t.status, t.started_at, t.finish_at, t.disqualification_at, t.result, q.title as question_title
    FROM teams t
    LEFT JOIN questions q ON t.question_id = q.id
    ORDER BY t.id ASC
  `).all();
  return res.json({ teams });
});

/**
 * POST /api/host/teams
 * Add new team
 */
router.post('/teams', (req, res) => {
  const { name, password, question_id } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Team name and password are required' });
  }

  const teamName = name.trim().toUpperCase();
  const existing = db.prepare('SELECT id FROM teams WHERE name = ?').get(teamName);
  if (existing) {
    return res.status(400).json({ error: 'Team name already exists' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO teams (name, password, question_id, status)
    VALUES (?, ?, ?, 'NOT_STARTED')
  `).run(teamName, passwordHash, question_id || null);

  db.prepare('INSERT INTO audit_logs (action, details, ip_address) VALUES (?, ?, ?)').run(
    'TEAM_CREATED',
    `Host created team ${teamName}`,
    req.ip
  );

  return res.json({ message: 'Team created successfully', teamId: result.lastInsertRowid });
});

/**
 * PUT /api/host/teams/:id
 * Edit existing team
 */
router.put('/teams/:id', (req, res) => {
  const teamId = req.params.id;
  const { name, password, question_id } = req.body;

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const newName = name ? name.trim().toUpperCase() : team.name;
  let newPasswordHash = team.password;
  if (password && password.trim() !== '') {
    newPasswordHash = bcrypt.hashSync(password, 10);
  }

  db.prepare(`
    UPDATE teams
    SET name = ?, password = ?, question_id = ?
    WHERE id = ?
  `).run(newName, newPasswordHash, question_id !== undefined ? question_id : team.question_id, teamId);

  db.prepare('INSERT INTO audit_logs (action, details, team_id, ip_address) VALUES (?, ?, ?, ?)').run(
    'TEAM_UPDATED',
    `Host updated team ${newName}`,
    teamId,
    req.ip
  );

  return res.json({ message: 'Team updated successfully' });
});

/**
 * DELETE /api/host/teams/:id
 * Delete team
 */
router.delete('/teams/:id', (req, res) => {
  const teamId = req.params.id;
  const team = db.prepare('SELECT name FROM teams WHERE id = ?').get(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
  db.prepare('INSERT INTO audit_logs (action, details, ip_address) VALUES (?, ?, ?)').run(
    'TEAM_DELETED',
    `Host deleted team ${team.name}`,
    req.ip
  );

  return res.json({ message: 'Team deleted successfully' });
});

/**
 * POST /api/host/reset-team/:id
 * Reset team session and status back to NOT_STARTED
 */
router.post('/reset-team/:id', (req, res) => {
  const teamId = req.params.id;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  // Reset team parameters
  db.prepare(`
    UPDATE teams
    SET status = 'NOT_STARTED', started_at = NULL, finish_at = NULL, disqualification_at = NULL, result = 'NONE', passed_tests = 0, total_tests = 0
    WHERE id = ?
  `).run(teamId);

  // Invalidate all sessions for this team
  db.prepare('DELETE FROM team_sessions WHERE team_id = ?').run(teamId);

  // Audit log
  db.prepare('INSERT INTO audit_logs (action, details, team_id, ip_address) VALUES (?, ?, ?, ?)').run(
    'TEAM_RESET',
    `Host reset team ${team.name} back to NOT_STARTED`,
    teamId,
    req.ip
  );

  return res.json({ message: `Team ${team.name} has been reset successfully.` });
});

/**
 * GET /api/host/questions
 * List all questions
 */
router.get('/questions', (req, res) => {
  const questions = db.prepare('SELECT * FROM questions ORDER BY id ASC').all();
  return res.json({ questions });
});

/**
 * POST /api/host/questions
 * Add new question
 */
router.post('/questions', (req, res) => {
  const { title, description, input, expected_output, allowed_languages } = req.body;

  if (!title || !description || expected_output === undefined) {
    return res.status(400).json({ error: 'Title, description, and expected_output are required' });
  }

  const result = db.prepare(`
    INSERT INTO questions (title, description, input, expected_output, allowed_languages)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    description.trim(),
    input || '',
    expected_output,
    allowed_languages || 'python,c,cpp,java,javascript'
  );

  db.prepare('INSERT INTO audit_logs (action, details, ip_address) VALUES (?, ?, ?)').run(
    'QUESTION_CREATED',
    `Host created question ${title}`,
    req.ip
  );

  return res.json({ message: 'Question created successfully', questionId: result.lastInsertRowid });
});

/**
 * PUT /api/host/questions/:id
 * Edit question
 */
router.put('/questions/:id', (req, res) => {
  const qId = req.params.id;
  const { title, description, input, expected_output, allowed_languages } = req.body;

  const q = db.prepare('SELECT id FROM questions WHERE id = ?').get(qId);
  if (!q) {
    return res.status(404).json({ error: 'Question not found' });
  }

  db.prepare(`
    UPDATE questions
    SET title = ?, description = ?, input = ?, expected_output = ?, allowed_languages = ?
    WHERE id = ?
  `).run(
    title,
    description,
    input || '',
    expected_output,
    allowed_languages || 'python,c,cpp,java,javascript',
    qId
  );

  db.prepare('INSERT INTO audit_logs (action, details, ip_address) VALUES (?, ?, ?)').run(
    'QUESTION_UPDATED',
    `Host updated question ${title}`,
    req.ip
  );

  return res.json({ message: 'Question updated successfully' });
});

/**
 * DELETE /api/host/questions/:id
 * Delete question (if unassigned)
 */
router.delete('/questions/:id', (req, res) => {
  const qId = req.params.id;

  const assignedTeam = db.prepare('SELECT name FROM teams WHERE question_id = ?').get(qId);
  if (assignedTeam) {
    return res.status(400).json({ error: `Cannot delete question: currently assigned to team ${assignedTeam.name}` });
  }

  db.prepare('DELETE FROM questions WHERE id = ?').run(qId);

  db.prepare('INSERT INTO audit_logs (action, details, ip_address) VALUES (?, ?, ?)').run(
    'QUESTION_DELETED',
    `Host deleted question ID ${qId}`,
    req.ip
  );

  return res.json({ message: 'Question deleted successfully' });
});

/**
 * POST /api/host/change-password
 * Change host admin password
 */
router.post('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND role = ?').get(req.user.username, 'admin');
  if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHash, user.id);

  db.prepare('INSERT INTO audit_logs (action, details, ip_address) VALUES (?, ?, ?)').run(
    'HOST_PASSWORD_CHANGED',
    'Host admin changed password',
    req.ip
  );

  return res.json({ message: 'Host password updated successfully' });
});

/**
 * GET /api/host/settings
 * Fetch competition settings
 */
router.get('/settings', (req, res) => {
  const settingsRows = db.prepare('SELECT key, value FROM event_settings').all();
  const settings = {};
  settingsRows.forEach(row => {
    settings[row.key] = row.value;
  });

  return res.json({ settings });
});

/**
 * POST /api/host/settings
 * Update competition settings
 */
router.post('/settings', (req, res) => {
  const { event_name, duration } = req.body;

  if (event_name) {
    db.prepare('INSERT OR REPLACE INTO event_settings (key, value) VALUES (?, ?)').run('event_name', event_name.trim());
  }

  if (duration) {
    const durSec = parseInt(duration, 10);
    if (isNaN(durSec) || durSec <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive integer in seconds' });
    }
    db.prepare('INSERT OR REPLACE INTO event_settings (key, value) VALUES (?, ?)').run('duration', durSec.toString());
  }

  db.prepare('INSERT INTO audit_logs (action, details, ip_address) VALUES (?, ?, ?)').run(
    'SETTINGS_UPDATED',
    'Host updated event settings',
    req.ip
  );

  return res.json({ message: 'Settings updated successfully' });
});

/**
 * GET /api/host/audit-logs
 * Fetch audit logs
 */
router.get('/audit-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100').all();
  return res.json({ logs });
});

module.exports = router;
