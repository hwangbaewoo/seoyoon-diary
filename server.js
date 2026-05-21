require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const multer   = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const AdmZip = require('adm-zip');

const app = express();
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const PHOTO_TYPES = ['diary', 'exercise', 'food'];

/* ── Supabase 연결 ── */
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/* ── 데이터 헬퍼 (파일 → Supabase DB) ── */
async function getUser(googleId) {
  const { data } = await supabase
    .from('users')
    .select('data')
    .eq('google_id', googleId)
    .single();
  return data?.data || { mood: {}, food: {}, diary: {}, exercise: {}, photos: {} };
}

async function saveUser(googleId, userData) {
  if (!userData.diary)    userData.diary    = {};
  if (!userData.exercise) userData.exercise = {};
  if (!userData.photos)   userData.photos   = {};
  const { error } = await supabase
    .from('users')
    .upsert({ google_id: googleId, data: userData });
  if (error) console.log('saveUser 오류:', JSON.stringify(error));
}

/* ── 업로드 설정 (메모리 → Supabase Storage) ── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('이미지 또는 동영상 파일만 업로드할 수 있어요'));
  },
});

/* ── ZIP 업로드 설정 (삼성헬스 전용) ── */
const uploadZip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) cb(null, true);
    else cb(new Error('ZIP 파일만 업로드할 수 있어요'));
  },
});

/* ── 날짜 유효성 ── */
function validDate(d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); }

/* ── Passport ── */
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = { id: profile.id, name: profile.displayName, photo: profile.photos?.[0]?.value || '' };
    const existing = await getUser(user.id);
    await saveUser(user.id, existing);
    done(null, user);
  } catch (e) { done(e); }
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
app.get('/api/data/:date', requireLogin, async (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = await getUser(req.user.id);
  res.json({
    mood:     data.mood[date]     || null,
    food:     data.food[date]     || null,
    diary:    data.diary[date]    || null,
    exercise: data.exercise[date] || null,
    photos:   data.photos[date]   || null,
  });
});

/* ── API: 캘린더 ── */
app.get('/api/calendar/:year/:month', async (req, res) => {
  if (!req.isAuthenticated()) return res.json({});
  const { year, month } = req.params;
  const prefix = `${year}-${month.padStart(2, '0')}`;
  const data = await getUser(req.user.id);
  const result = {};
  Object.entries(data.mood).forEach(([date, entry]) => {
    if (date.startsWith(prefix)) result[date] = { emoji: entry.emoji, emotion: entry.emotion };
  });
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
}, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      console.log('multer 오류:', err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일이 없어요' });
  const { date, type } = req.params;

  console.log('업로드 시도:', req.file.originalname, req.file.mimetype, req.file.size);

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${type}_${Date.now()}${ext}`;
  const storagePath = `${req.user.id}/${date}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from('diary-photos')
    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

  if (uploadError) {
    console.log('Supabase 업로드 오류:', JSON.stringify(uploadError));
    return res.status(500).json({ error: '사진 업로드 실패', detail: uploadError.message });
  }

  const { data: urlData } = supabase.storage
    .from('diary-photos')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;
  const data = await getUser(req.user.id);
  if (!data.photos[date]) data.photos[date] = { featured: null, items: [] };
  const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  data.photos[date].items.push({ url: publicUrl, type, mediaType, uploadedAt: new Date().toISOString() });
  if (!data.photos[date].featured) data.photos[date].featured = publicUrl;
  await saveUser(req.user.id, data);
  console.log(`저장 완료: ${date} items 총 ${data.photos[date].items.length}개`);

  res.json({ ok: true, url: publicUrl, photos: data.photos[date] });
});

