require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data.sqlite');

// ---------------------- Database ----------------------
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`PRAGMA journal_mode = WAL;`);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    picture TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );`);
  db.run(`CREATE TABLE IF NOT EXISTS states (
    user_id TEXT PRIMARY KEY,
    state_json TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);
});

// ---------------------- Passport ----------------------
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
    if (err) return done(err);
    done(null, row || false);
  });
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const OAUTH_ENABLED = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
if (OAUTH_ENABLED) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${BASE_URL}/auth/google/callback`
  }, (accessToken, refreshToken, profile, done) => {
    const id = profile.id;
    const email = profile.emails && profile.emails[0] && profile.emails[0].value || null;
    const name = profile.displayName || null;
    const picture = profile.photos && profile.photos[0] && profile.photos[0].value || null;

    db.run(
      `INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET email=excluded.email, name=excluded.name, picture=excluded.picture`,
      [id, email, name, picture],
      (err) => {
        if (err) return done(err);
        db.get('SELECT * FROM users WHERE id = ?', [id], (err2, row) => {
          if (err2) return done(err2);
          done(null, row);
        });
      }
    );
  }));
} else {
  console.warn('Google OAuth is disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
}

// ---------------------- Middleware ----------------------
app.use(express.json({ limit: '1mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: __dirname }),
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: !!process.env.COOKIE_SECURE
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// ---------------------- Auth routes ----------------------
if (OAUTH_ENABLED) {
  app.get('/auth/google', (req, res, next) => {
    const prompt = process.env.GOOGLE_OAUTH_PROMPT || 'select_account';
    passport.authenticate('google', { scope: ['profile', 'email'], prompt })(req, res, next);
  });

  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/?auth=failed' }), (req, res) => {
    res.redirect('/');
  });
} else {
  app.get('/auth/google', (_req, res) => res.status(501).send('Google OAuth not configured'));
  app.get('/auth/google/callback', (_req, res) => res.status(501).send('Google OAuth not configured'));
}

app.post('/auth/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  });
});

app.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ user: null });
  const { id, email, name, picture } = req.user;
  res.json({ user: { id, email, name, picture } });
});

// ---------------------- State sync API ----------------------
function requireAuth(req, res, next){
  if(!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/api/state', requireAuth, (req, res) => {
  db.get('SELECT state_json FROM states WHERE user_id = ?', [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    const state = row ? JSON.parse(row.state_json) : null;
    res.json({ state: state || null });
  });
});

app.post('/api/state', requireAuth, (req, res) => {
  const state = req.body && req.body.state;
  if (!state || typeof state !== 'object') return res.status(400).json({ error: 'invalid_state' });
  const json = JSON.stringify(state);
  db.run(
    `INSERT INTO states (user_id, state_json, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json, updated_at=excluded.updated_at`,
    [req.user.id, json],
    (err) => {
      if (err) return res.status(500).json({ error: 'db_error' });
      res.json({ ok: true });
    }
  );
});

// ---------------------- Static frontend ----------------------
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
