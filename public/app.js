/* ══════════════════════════════════════════
   내 일기 — 통합 앱 v2 (감정·운동·식단·일기)
   ══════════════════════════════════════════ */

/* ── F45 프로그램 목록 ── */
const F45_PROGRAMS = [
  // Cardio
  { name: '22',              type: 'Cardio' },
  { name: 'Abacus',          type: 'Cardio' },
  { name: 'Afterglow',       type: 'Cardio' },
  { name: 'Athletica',       type: 'Cardio' },
  { name: 'Bears',           type: 'Cardio' },
  { name: 'Brixton',         type: 'Cardio' },
  { name: 'Brooklyn',        type: 'Cardio' },
  { name: 'Docklands',       type: 'Cardio' },
  { name: 'Empire',          type: 'Cardio' },
  { name: 'Firestorm',       type: 'Cardio' },
  { name: 'Foxtrot',         type: 'Cardio' },
  { name: 'Gravity',         type: 'Cardio' },
  { name: 'Marathon',        type: 'Cardio' },
  { name: 'MVP',             type: 'Cardio' },
  { name: 'Pipeline',        type: 'Cardio' },
  { name: 'Quarterbacks',    type: 'Cardio' },
  { name: 'Redline',         type: 'Cardio' },
  { name: 'Templars',        type: 'Cardio' },
  { name: 'Triple Double',   type: 'Cardio' },
  { name: 'Triple Threat',   type: 'Cardio' },
  { name: 'Varsity',         type: 'Cardio' },
  // Resistance
  { name: 'All-Star',        type: 'Resistance' },
  { name: 'Alpha',           type: 'Resistance' },
  { name: 'Angry Bird',      type: 'Resistance' },
  { name: 'Benchmark',       type: 'Resistance' },
  { name: 'Deuces',          type: 'Resistance' },
  { name: 'Double Down',     type: 'Resistance' },
  { name: 'Gemini',          type: 'Resistance' },
  { name: 'Goat',            type: 'Resistance' },
  { name: 'Hammer',          type: 'Resistance' },
  { name: 'Iceberg',         type: 'Resistance' },
  { name: 'Liberty',         type: 'Resistance' },
  { name: 'Lonestar',        type: 'Resistance' },
  { name: 'Mkatz',           type: 'Resistance' },
  { name: 'Moon Hopper',     type: 'Resistance' },
  { name: 'Panthers',        type: 'Resistance' },
  { name: 'Pegasus',         type: 'Resistance' },
  { name: 'Red Diamond',     type: 'Resistance' },
  { name: 'Renegade',        type: 'Resistance' },
  { name: 'Romans',          type: 'Resistance' },
  { name: 'The Piston',      type: 'Resistance' },
  { name: 'Titans',          type: 'Resistance' },
  { name: 'Tokyo Disco',     type: 'Resistance' },
  { name: 'Two Fold',        type: 'Resistance' },
  { name: 'Wyvern',          type: 'Resistance' },
  // Hybrid
  { name: '3-Peat',          type: 'Hybrid' },
  { name: 'Apex',            type: 'Hybrid' },
  { name: 'Checkmate',       type: 'Hybrid' },
  { name: 'Forty Five',      type: 'Hybrid' },
  { name: 'Heroes Hollywood',type: 'Hybrid' },
  { name: 'High Rise',       type: 'Hybrid' },
  { name: 'Hollywood',       type: 'Hybrid' },
  { name: 'Loyals',          type: 'Hybrid' },
  { name: 'Miami Nights',    type: 'Hybrid' },
  { name: 'Mont Blanc',      type: 'Hybrid' },
  { name: 'NoHo',            type: 'Hybrid' },
  { name: 'Seoul Rush',      type: 'Hybrid' },
  { name: 'SoCal',           type: 'Hybrid' },
  { name: 'Special Ops',     type: 'Hybrid' },
  { name: 'T10',             type: 'Hybrid' },
  { name: 'Tempest',         type: 'Hybrid' },
  { name: 'The Joker',       type: 'Hybrid' },
  { name: 'The Nines',       type: 'Hybrid' },
  { name: 'The Wringer',     type: 'Hybrid' },
  { name: 'Track Stars',     type: 'Hybrid' },
  { name: 'Valor',           type: 'Hybrid' },
  { name: 'West Hollywood',  type: 'Hybrid' },
  { name: 'Wingman',         type: 'Hybrid' },
  // Recovery
  { name: 'Calypso Kings',   type: 'Recovery' },
  { name: 'Flow',            type: 'Recovery' },
  { name: 'Mondrian 30',     type: 'Recovery' },
  { name: 'Reset',           type: 'Recovery' },
];

const MEALS   = ['breakfast','lunch','dinner','snack'];
const MEAL_KO = { breakfast:'아침', lunch:'점심', dinner:'저녁', snack:'간식' };
const EMOTION_KO = {
  happy:'기쁨', excited:'신남', loving:'사랑', grateful:'감사', calm:'평온',
  tired:'피곤', sad:'슬픔', depressed:'우울', angry:'화남', anxious:'불안',
};

let currentUser     = null;
let currentDate     = todayStr();
let calYear, calMonth;
let selectedEmotion = null;
let currentMoodData = null;
let currentFoodData = null;
let currentDiaryData    = null;
let currentExerciseData = null;
let currentPhotosData   = null;
let pendingPhotos = { diary: [], exercise: [], food: [] }; // 업로드 대기 사진

