const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      input TEXT DEFAULT '',
      expected_output TEXT NOT NULL,
      allowed_languages TEXT DEFAULT 'python,c,cpp,java,javascript',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      question_id INTEGER,
      status TEXT DEFAULT 'NOT_STARTED', -- NOT_STARTED, ACTIVE, FINISHED, DISQUALIFIED, TIME_UP
      started_at DATETIME,
      finish_at DATETIME,
      disqualification_at DATETIME,
      result TEXT DEFAULT 'NONE', -- NONE, CORRECT, WRONG_ANSWER, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED
      passed_tests INTEGER DEFAULT 0,
      total_tests INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      input TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      is_hidden INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      started_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      status TEXT NOT NULL, -- CORRECT, WRONG_ANSWER, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED
      stdout TEXT DEFAULT '',
      stderr TEXT DEFAULT '',
      execution_time REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS event_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      team_id INTEGER,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try { db.exec('ALTER TABLE teams ADD COLUMN passed_tests INTEGER DEFAULT 0'); } catch (_) {}
  try { db.exec('ALTER TABLE teams ADD COLUMN total_tests INTEGER DEFAULT 0'); } catch (_) {}
}

module.exports = {
  db,
  initSchema
};
