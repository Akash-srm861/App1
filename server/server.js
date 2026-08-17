const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/config');
const { db } = require('./db/database');
const { seedDatabase } = require('./db/seed');

const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const hostRoutes = require('./routes/hostRoutes');

const app = express();

// Enable Security Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disabled for Monaco editor script compatibility if needed
}));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Seed DB on start
seedDatabase();

// Background timer checker (every 5s)
setInterval(() => {
  try {
    const durationSetting = db.prepare('SELECT value FROM event_settings WHERE key = ?').get('duration');
    const durationSeconds = parseInt(durationSetting ? durationSetting.value : config.DEFAULT_DURATION_SECONDS.toString(), 10);

    const activeTeams = db.prepare("SELECT id, started_at FROM teams WHERE status = 'ACTIVE' AND started_at IS NOT NULL").all();
    const now = Date.now();

    for (const team of activeTeams) {
      const startedAt = new Date(team.started_at).getTime();
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      if (elapsedSeconds >= durationSeconds) {
        db.prepare("UPDATE teams SET status = 'TIME_UP' WHERE id = ?").run(team.id);
        db.prepare('UPDATE team_sessions SET is_active = 0 WHERE team_id = ?').run(team.id);
        db.prepare('INSERT INTO audit_logs (action, details, team_id) VALUES (?, ?, ?)').run(
          'TIMER_EXPIRED',
          `Team ID ${team.id} time expired (TIME_UP)`,
          team.id
        );
      }
    }
  } catch (err) {
    console.error('Timer background check error:', err.message);
  }
}, 5000);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/host', hostRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', appName: 'CODE THE OUTPUT', timestamp: new Date().toISOString() });
});

// Serve frontend static build if available
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    return res.sendFile(indexPath);
  } else {
    return res.status(404).send('API Server is running. Client build not found.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const os = require('os');

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const HOST = process.env.HOST || '0.0.0.0';

app.listen(config.PORT, HOST, () => {
  const localIps = getLocalIpAddresses();
  console.log(`==================================================`);
  console.log(`CODE THE OUTPUT - College Coding Competition Server`);
  console.log(`Local Access:   http://localhost:${config.PORT}`);
  localIps.forEach(ip => {
    console.log(`Network Access: http://${ip}:${config.PORT}`);
  });
  console.log(`Application is live and accessible on ALL devices on the network!`);
  console.log(`==================================================`);
});