/* ── 날짜 유틸 ── */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function pad(n) { return String(n).padStart(2,'0'); }
function formatLabel(dateStr) {
  const [y,m,d] = dateStr.split('-');
  const dt = new Date(Number(y), Number(m)-1, Number(d));
  const days = ['일','월','화','수','목','금','토'];
  return `${y}년 ${Number(m)}월 ${Number(d)}일 (${days[dt.getDay()]})`;
}
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function getIntensityColor(v) {
  if (v <= 4) return '#7dd3fc';
  if (v <= 7) return '#0284c7';
  return '#0369a1';
}

/* ── API 헬퍼 ── */
async function api(method, url, body) {
  const opts = { method, headers: {'Content-Type':'application/json'} };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/* ══════════════════════
   로그인
══════════════════════ */
async function checkLogin() {
  try {
    const user = await api('GET', '/api/me');
    currentUser = user;
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-photo').src        = user.photo;
    document.getElementById('login-btn').classList.add('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    setFormsEnabled(true);
  } catch {
    currentUser = null;
    document.getElementById('login-btn').classList.remove('hidden');
    document.getElementById('user-info').classList.add('hidden');
    setFormsEnabled(false);
  }
}

function setFormsEnabled(enabled) {
  // 감정
  document.getElementById('mood-login-prompt').classList.toggle('hidden', enabled);
  if (!enabled) {
    document.getElementById('mood-form').classList.add('hidden');
    document.getElementById('existing-mood').classList.add('hidden');
  }
  // 일기
  document.getElementById('diary-login-prompt').classList.toggle('hidden', enabled);
  document.getElementById('diary-form').classList.toggle('hidden', !enabled);
  // 운동
  document.getElementById('exercise-login-prompt').classList.toggle('hidden', enabled);
  document.getElementById('exercise-form').classList.toggle('hidden', !enabled);
  // 식단
  document.querySelectorAll('.add-btn, .food-input, .kcal-input').forEach(el => {
    if (enabled) el.removeAttribute('disabled');
    else el.setAttribute('disabled','');
  });
}

/* ══════════════════════
   날짜 로드
══════════════════════ */
async function setCurrentDate(dateStr) {
  currentDate = dateStr;
  // 날짜 바꾸면 대기 사진 초기화
  pendingPhotos = { diary: [], exercise: [], food: [] };
  ['diary','exercise','food'].forEach(t => renderPendingPhotos(t));
  updateSaveAllBtn();
  document.getElementById('today-label').textContent      = formatLabel(dateStr);
  document.getElementById('exercise-date-label').textContent = formatLabel(dateStr);
  document.querySelectorAll('.cal-day').forEach(el => {
    el.classList.toggle('is-selected', el.dataset.date === dateStr);
  });
  await loadDateData();
}

async function loadDateData() {
  if (!currentUser) {
    currentMoodData = currentFoodData = currentDiaryData = currentExerciseData = null;
    renderMoodTab(); renderFoodTab(); renderDiary(); renderExercise();
    return;
  }
  try {
    const data = await api('GET', `/api/data/${currentDate}`);
    currentMoodData     = data.mood;
    currentFoodData     = data.food;
    currentDiaryData    = data.diary;
    currentExerciseData = data.exercise;
    currentPhotosData   = data.photos;
  } catch {
    currentMoodData = currentFoodData = currentDiaryData = currentExerciseData = currentPhotosData = null;
  }
  renderMoodTab();
  renderFoodTab();
  renderDiary();
  renderExercise();
  renderPhotos();
  renderFeaturedPreview();
}

/* ══════════════════════
   감정 탭
══════════════════════ */
function renderMoodTab() {
  const form     = document.getElementById('mood-form');
  const existing = document.getElementById('existing-mood');
  const prompt   = document.getElementById('mood-login-prompt');
  if (!currentUser) {
    prompt.classList.remove('hidden');
    form.classList.add('hidden');
    existing.classList.add('hidden');
    return;
  }
  prompt.classList.add('hidden');
  if (currentMoodData) {
    form.classList.add('hidden');
    existing.classList.remove('hidden');
    document.getElementById('ex-emoji').textContent     = currentMoodData.emoji;
    document.getElementById('ex-label').textContent     = currentMoodData.label;
    document.getElementById('ex-intensity').textContent = currentMoodData.intensity;
    const fill = document.getElementById('ex-bar-fill');
    fill.style.width      = `${(currentMoodData.intensity/10)*100}%`;
    fill.style.background = getIntensityColor(currentMoodData.intensity);
  } else {
    existing.classList.add('hidden');
    form.classList.remove('hidden');
    selectedEmotion = null;
    document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('intensity-slider').value = 5;
    updateSliderUI(5);
    document.getElementById('mood-feedback').textContent = '';
  }
  renderMoodHistory();
}

function selectEmotion(btn) {
  document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedEmotion = { emotion: btn.dataset.emotion, label: btn.dataset.label, emoji: btn.dataset.emoji };
}

function updateSliderUI(value) {
  const display = document.getElementById('intensity-display');
  display.textContent      = value;
  display.style.background = getIntensityColor(Number(value));
  const pct = ((value-1)/9)*100;
  document.getElementById('intensity-slider').style.background =
    `linear-gradient(to right, #7dd3fc ${pct}%, #e0f2fe ${pct}%)`;
}

async function saveMood() {
  if (!selectedEmotion) { showFeedback('mood-feedback','감정을 먼저 선택해주세요!','error'); return; }
  const intensity = Number(document.getElementById('intensity-slider').value);
  try {
    await api('POST', '/api/mood', { date: currentDate, ...selectedEmotion, intensity });
    currentMoodData = { ...selectedEmotion, intensity };
    renderMoodTab(); renderCalendar();
    showFeedback('mood-feedback','저장됐어요 ✓','success');
  } catch { showFeedback('mood-feedback','저장 실패','error'); }
}

function editMood() {
  // 저장된 감정값을 폼에 채워 넣고 수정 모드로 전환
  const form     = document.getElementById('mood-form');
  const existing = document.getElementById('existing-mood');
  existing.classList.add('hidden');
  form.classList.remove('hidden');
  // 기존 이모지 버튼 선택 상태 복원
  if (currentMoodData) {
    const btn = document.querySelector(`.emotion-btn[data-emotion="${currentMoodData.emotion}"]`);
    if (btn) selectEmotion(btn);
    document.getElementById('intensity-slider').value = currentMoodData.intensity;
    updateSliderUI(currentMoodData.intensity);
  }
}

async function deleteMood() {
  if (!confirm('이 날의 감정 기록을 삭제할까요?')) return;
  await api('DELETE', `/api/mood/${currentDate}`);
  currentMoodData = null;
  renderMoodTab(); renderCalendar();
}

async function renderMoodHistory() {
  const container = document.getElementById('mood-history-list');
  if (!currentUser) { container.innerHTML = '<div class="empty-msg">로그인 후 확인할 수 있어요.</div>'; return; }
  try {
    const now = new Date();
    const [c1, c2] = await Promise.all([
      fetch(`/api/calendar/${now.getFullYear()}/${now.getMonth()+1}`).then(r=>r.json()),
      fetch(`/api/calendar/${now.getFullYear()}/${now.getMonth()}`).then(r=>r.json()),
    ]);
    const combined = {...c2,...c1};
    const dates = Object.keys(combined).sort((a,b)=>b.localeCompare(a)).filter(d=>d!==currentDate);
    if (!dates.length) { container.innerHTML = '<div class="empty-msg">지난 기록이 없어요!</div>'; return; }
    container.innerHTML = '';
    dates.slice(0,14).forEach(date => {
      const entry = combined[date];
      const el = document.createElement('div');
      el.className = 'mood-history-item';
      el.innerHTML = `
        <span class="mh-emoji">${entry.emoji}</span>
        <div class="mh-info">
          <div class="mh-date">${formatLabel(date)}</div>
          <div class="mh-label">${EMOTION_KO[entry.emotion] || entry.emotion}</div>
        </div>
        <button class="mh-del" data-date="${date}">✕</button>
      `;
      el.querySelector('.mh-del').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('삭제할까요?')) return;
        await api('DELETE', `/api/mood/${date}`);
        renderCalendar(); renderMoodHistory();
      });
      el.addEventListener('click', () => setCurrentDate(date));
      container.appendChild(el);
    });
  } catch { container.innerHTML = '<div class="empty-msg">불러오기 실패</div>'; }
}

