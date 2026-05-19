require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const fs   = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'users.json');
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];

/* ── 데이터 파일 헬퍼 ── */
function ensureDataDir() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}', 'utf8');
}

function readDb() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return {}; }
}

function writeDb(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function getUser(googleId) {
  const db = readDb();
  return db[googleId] || { mood: {}, food: {}, diary: {}, exercise: {} };
}

function saveUser(googleId, userData) {
  const db = readDb();
  // 기존 데이터에 새 필드 병합
  if (!userData.diary)    userData.diary    = {};
  if (!userData.exercise) userData.exercise = {};
  db[googleId] = userData;
  writeDb(db);
}

/* ── 날짜 유효성 ── */
function validDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); }

/* ── Passport ── */
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  const user = {
    id:    profile.id,
    name:  profile.displayName,
    photo: profile.photos?.[0]?.value || '',
  };
  const data = getUser(user.id);
  saveUser(user.id, data);
  done(null, user);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

/* ── 미들웨어 ── */
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'my-diary-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

function requireLogin(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'login required' });
}

/* ── Auth ── */
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
app.get('/auth/google/callback', passport.authenticate('google', {
  successRedirect: '/', failureRedirect: '/?error=auth',
}));
app.get('/auth/logout', (req, res) => {
  req.logout(err => { req.session.destroy(() => res.redirect('/')); });
});

/* ── API: 유저 정보 ── */
app.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'not logged in' });
  res.json({ name: req.user.name, photo: req.user.photo });
});

/* ── API: 날짜별 전체 데이터 조회 ── */
app.get('/api/data/:date', requireLogin, (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  res.json({
    mood:     data.mood[date]     || null,
    food:     data.food[date]     || null,
    diary:    data.diary[date]    || null,
    exercise: data.exercise[date] || null,
  });
});

/* ── API: 캘린더용 월별 감정 ── */
app.get('/api/calendar/:year/:month', (req, res) => {
  if (!req.isAuthenticated()) return res.json({});
  const { year, month } = req.params;
  const prefix = `${year}-${month.padStart(2, '0')}`;
  const data = getUser(req.user.id);
  const result = {};
  Object.entries(data.mood).forEach(([date, entry]) => {
    if (date.startsWith(prefix)) result[date] = { emoji: entry.emoji, emotion: entry.emotion };
  });
  res.json(result);
});

/* ── API: 감정 저장/삭제 ── */
app.post('/api/mood', requireLogin, (req, res) => {
  const { date, emotion, emoji, label, intensity } = req.body;
  if (!validDate(date) || !emotion || !emoji || !label) return res.status(400).json({ error: 'invalid' });
  const intVal = parseInt(intensity, 10);
  if (isNaN(intVal) || intVal < 1 || intVal > 10) return res.status(400).json({ error: 'invalid intensity' });
  const data = getUser(req.user.id);
  data.mood[date] = { emotion, emoji, label, intensity: intVal, savedAt: new Date().toISOString() };
  saveUser(req.user.id, data);
  res.json({ ok: true });
});

app.delete('/api/mood/:date', requireLogin, (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  delete data.mood[date];
  saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── API: 일기 저장/삭제 ── */
app.post('/api/diary', requireLogin, (req, res) => {
  const { date, text } = req.body;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  data.diary[date] = { text: text || '', savedAt: new Date().toISOString() };
  saveUser(req.user.id, data);
  res.json({ ok: true });
});

app.delete('/api/diary/:date', requireLogin, (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  delete data.diary[date];
  saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── API: 운동 저장/삭제 ── */
app.post('/api/exercise', requireLogin, (req, res) => {
  const { date, program, calories, maxHR, avgHR } = req.body;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  data.exercise[date] = {
    program:  program  || '',
    calories: parseInt(calories, 10) || 0,
    maxHR:    parseInt(maxHR,    10) || 0,
    avgHR:    parseInt(avgHR,    10) || 0,
    savedAt:  new Date().toISOString(),
  };
  saveUser(req.user.id, data);
  res.json({ ok: true });
});

app.delete('/api/exercise/:date', requireLogin, (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  delete data.exercise[date];
  saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── API: 음식 추가/삭제 ── */
app.post('/api/food', requireLogin, (req, res) => {
  const { date, meal, name, kcal } = req.body;
  if (!validDate(date) || !MEALS.includes(meal) || !name?.trim()) return res.status(400).json({ error: 'invalid' });
  const kcalVal = parseInt(kcal, 10);
  if (isNaN(kcalVal) || kcalVal < 0) return res.status(400).json({ error: 'invalid kcal' });
  const data = getUser(req.user.id);
  if (!data.food[date]) data.food[date] = { breakfast: [], lunch: [], dinner: [], snack: [] };
  data.food[date][meal].push({ name: name.trim(), kcal: kcalVal });
  saveUser(req.user.id, data);
  res.json({ ok: true, idx: data.food[date][meal].length - 1 });
});

app.delete('/api/food/:date/:meal/:idx', requireLogin, (req, res) => {
  const { date, meal, idx } = req.params;
  if (!validDate(date) || !MEALS.includes(meal)) return res.status(400).json({ error: 'invalid' });
  const idxVal = parseInt(idx, 10);
  if (isNaN(idxVal) || idxVal < 0) return res.status(400).json({ error: 'invalid idx' });
  const data = getUser(req.user.id);
  if (!data.food[date]?.[meal]) return res.status(404).json({ error: 'not found' });
  data.food[date][meal].splice(idxVal, 1);
  saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── SPA 폴백 ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDataDir();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`내 일기 서버 실행 중: http://localhost:${PORT}`));
