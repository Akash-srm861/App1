const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const { db } = require('../db/database');

// Rate limiting for login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // 30 requests per IP per 15 mins
  message: { error: 'Too many login attempts, please try again later.' }
});

/**
 * POST /api/auth/host-login
 * Host Admin login
 */
router.post('/host-login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND role = ?').get(username, 'admin');
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid host credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: 'admin' },
    config.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Audit log
  db.prepare('INSERT INTO audit_logs (action, details, ip_address) VALUES (?, ?, ?)').run(
    'HOST_LOGIN',
    `Host admin ${username} logged in`,
    req.ip
  );

  return res.json({
    message: 'Host login successful',
    token,
    user: { id: user.id, username: user.username, role: 'admin' }
  });
});

/**
 * POST /api/auth/team-login
 * Participant Team login - Strictly single-use login!
 */
router.post('/team-login', loginLimiter, (req, res) => {
  const { teamName, password } = req.body;

  if (!teamName || !password) {
    return res.status(400).json({ error: 'Team name and password are required' });
  }

  const team = db.prepare('SELECT * FROM teams WHERE name = ?').get(teamName.trim().toUpperCase());
  if (!team || !bcrypt.compareSync(password, team.password)) {
    return res.status(401).json({ error: 'Invalid team credentials' });
  }

  // Strictly enforce SINGLE-USE LOGIN RULE!
  // If team is already started, active, finished, disqualified, or time up:
  if (team.status !== 'NOT_STARTED' || team.started_at) {
    return res.status(403).json({
      error: 'ACCESS_ALREADY_USED',
      message: 'ACCESS ALREADY USED. CONTACT THE HOST.'
    });
  }

  // Also check if any active session exists for this team
  const existingSession = db.prepare('SELECT * FROM team_sessions WHERE team_id = ? AND is_active = 1').get(team.id);
  if (existingSession) {
    return res.status(403).json({
      error: 'ACCESS_ALREADY_USED',
      message: 'ACCESS ALREADY USED. CONTACT THE HOST.'
    });
  }

  // Get duration setting
  const durationSetting = db.prepare('SELECT value FROM event_settings WHERE key = ?').get('duration');
  const durationSeconds = parseInt(durationSetting ? durationSetting.value : config.DEFAULT_DURATION_SECONDS.toString(), 10);

  const now = new Date().toISOString();

  // Create session token
  const token = jwt.sign(
    { teamId: team.id, teamName: team.name, role: 'team' },
    config.JWT_SECRET,
    { expiresIn: '12h' }
  );

  // Update team to ACTIVE and record started_at timestamp
  db.prepare("UPDATE teams SET status = 'ACTIVE', started_at = ? WHERE id = ?").run(now, team.id);

  // Create team session entry
  const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();
  db.prepare(`
    INSERT INTO team_sessions (team_id, token, started_at, expires_at, ip_address, user_agent, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(team.id, token, now, expiresAt, req.ip, req.headers['user-agent'] || '');

  // Audit log
  db.prepare('INSERT INTO audit_logs (action, details, team_id, ip_address) VALUES (?, ?, ?, ?)').run(
    'TEAM_LOGIN_STARTED',
    `Team ${team.name} logged in for the first time and started competition`,
    team.id,
    req.ip
  );

  // Fetch team's assigned question ONLY
  const assignedQuestion = team.question_id
    ? db.prepare('SELECT id, title, description, input, expected_output, allowed_languages FROM questions WHERE id = ?').get(team.question_id)
    : null;

  return res.json({
    message: 'Team login successful. Competition started.',
    token,
    team: {
      id: team.id,
      name: team.name,
      status: 'ACTIVE',
      started_at: now,
      question: assignedQuestion,
      durationSeconds,
      remainingSeconds: durationSeconds
    }
  });
});

module.exports = router;