/* ══════════════════════
   일기
══════════════════════ */
function renderDiary() {
  if (!currentUser) return;
  const textarea  = document.getElementById('diary-text');
  const saveBtn   = document.getElementById('save-diary-btn');
  const editBtn   = document.getElementById('edit-diary-btn');
  const deleteBtn = document.getElementById('delete-diary-btn');

  if (currentDiaryData) {
    // 저장된 일기가 있으면 읽기 전용처럼 보이게 (수정 버튼 표시)
    textarea.value = currentDiaryData.text || '';
    textarea.readOnly = true;
    textarea.style.background = '#f0f9ff';
    saveBtn.classList.add('hidden');
    editBtn.classList.remove('hidden');
    deleteBtn.classList.remove('hidden');
  } else {
    textarea.value = '';
    textarea.readOnly = false;
    textarea.style.background = '';
    saveBtn.classList.remove('hidden');
    editBtn.classList.add('hidden');
    deleteBtn.classList.add('hidden');
  }
  document.getElementById('diary-feedback').textContent = '';
}

function editDiary() {
  const textarea = document.getElementById('diary-text');
  textarea.readOnly = false;
  textarea.style.background = '';
  textarea.focus();
  document.getElementById('save-diary-btn').classList.remove('hidden');
  document.getElementById('edit-diary-btn').classList.add('hidden');
}

async function saveDiary() {
  const text = document.getElementById('diary-text').value;
  try {
    await api('POST', '/api/diary', { date: currentDate, text });
    currentDiaryData = { text };
    document.getElementById('delete-diary-btn').classList.remove('hidden');
    renderCalendar();
    showFeedback('diary-feedback','일기 저장됐어요 ✓','success');
  } catch { showFeedback('diary-feedback','저장 실패','error'); }
}

async function deleteDiary() {
  if (!confirm('일기를 삭제할까요?')) return;
  await api('DELETE', `/api/diary/${currentDate}`);
  currentDiaryData = null;
  renderDiary();
  renderCalendar();
}

