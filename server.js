require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const multer   = require('multer');
const fs   = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'users.json');
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const PHOTO_TYPES = ['diary', 'exercise', 'food'];

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
  return db[googleId] || { mood: {}, food: {}, diary: {}, exercise: {}, photos: {} };
}

function saveUser(googleId, userData) {
  const db = readDb();
  if (!userData.diary)    userData.diary    = {};
  if (!userData.exercise) userData.exercise = {};
  if (!userData.photos)   userData.photos   = {};
  db[googleId] = userData;
  writeDb(db);
}

/* ── 업로드 설정 ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads', req.user.id, req.params.date);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${req.params.type}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('이미지 파일만 업로드할 수 있어요'));
  },
});

/* ── 날짜 유효성 ── */
function validDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); }

/* ── Passport ── */
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  const user = { id: profile.id, name: profile.displayName, photo: profile.photos?.[0]?.value || '' };
  saveUser(user.id, getUser(user.id));
  done(null, user);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

/* ── 미들웨어 ── */
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'my-diary-secret',
  resave: false, saveUninitialized: false,
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
  req.logout(() => req.session.destroy(() => res.redirect('/')));
});

/* ── API: 유저 ── */
app.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'not logged in' });
  res.json({ name: req.user.name, photo: req.user.photo });
});

/* ── API: 날짜별 데이터 ── */
app.get('/api/data/:date', requireLogin, (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  res.json({
    mood:     data.mood[date]     || null,
    food:     data.food[date]     || null,
    diary:    data.diary[date]    || null,
    exercise: data.exercise[date] || null,
    photos:   data.photos[date]   || null,
  });
});

/* ── API: 캘린더 ── */
app.get('/api/calendar/:year/:month', (req, res) => {
  if (!req.isAuthenticated()) return res.json({});
  const { year, month } = req.params;
  const prefix = `${year}-${month.padStart(2, '0')}`;
  const data = getUser(req.user.id);
  const result = {};
  // 감정 이모지
  Object.entries(data.mood).forEach(([date, entry]) => {
    if (date.startsWith(prefix)) result[date] = { emoji: entry.emoji, emotion: entry.emotion };
  });
  // 대표 사진
  if (data.photos) {
    Object.entries(data.photos).forEach(([date, pd]) => {
      if (date.startsWith(prefix) && pd.featured) {
        if (!result[date]) result[date] = {};
        result[date].featured = pd.featured;
      }
    });
  }
  res.json(result);
});

/* ── API: 사진 업로드 ── */
app.post('/api/photos/:date/:type', requireLogin, (req, res, next) => {
  const { date, type } = req.params;
  if (!validDate(date) || !PHOTO_TYPES.includes(type))
    return res.status(400).json({ error: 'invalid' });
  next();
}, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일이 없어요' });
  const { date, type } = req.params;
  const urlPath = `/uploads/${req.user.id}/${date}/${req.file.filename}`;

  const data = getUser(req.user.id);
  if (!data.photos[date]) data.photos[date] = { featured: null, items: [] };
  data.photos[date].items.push({ url: urlPath, type, uploadedAt: new Date().toISOString() });
  // 첫 사진이면 자동으로 대표 사진 지정
  if (!data.photos[date].featured) data.photos[date].featured = urlPath;
  saveUser(req.user.id, data);

  res.json({ ok: true, url: urlPath, photos: data.photos[date] });
});

/* ── API: 대표 사진 설정 ── */
app.post('/api/photos/:date/featured', requireLogin, (req, res) => {
  const { date } = req.params;
  const { url } = req.body;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  if (!data.photos[date]) return res.status(404).json({ error: 'not found' });
  data.photos[date].featured = url;
  saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── API: 사진 삭제 ── */
app.delete('/api/photos/:date', requireLogin, (req, res) => {
  const { date } = req.params;
  const { url } = req.body;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  if (!data.photos[date]) return res.status(404).json({ error: 'not found' });

  // 파일 실제 삭제
  const filePath = path.join(__dirname, 'public', url);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  data.photos[date].items = data.photos[date].items.filter(i => i.url !== url);
  if (data.photos[date].featured === url) {
    data.photos[date].featured = data.photos[date].items[0]?.url || null;
  }
  saveUser(req.user.id, data);
  res.json({ ok: true, photos: data.photos[date] });
});

/* ── API: 감정 ── */
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

/* ── API: 일기 ── */
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

/* ── API: 운동 ── */
app.post('/api/exercise', requireLogin, (req, res) => {
  const { date, program, calories, maxHR, avgHR } = req.body;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = getUser(req.user.id);
  data.exercise[date] = {
    program: program || '',
    calories: parseInt(calories, 10) || 0,
    maxHR: parseInt(maxHR, 10) || 0,
    avgHR: parseInt(avgHR, 10) || 0,
    savedAt: new Date().toISOString(),
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

/* ── API: 음식 ── */
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
/* ── API: 음식 수정 ── */
app.patch('/api/food/:date/:meal/:idx', requireLogin, (req, res) => {
  const { date, meal, idx } = req.params;
  const { name, kcal } = req.body;
  if (!validDate(date) || !MEALS.includes(meal)) return res.status(400).json({ error: 'invalid' });
  const idxVal  = parseInt(idx, 10);
  const kcalVal = parseInt(kcal, 10);
  if (isNaN(idxVal) || !name?.trim() || isNaN(kcalVal) || kcalVal < 0)
    return res.status(400).json({ error: 'invalid body' });
  const data = getUser(req.user.id);
  if (!data.food[date]?.[meal]?.[idxVal]) return res.status(404).json({ error: 'not found' });
  data.food[date][meal][idxVal] = { name: name.trim(), kcal: kcalVal };
  saveUser(req.user.id, data);
  res.json({ ok: true });
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDataDir();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`내 일기 서버 실행 중: http://localhost:${PORT}`));
