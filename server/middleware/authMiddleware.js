const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { db } = require('../db/database');

/**
 * Middleware to authenticate Host Admin
 */
function authenticateHost(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware to authenticate Participant Team
 */
function authenticateTeam(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.role !== 'team') {
      return res.status(403).json({ error: 'Access denied: Team privileges required' });
    }

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(decoded.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if team session is active
    const session = db.prepare('SELECT * FROM team_sessions WHERE team_id = ? AND token = ? AND is_active = 1').get(team.id, token);
    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalidated by host' });
    }

    // Calculate server-authoritative remaining time
    const durationSetting = db.prepare('SELECT value FROM event_settings WHERE key = ?').get('duration');
    const durationSeconds = parseInt(durationSetting ? durationSetting.value : config.DEFAULT_DURATION_SECONDS.toString(), 10);

    let remainingSeconds = durationSeconds;
    if (team.started_at) {
      const startedAt = new Date(team.started_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      // Auto mark TIME_UP if expired while active
      if (remainingSeconds <= 0 && team.status === 'ACTIVE') {
        db.prepare("UPDATE teams SET status = 'TIME_UP' WHERE id = ?").run(team.id);
        team.status = 'TIME_UP';
      }
    }

    req.team = team;
    req.session = session;
    req.remainingSeconds = remainingSeconds;
    req.durationSeconds = durationSeconds;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

/**
 * Middleware ensuring team is currently ACTIVE and has time remaining
 */
function checkActiveCompetition(req, res, next) {
  const team = req.team;

  if (team.status === 'DISQUALIFIED') {
    return res.status(403).json({
      error: 'DISQUALIFIED',
      message: 'Leaving the competition page is not allowed.'
    });
  }

  if (team.status === 'TIME_UP' || req.remainingSeconds <= 0) {
    return res.status(403).json({
      error: 'TIME_UP',
      message: 'Competition time has expired.'
    });
  }

  if (team.status === 'FINISHED') {
    return res.status(403).json({
      error: 'FINISHED',
      message: 'You have already submitted your final answer.'
    });
  }

  if (team.status !== 'ACTIVE') {
    return res.status(403).json({
      error: 'NOT_ACTIVE',
      message: 'Competition session is not active.'
    });
  }

  next();
}

module.exports = {
  authenticateHost,
  authenticateTeam,
  checkActiveCompetition
};