/* ══════════════════════
   운동 탭
══════════════════════ */
function renderExercise() {
  const form     = document.getElementById('exercise-form');
  const existing = document.getElementById('existing-exercise');
  const prompt   = document.getElementById('exercise-login-prompt');

  document.getElementById('exercise-date-label').textContent = formatLabel(currentDate);

  if (!currentUser) {
    prompt.classList.remove('hidden');
    form.classList.add('hidden');
    existing.classList.add('hidden');
    return;
  }
  prompt.classList.add('hidden');

  if (currentExerciseData) {
    form.classList.add('hidden');
    existing.classList.remove('hidden');
    document.getElementById('ex-program-display').textContent =
      currentExerciseData.program ? `🏷️ ${currentExerciseData.program}` : '프로그램 미입력';
    document.getElementById('stat-calories').textContent = currentExerciseData.calories || '-';
    document.getElementById('stat-maxhr').textContent    = currentExerciseData.maxHR    || '-';
    document.getElementById('stat-avghr').textContent    = currentExerciseData.avgHR    || '-';
  } else {
    existing.classList.add('hidden');
    form.classList.remove('hidden');
    document.getElementById('ex-program').value  = '';
    document.getElementById('ex-calories').value = '';
    document.getElementById('ex-maxhr').value    = '';
    document.getElementById('ex-avghr').value    = '';
    document.getElementById('exercise-feedback').textContent = '';
  }
}

async function saveExercise() {
  const program  = document.getElementById('ex-program').value.trim();
  const calories = document.getElementById('ex-calories').value;
  const maxHR    = document.getElementById('ex-maxhr').value;
  const avgHR    = document.getElementById('ex-avghr').value;
  try {
    await api('POST', '/api/exercise', { date: currentDate, program, calories, maxHR, avgHR });
    currentExerciseData = {
      program,
      calories: parseInt(calories)||0,
      maxHR:    parseInt(maxHR)||0,
      avgHR:    parseInt(avgHR)||0,
    };
    renderExercise();
    renderCalendar();
    showFeedback('exercise-feedback','운동 기록 저장됐어요 ✓','success');
  } catch { showFeedback('exercise-feedback','저장 실패','error'); }
}

function editExercise() {
  const form     = document.getElementById('exercise-form');
  const existing = document.getElementById('existing-exercise');
  existing.classList.add('hidden');
  form.classList.remove('hidden');
  // 기존 값 폼에 채우기
  if (currentExerciseData) {
    document.getElementById('ex-program').value  = currentExerciseData.program  || '';
    document.getElementById('ex-calories').value = currentExerciseData.calories || '';
    document.getElementById('ex-maxhr').value    = currentExerciseData.maxHR    || '';
    document.getElementById('ex-avghr').value    = currentExerciseData.avgHR    || '';
  }
}

async function deleteExercise() {
  if (!confirm('운동 기록을 삭제할까요?')) return;
  await api('DELETE', `/api/exercise/${currentDate}`);
  currentExerciseData = null;
  renderExercise();
  renderCalendar();
}

/* ══════════════════════
   식단 탭
══════════════════════ */
function renderFoodTab() {
  const food = currentFoodData || { breakfast:[],lunch:[],dinner:[],snack:[] };
  let total  = 0;
  MEALS.forEach(meal => {
    const items = food[meal] || [];
    const sum   = items.reduce((s,i)=>s+i.kcal, 0);
    total += sum;
    document.getElementById(`total-${meal}`).textContent = `${sum} kcal`;
    document.getElementById(`sum-${meal}`).textContent   = `${sum} kcal`;
    const list = document.getElementById(`list-${meal}`);
    list.innerHTML = '';
    items.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'food-item';
      el.innerHTML = `
        <span class="food-name">${escapeHtml(item.name)}</span>
        <span class="food-kcal">${item.kcal} kcal</span>
        <button class="food-edit" data-meal="${meal}" data-idx="${idx}" title="수정">✏️</button>
        <button class="food-del"  data-meal="${meal}" data-idx="${idx}" title="삭제">✕</button>
      `;
      list.appendChild(el);
    });
  });
  document.getElementById('total-kcal').textContent = total;
}

async function addFood(meal) {
  if (!currentUser) return;
  const card      = document.querySelector(`.meal-card[data-meal="${meal}"]`);
  const nameInput = card.querySelector('.food-input');
  const kcalInput = card.querySelector('.kcal-input');
  const name = nameInput.value.trim();
  const kcal = parseInt(kcalInput.value, 10);
  if (!name) { nameInput.focus(); return; }
  if (isNaN(kcal) || kcal < 0) { kcalInput.focus(); return; }
  await api('POST', '/api/food', { date: currentDate, meal, name, kcal });
  if (!currentFoodData) currentFoodData = { breakfast:[],lunch:[],dinner:[],snack:[] };
  const wasEmpty = !currentFoodData || !Object.values(currentFoodData).some(arr => arr.length > 0);
  currentFoodData[meal].push({ name, kcal });
  nameInput.value = ''; kcalInput.value = '';
  nameInput.focus();
  renderFoodTab();
  if (wasEmpty) renderCalendar(); // 첫 항목 추가 시 캘린더 갱신
}

async function deleteFood(meal, idx) {
  await api('DELETE', `/api/food/${currentDate}/${meal}/${idx}`);
  currentFoodData[meal].splice(idx, 1);
  renderFoodTab();
}