/* ── API: 대표 사진 설정 ── */
app.post('/api/photos/:date/featured', requireLogin, async (req, res) => {
  const { date } = req.params;
  const { url } = req.body;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = await getUser(req.user.id);
  if (!data.photos[date]) return res.status(404).json({ error: 'not found' });
  data.photos[date].featured = url;
  await saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── API: 사진 삭제 ── */
app.delete('/api/photos/:date', requireLogin, async (req, res) => {
  try {
    const { date } = req.params;
    const { url } = req.body;
    console.log('삭제 요청:', date, url);
    if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
    const data = await getUser(req.user.id);
    if (!data.photos[date]) return res.status(404).json({ error: 'not found' });

    const prefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/diary-photos/`;
    const storagePath = url.replace(prefix, '');
    const { error: storageErr } = await supabase.storage.from('diary-photos').remove([storagePath]);
    if (storageErr) console.log('Storage 삭제 오류:', JSON.stringify(storageErr));

    data.photos[date].items = (data.photos[date].items || []).filter(i => i.url !== url);
    if (data.photos[date].featured === url) {
      data.photos[date].featured = data.photos[date].items[0]?.url || null;
    }
    await saveUser(req.user.id, data);
    console.log('삭제 완료, 남은 items:', data.photos[date].items.length);
    res.json({ ok: true, photos: data.photos[date] });
  } catch (e) {
    console.log('삭제 핸들러 오류:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ── API: 감정 ── */
app.post('/api/mood', requireLogin, async (req, res) => {
  const { date, emotion, emoji, label, intensity } = req.body;
  if (!validDate(date) || !emotion || !emoji || !label) return res.status(400).json({ error: 'invalid' });
  const intVal = parseInt(intensity, 10);
  if (isNaN(intVal) || intVal < 1 || intVal > 10) return res.status(400).json({ error: 'invalid intensity' });
  const data = await getUser(req.user.id);
  data.mood[date] = { emotion, emoji, label, intensity: intVal, savedAt: new Date().toISOString() };
  await saveUser(req.user.id, data);
  res.json({ ok: true });
});

app.delete('/api/mood/:date', requireLogin, async (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = await getUser(req.user.id);
  delete data.mood[date];
  await saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── API: 일기 ── */
app.post('/api/diary', requireLogin, async (req, res) => {
  const { date, text } = req.body;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = await getUser(req.user.id);
  data.diary[date] = { text: text || '', savedAt: new Date().toISOString() };
  await saveUser(req.user.id, data);
  res.json({ ok: true });
});

app.delete('/api/diary/:date', requireLogin, async (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = await getUser(req.user.id);
  delete data.diary[date];
  await saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── API: 운동 ── */
app.post('/api/exercise', requireLogin, async (req, res) => {
  const { date, program, calories, maxHR, avgHR } = req.body;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = await getUser(req.user.id);
  data.exercise[date] = {
    program: program || '',
    calories: parseInt(calories, 10) || 0,
    maxHR: parseInt(maxHR, 10) || 0,
    avgHR: parseInt(avgHR, 10) || 0,
    savedAt: new Date().toISOString(),
  };
  await saveUser(req.user.id, data);
  res.json({ ok: true });
});

app.delete('/api/exercise/:date', requireLogin, async (req, res) => {
  const { date } = req.params;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });
  const data = await getUser(req.user.id);
  delete data.exercise[date];
  await saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── API: 음식 ── */
app.post('/api/food', requireLogin, async (req, res) => {
  const { date, meal, name, kcal } = req.body;
  if (!validDate(date) || !MEALS.includes(meal) || !name?.trim()) return res.status(400).json({ error: 'invalid' });
  const kcalVal = parseInt(kcal, 10);
  if (isNaN(kcalVal) || kcalVal < 0) return res.status(400).json({ error: 'invalid kcal' });
  const data = await getUser(req.user.id);
  if (!data.food[date]) data.food[date] = { breakfast: [], lunch: [], dinner: [], snack: [] };
  data.food[date][meal].push({ name: name.trim(), kcal: kcalVal });
  await saveUser(req.user.id, data);
  res.json({ ok: true, idx: data.food[date][meal].length - 1 });
});

app.patch('/api/food/:date/:meal/:idx', requireLogin, async (req, res) => {
  const { date, meal, idx } = req.params;
  const { name, kcal } = req.body;
  if (!validDate(date) || !MEALS.includes(meal)) return res.status(400).json({ error: 'invalid' });
  const idxVal  = parseInt(idx, 10);
  const kcalVal = parseInt(kcal, 10);
  if (isNaN(idxVal) || !name?.trim() || isNaN(kcalVal) || kcalVal < 0)
    return res.status(400).json({ error: 'invalid body' });
  const data = await getUser(req.user.id);
  if (!data.food[date]?.[meal]?.[idxVal]) return res.status(404).json({ error: 'not found' });
  data.food[date][meal][idxVal] = { name: name.trim(), kcal: kcalVal };
  await saveUser(req.user.id, data);
  res.json({ ok: true });
});

app.delete('/api/food/:date/:meal/:idx', requireLogin, async (req, res) => {
  const { date, meal, idx } = req.params;
  if (!validDate(date) || !MEALS.includes(meal)) return res.status(400).json({ error: 'invalid' });
  const idxVal = parseInt(idx, 10);
  if (isNaN(idxVal) || idxVal < 0) return res.status(400).json({ error: 'invalid idx' });
  const data = await getUser(req.user.id);
  if (!data.food[date]?.[meal]) return res.status(404).json({ error: 'not found' });
  data.food[date][meal].splice(idxVal, 1);
  await saveUser(req.user.id, data);
  res.json({ ok: true });
});

/* ── API: 삼성헬스 날짜 목록 조회 ── */
app.post('/api/import/samsung-health/dates', requireLogin, uploadZip.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일이 없어요' });
  try {
    const zip = new AdmZip(req.file.buffer);
    const dates = new Set();
    zip.getEntries().forEach(entry => {
      if (!entry.entryName.includes('exercise.live_data')) return;
      try {
        const rows = JSON.parse(zip.readAsText(entry));
        rows.forEach(item => {
          if (item.heart_rate && item.start_time) {
            const kst = new Date(item.start_time + 9 * 60 * 60 * 1000);
            const d = kst.toISOString().slice(0, 10);
            dates.add(d);
          }
        });
      } catch (_) {}
    });
    res.json({ dates: [...dates].sort() });
  } catch (e) {
    console.error('삼성헬스 날짜 파싱 오류:', e.message);
    res.status(500).json({ error: '파일 처리 중 오류가 발생했어요' });
  }
});

/* ── API: 삼성헬스 ZIP 가져오기 ── */
app.post('/api/import/samsung-health', requireLogin, uploadZip.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '파일이 없어요' });
  const { date } = req.query;
  if (!validDate(date)) return res.status(400).json({ error: 'invalid date' });

  try {
    const zip = new AdmZip(req.file.buffer);
    const startOfDay = new Date(date + 'T00:00:00+09:00').getTime();
    const endOfDay   = new Date(date + 'T23:59:59+09:00').getTime();
    const hrValues = [];

    zip.getEntries().forEach(entry => {
      if (!entry.entryName.includes('exercise.live_data')) return;
      try {
        const rows = JSON.parse(zip.readAsText(entry));
        rows.forEach(item => {
          if (item.heart_rate && item.start_time >= startOfDay && item.start_time <= endOfDay) {
            hrValues.push(item.heart_rate);
          }
        });
      } catch (_) {}
    });

    if (hrValues.length === 0) return res.json({ found: false, message: '해당 날짜의 운동 기록이 없어요' });

    const maxHR = Math.round(Math.max(...hrValues));
    const avgHR = Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length);
    res.json({ found: true, maxHR, avgHR });
  } catch (e) {
    console.error('삼성헬스 파싱 오류:', e.message);
    res.status(500).json({ error: '파일 처리 중 오류가 발생했어요' });
  }
});

/* ── API: 내 기록 날짜 목록 ── */
app.get('/api/my-dates', requireLogin, async (req, res) => {
  const data = await getUser(req.user.id);
  const dateSet = new Set();
  [data.mood, data.food, data.diary, data.exercise, data.photos].forEach(cat => {
    if (cat) Object.keys(cat).forEach(d => { if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dateSet.add(d); });
  });
  res.json({ dates: [...dateSet].sort() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`내 일기 서버 실행 중: http://localhost:${PORT}`));