function editFoodItem(meal, idx) {
  const list   = document.getElementById(`list-${meal}`);
  const item   = currentFoodData?.[meal]?.[idx];
  const itemEl = list.children[idx];
  if (!item || !itemEl) return;

  itemEl.classList.add('food-item-editing');
  itemEl.innerHTML = `
    <input class="food-edit-name" value="${escapeHtml(item.name)}" placeholder="음식 이름" />
    <input class="food-edit-kcal" type="number" value="${item.kcal}" placeholder="kcal" min="0" />
    <button class="food-save-edit" title="저장">✓</button>
    <button class="food-cancel-edit" title="취소">✕</button>
  `;
  const nameInput = itemEl.querySelector('.food-edit-name');
  const kcalInput = itemEl.querySelector('.food-edit-kcal');
  nameInput.focus();

  async function doSave() {
    const nameVal = nameInput.value.trim();
    const kcalVal = parseInt(kcalInput.value, 10);
    if (!nameVal || isNaN(kcalVal) || kcalVal < 0) return;
    try {
      await api('PATCH', `/api/food/${currentDate}/${meal}/${idx}`, { name: nameVal, kcal: kcalVal });
      currentFoodData[meal][idx] = { name: nameVal, kcal: kcalVal };
      renderFoodTab();
    } catch { alert('저장 실패'); }
  }

  itemEl.querySelector('.food-save-edit').addEventListener('click', doSave);
  itemEl.querySelector('.food-cancel-edit').addEventListener('click', () => renderFoodTab());
  kcalInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSave(); });
}

/* ══════════════════════
   캘린더
══════════════════════ */
async function renderCalendar() {
  document.getElementById('cal-month-label').textContent = `${calYear}년 ${calMonth+1}월`;
  let calData = {};
  if (currentUser) {
    try { calData = await fetch(`/api/calendar/${calYear}/${calMonth+1}`).then(r=>r.json()); }
    catch { calData = {}; }
  }
  const grid     = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const daysInPrev  = new Date(calYear, calMonth, 0).getDate();
  const today       = todayStr();

  for (let i = firstDay-1; i >= 0; i--) {
    const cell = document.createElement('div');
    cell.className = 'cal-day other-month';
    cell.innerHTML = `<span class="cal-day-num">${daysInPrev-i}</span>`;
    grid.appendChild(cell);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${pad(calMonth+1)}-${pad(d)}`;
    const entry   = calData[dateStr];
    const cell    = document.createElement('div');
    const classes = ['cal-day'];
    if (dateStr === today)       classes.push('is-today');
    if (dateStr === currentDate) classes.push('is-selected');
    if (entry)                   classes.push('has-entry');
    cell.className    = classes.join(' ');
    cell.dataset.date = dateStr;
    cell.innerHTML = `
      <span class="cal-day-num">${d}</span>
      ${entry?.emoji ? `<span class="cal-day-emoji">${entry.emoji}</span>` : ''}
      ${(entry?.hasExercise || entry?.hasFood || entry?.hasDiary) ? `
        <div class="cal-icons">
          ${entry.hasExercise ? '<span class="cal-icon" title="운동">💪</span>' : ''}
          ${entry.hasFood     ? '<span class="cal-icon" title="식단">🍽️</span>' : ''}
          ${entry.hasDiary    ? '<span class="cal-icon" title="일기">✏️</span>' : ''}
        </div>` : ''}
    `;
    cell.addEventListener('click', () => setCurrentDate(dateStr));
    grid.appendChild(cell);
  }
  const total     = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= remaining; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day other-month';
    cell.innerHTML = `<span class="cal-day-num">${d}</span>`;
    grid.appendChild(cell);
  }
}

/* ══════════════════════
   사진
══════════════════════ */
function renderFeaturedPreview() {
  const wrap = document.getElementById('featured-preview');
  const img  = document.getElementById('featured-img');
  const meta = document.getElementById('featured-meta');

  const featured = currentPhotosData?.featured;
  if (featured && currentUser) {
    const featuredItem = currentPhotosData?.items?.find(i => i.url === featured);
    const isVideo = featuredItem?.mediaType === 'video';
    img.src = isVideo ? '' : featured;
    img.style.display = isVideo ? 'none' : '';
    meta.textContent = `📅 ${formatLabel(currentDate)}`;
    wrap.classList.remove('hidden');
    wrap.onclick = () => openLightbox(featured, isVideo ? 'video' : 'image');
  } else {
    wrap.classList.add('hidden');
    wrap.onclick = null;
  }
}

function renderPhotos() {
  ['diary','exercise','food'].forEach(type => {
    const grid = document.getElementById(`grid-${type}`);
    if (!grid) return;
    grid.innerHTML = '';
    const items = (currentPhotosData?.items || []).filter(i => i.type === type);
    const featured = currentPhotosData?.featured;

    if (!items.length) return;

    items.forEach(item => {
      const isFeatured = item.url === featured;
      const isVideo    = item.mediaType === 'video';
      const el = document.createElement('div');
      el.className = `photo-item${isFeatured ? ' is-featured' : ''}`;
      el.innerHTML = `
        ${isVideo
          ? `<video src="${item.url}" muted playsinline class="photo-thumb-video"></video>
             <div class="photo-video-play">▶</div>`
          : `<img src="${item.url}" alt="사진" loading="lazy" />`}
        ${isFeatured ? '<div class="featured-badge">⭐ 대표</div>' : ''}
        <div class="photo-item-actions">
          <button class="photo-action-btn photo-star-btn${isFeatured ? ' starred' : ''}"
            data-url="${item.url}">
            ${isFeatured ? '⭐ 대표' : '☆ 대표로'}
          </button>
          <button class="photo-action-btn photo-del-btn" data-url="${item.url}">🗑️</button>
        </div>
      `;
      // 클릭 → 라이트박스
      const media = el.querySelector(isVideo ? 'video' : 'img');
      media.addEventListener('click', () => openLightbox(item.url, isVideo ? 'video' : 'image'));
      if (isVideo) el.querySelector('.photo-video-play').addEventListener('click', () => openLightbox(item.url, 'video'));
      // 대표 설정
      el.querySelector('.photo-star-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        await api('POST', `/api/photos/${currentDate}/featured`, { url: item.url });
        currentPhotosData.featured = item.url;
        renderPhotos();
        renderFeaturedPreview();
      });
      // 삭제
      el.querySelector('.photo-del-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('삭제할까요?')) return;
        const result = await api('DELETE', `/api/photos/${currentDate}`, { url: item.url });
        currentPhotosData = result.photos;
        renderPhotos();
        renderFeaturedPreview();
      });
      grid.appendChild(el);
    });
  });
}

async function uploadPhoto(file, type) {
  if (!currentUser) return;
  const formData = new FormData();
  formData.append('photo', file);
  const res = await fetch(`/api/photos/${currentDate}/${type}`, {
    method: 'POST', body: formData,
  });
  if (!res.ok) throw new Error('업로드 실패');
  const result = await res.json();
  currentPhotosData = result.photos;
  renderPhotos();
  renderFeaturedPreview();
}

/* 전체 저장 버튼 카운트 업데이트 */
function updateSaveAllBtn() {
  const total = Object.values(pendingPhotos).reduce((s, arr) => s + arr.length, 0);
  const wrap  = document.getElementById('save-all-wrap');
  document.getElementById('save-all-count').textContent = total;
  wrap.classList.toggle('hidden', total === 0);
}

/* 전체 저장 */
async function saveAllPending() {
  const btn = document.getElementById('save-all-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="save-all-icon">⏳</span> 저장 중...';

  for (const type of ['diary', 'exercise', 'food']) {
    const toUpload = [...(pendingPhotos[type] || [])];
    if (!toUpload.length) continue;
    pendingPhotos[type] = [];
    renderPendingPhotos(type);
    for (const item of toUpload) {
      try { await uploadPhoto(item.file, type); } catch { /* 개별 실패 무시 */ }
    }
  }

  btn.disabled = false;
  btn.innerHTML = '<span class="save-all-icon">✅</span> 저장 완료!';
  setTimeout(() => {
    btn.innerHTML = '<span class="save-all-icon">💾</span> 전체 저장 <span class="save-all-badge" id="save-all-count">0</span>';
    updateSaveAllBtn();
  }, 2000);
}

/* 대기 사진 미리보기 렌더 */
function renderPendingPhotos(type) {
  const area = document.querySelector(`.photo-upload-area[data-type="${type}"]`);
  if (!area) return;

  let pendingArea = area.parentElement.querySelector(`.pending-area[data-type="${type}"]`);
  if (!pendingArea) {
    pendingArea = document.createElement('div');
    pendingArea.className = 'pending-area';
    pendingArea.dataset.type = type;
    area.insertAdjacentElement('afterend', pendingArea);
  }

  const files = pendingPhotos[type] || [];
  if (!files.length) { pendingArea.innerHTML = ''; return; }

  pendingArea.innerHTML = `
    <p class="pending-label">📋 저장 대기 중 (${files.length}개) — 아래 저장 버튼을 눌러주세요</p>
    <div class="pending-grid">
      ${files.map((item, i) => `
        <div class="pending-item">
          ${item.mediaType === 'video'
            ? `<video src="${item.preview}" muted playsinline class="pending-video"></video><div class="pending-video-badge">▶</div>`
            : `<img src="${item.preview}" alt="미리보기" />`}
          <button class="pending-del-btn" data-idx="${i}">✕</button>
        </div>
      `).join('')}
    </div>
    <button class="save-pending-btn" data-type="${type}">💾 저장 (${files.length}개)</button>
  `;

  pendingArea.querySelectorAll('.pending-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.idx);
      pendingPhotos[type].splice(i, 1);
      renderPendingPhotos(type);
      updateSaveAllBtn();
    });
  });

  pendingArea.querySelector('.save-pending-btn').addEventListener('click', async (e) => {
    const saveBtn = e.currentTarget;
    saveBtn.disabled = true;
    saveBtn.textContent = '업로드 중...';
    const toUpload = [...pendingPhotos[type]];
    pendingPhotos[type] = [];
    for (const item of toUpload) {
      try { await uploadPhoto(item.file, type); } catch { /* 개별 실패 무시 */ }
    }
    renderPendingPhotos(type);
    updateSaveAllBtn();
  });
}

function initPhotoUploads() {
  document.querySelectorAll('.photo-upload-area').forEach(area => {
    const type  = area.dataset.type;
    const input = area.querySelector('.photo-file-input');

    function stageFiles(files) {
      if (!currentUser) return;
      for (const file of files) {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        if (!isImage && !isVideo) continue;
        if (!pendingPhotos[type]) pendingPhotos[type] = [];
        pendingPhotos[type].push({ file, preview: URL.createObjectURL(file), mediaType: isVideo ? 'video' : 'image' });
      }
      renderPendingPhotos(type);
      updateSaveAllBtn();
    }

    // 파일 선택
    input?.addEventListener('change', () => {
      stageFiles(Array.from(input.files));
      input.value = '';
    });

    // 드래그 앤 드롭
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', e => {
      e.preventDefault();
      area.classList.remove('drag-over');
      if (!currentUser) return;
      stageFiles(Array.from(e.dataTransfer.files));
    });
  });
}

/* ══════════════════════
   라이트박스 (사진 크게 보기)
══════════════════════ */
function openLightbox(src, mediaType = 'image') {
  const lb    = document.getElementById('lightbox');
  const img   = document.getElementById('lightbox-img');
  const video = document.getElementById('lightbox-video');
  if (mediaType === 'video') {
    video.src = src;
    video.classList.remove('hidden');
    img.classList.add('hidden');
    img.src = '';
  } else {
    img.src = src;
    img.classList.remove('hidden');
    video.classList.add('hidden');
    video.pause();
    video.src = '';
  }
  lb.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const video = document.getElementById('lightbox-video');
  video.pause();
  video.src = '';
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}

/* ══════════════════════
   피드백
══════════════════════ */
function showFeedback(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className   = `save-feedback ${type}`;
  setTimeout(() => { el.textContent = ''; el.className = 'save-feedback'; }, 2500);
}

/* ══════════════════════
   F45 자동완성
══════════════════════ */
function initF45Autocomplete() {
  const input    = document.getElementById('ex-program');
  const dropdown = document.getElementById('f45-dropdown');
  const TYPE_COLOR = {
    Cardio:     { bg: '#fff7ed', border: '#fb923c', text: '#ea580c' },
    Resistance: { bg: '#eff6ff', border: '#60a5fa', text: '#1d4ed8' },
    Hybrid:     { bg: '#faf5ff', border: '#c084fc', text: '#7e22ce' },
    Recovery:   { bg: '#f0fdf4', border: '#4ade80', text: '#15803d' },
  };

  function showDropdown(query) {
    const q = query.trim().toLowerCase();
    const matches = q
      ? F45_PROGRAMS.filter(p => p.name.toLowerCase().includes(q))
      : F45_PROGRAMS;

    if (!matches.length) { dropdown.classList.add('hidden'); return; }

    dropdown.innerHTML = '';
    matches.forEach(prog => {
      const c = TYPE_COLOR[prog.type] || {};
      const item = document.createElement('div');
      item.className = 'f45-item';
      item.innerHTML = `
        <span class="f45-item-name">${prog.name}</span>
        <span class="f45-badge" style="background:${c.bg};border-color:${c.border};color:${c.text};">${prog.type}</span>
      `;
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // blur 방지
        input.value = prog.name;
        dropdown.classList.add('hidden');
      });
      dropdown.appendChild(item);
    });
    dropdown.classList.remove('hidden');
  }

  input.addEventListener('focus', () => showDropdown(input.value));
  input.addEventListener('input', () => showDropdown(input.value));
  input.addEventListener('blur',  () => setTimeout(() => dropdown.classList.add('hidden'), 150));

  // 키보드 탐색
  input.addEventListener('keydown', (e) => {
    const items = [...dropdown.querySelectorAll('.f45-item')];
    const active = dropdown.querySelector('.f45-item.active');
    const idx    = items.indexOf(active);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[idx + 1] || items[0];
      if (active) active.classList.remove('active');
      next?.classList.add('active');
      next?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = items[idx - 1] || items[items.length - 1];
      if (active) active.classList.remove('active');
      prev?.classList.add('active');
      prev?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && active) {
      e.preventDefault();
      input.value = active.querySelector('.f45-item-name').textContent;
      dropdown.classList.add('hidden');
    } else if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
    }
  });
}

/* ══════════════════════
   초기화
══════════════════════ */
async function init() {
  document.getElementById('today-label').textContent         = formatLabel(currentDate);
  document.getElementById('exercise-date-label').textContent = formatLabel(currentDate);

  // 탭 전환
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
  });

  // 캘린더
  const now = new Date();
  calYear = now.getFullYear(); calMonth = now.getMonth();
  document.getElementById('cal-prev').addEventListener('click', () => {
    calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar();
  });

  // 감정 버튼
  document.querySelectorAll('.emotion-btn').forEach(btn => {
    btn.addEventListener('click', () => selectEmotion(btn));
  });
  const slider = document.getElementById('intensity-slider');
  slider.addEventListener('input', () => updateSliderUI(slider.value));
  updateSliderUI(slider.value);
  document.getElementById('save-mood-btn').addEventListener('click', saveMood);
  document.getElementById('edit-mood-btn').addEventListener('click', editMood);
  document.getElementById('delete-mood-btn').addEventListener('click', deleteMood);

  // 일기
  document.getElementById('save-diary-btn').addEventListener('click', saveDiary);
  document.getElementById('edit-diary-btn').addEventListener('click', editDiary);
  document.getElementById('delete-diary-btn').addEventListener('click', deleteDiary);

  // 운동
  document.getElementById('save-exercise-btn').addEventListener('click', saveExercise);

  // F45 프로그램 자동완성
  initF45Autocomplete();

  // 내 기록 날짜 보기
  document.getElementById('diary-dates-btn').addEventListener('click', async () => {
    if (!currentUser) { alert('로그인이 필요해요'); return; }
    const btn = document.getElementById('diary-dates-btn');
    btn.textContent = '⏳ 불러오는 중...';
    try {
      const data = await api('GET', '/api/my-dates');
      const list = document.getElementById('diary-dates-list');
      list.innerHTML = '';
      if (!data.dates || data.dates.length === 0) {
        list.innerHTML = '<div class="sh-empty">아직 기록이 없어요</div>';
      } else {
        [...data.dates].reverse().forEach(d => {
          const [y, m, day] = d.split('-');
          const dt = new Date(Number(y), Number(m)-1, Number(day));
          const days = ['일','월','화','수','목','금','토'];
          const item = document.createElement('button');
          item.className = 'sh-date-item';
          item.textContent = `${y}년 ${Number(m)}월 ${Number(day)}일 (${days[dt.getDay()]})`;
          item.addEventListener('click', () => {
            calYear = Number(y); calMonth = Number(m) - 1;
            setCurrentDate(d);
            renderCalendar();
            document.getElementById('diary-dates-modal').classList.add('hidden');
          });
          list.appendChild(item);
        });
      }
      document.getElementById('diary-dates-modal').classList.remove('hidden');
    } catch { alert('기록을 불러오는 중 오류가 발생했어요'); }
    btn.textContent = '📋 기록 날짜';
  });
  document.getElementById('diary-dates-modal-close').addEventListener('click', () => {
    document.getElementById('diary-dates-modal').classList.add('hidden');
  });
  document.getElementById('diary-dates-modal-overlay').addEventListener('click', () => {
    document.getElementById('diary-dates-modal').classList.add('hidden');
  });

  // 삼성헬스 날짜 목록 보기
  document.getElementById('samsung-health-dates-btn').addEventListener('click', () => {
    document.getElementById('samsung-health-dates-file').click();
  });
  document.getElementById('samsung-health-dates-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const btn = document.getElementById('samsung-health-dates-btn');
    btn.textContent = '⏳ 분석 중...';
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/import/samsung-health/dates', { method: 'POST', body: formData });
      const data = await res.json();
      const list = document.getElementById('sh-date-list');
      list.innerHTML = '';
      if (!data.dates || data.dates.length === 0) {
        list.innerHTML = '<div class="sh-empty">운동 기록이 없어요</div>';
      } else {
        data.dates.reverse().forEach(d => {
          const [y, m, day] = d.split('-');
          const dt = new Date(Number(y), Number(m)-1, Number(day));
          const days = ['일','월','화','수','목','금','토'];
          const btn = document.createElement('button');
          btn.className = 'sh-date-item';
          btn.textContent = `${y}년 ${Number(m)}월 ${Number(day)}일 (${days[dt.getDay()]})`;
          btn.addEventListener('click', () => {
            currentDate = d;
            calYear = Number(y);
            calMonth = Number(m) - 1;
            renderCalendar();
            loadDayData(d);
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
            document.querySelector('[data-tab="exercise"]').classList.add('active');
            document.getElementById('tab-exercise').classList.remove('hidden');
            document.getElementById('sh-modal').classList.add('hidden');
          });
          list.appendChild(btn);
        });
      }
      document.getElementById('sh-modal').classList.remove('hidden');
    } catch {
      alert('파일 처리 중 오류가 발생했어요');
    }
    btn.textContent = '📋 운동 날짜 보기';
    e.target.value = '';
  });
  document.getElementById('sh-modal-close').addEventListener('click', () => {
    document.getElementById('sh-modal').classList.add('hidden');
  });
  document.getElementById('sh-modal-overlay').addEventListener('click', () => {
    document.getElementById('sh-modal').classList.add('hidden');
  });

  // 삼성헬스 가져오기
  document.getElementById('samsung-health-btn').addEventListener('click', () => {
    document.getElementById('samsung-health-file').click();
  });
  document.getElementById('samsung-health-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const feedback = document.getElementById('import-feedback');
    feedback.textContent = '⏳ 불러오는 중...';
    feedback.style.color = '#888';
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/import/samsung-health?date=${currentDate}`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (data.found) {
        document.getElementById('ex-maxhr').value = data.maxHR;
        document.getElementById('ex-avghr').value = data.avgHR;
        feedback.textContent = `✅ 최대 ${data.maxHR}bpm · 평균 ${data.avgHR}bpm 자동 입력됐어요`;
        feedback.style.color = '#16a34a';
      } else {
        feedback.textContent = '❌ ' + data.message;
        feedback.style.color = '#dc2626';
      }
    } catch {
      feedback.textContent = '❌ 파일 처리 중 오류가 발생했어요';
      feedback.style.color = '#dc2626';
    }
    e.target.value = '';
  });
  document.getElementById('edit-exercise-btn').addEventListener('click', editExercise);
  document.getElementById('delete-exercise-btn').addEventListener('click', deleteExercise);

  // 식단
  document.querySelectorAll('.meal-card').forEach(card => {
    const meal = card.dataset.meal;
    card.querySelector('.add-btn').addEventListener('click', () => addFood(meal));
    card.querySelectorAll('input').forEach(input => {
      input.addEventListener('keydown', e => { if (e.key === 'Enter') addFood(meal); });
    });
    card.querySelector('.food-list').addEventListener('click', e => {
      const delBtn = e.target.closest('.food-del');
      if (delBtn) { deleteFood(delBtn.dataset.meal, Number(delBtn.dataset.idx)); return; }
      const editBtn = e.target.closest('.food-edit');
      if (editBtn) { editFoodItem(editBtn.dataset.meal, Number(editBtn.dataset.idx)); }
    });
  });

  initPhotoUploads();
  document.getElementById('save-all-btn').addEventListener('click', saveAllPending);

  // 라이트박스 닫기
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-overlay').addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  await checkLogin();
  await renderCalendar();
  await loadDateData();
}

init();
