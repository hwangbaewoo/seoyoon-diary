let currentCategory = 'n0100';

async function loadCategories() {
  const nav = document.getElementById('category-nav');
  try {
    const res = await fetch('/api/categories');
    const categories = await res.json();

    categories.forEach(({ id, name }) => {
      const btn = document.createElement('button');
      btn.className = 'category-btn' + (id === currentCategory ? ' active' : '');
      btn.textContent = name;
      btn.dataset.id = id;
      btn.addEventListener('click', () => selectCategory(id));
      nav.appendChild(btn);
    });
  } catch {
    nav.textContent = '카테고리를 불러오지 못했습니다.';
  }
}

function selectCategory(id) {
  if (id === currentCategory) return;
  currentCategory = id;

  document.querySelectorAll('.category-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.id === id);
  });

  loadNews(id);
}

async function loadNews(category) {
  const container = document.getElementById('news-list');
  container.innerHTML = '<div class="loading"><div class="spinner"></div>뉴스를 불러오는 중...</div>';

  try {
    const res = await fetch(`/api/news?category=${category}`);
    if (!res.ok) throw new Error('서버 오류');
    const items = await res.json();

    if (!items.length) {
      container.innerHTML = '<div class="loading">뉴스가 없습니다.</div>';
      return;
    }

    container.innerHTML = '';
    items.forEach((item) => {
      const card = document.createElement('a');
      card.className = 'news-card';
      card.href = item.link;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';

      const date = item.pubDate ? formatDate(item.pubDate) : '';

      card.innerHTML = `
        <div class="news-title">${escapeHtml(item.title)}</div>
        ${item.summary ? `<div class="news-summary">${escapeHtml(item.summary)}</div>` : ''}
        <div class="news-meta">
          ${item.source ? `<span class="news-source">${escapeHtml(item.source)}</span>` : ''}
          ${date ? `<span>${date}</span>` : ''}
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div class="error-msg">뉴스를 불러오는 데 실패했습니다.<br>${err.message}</div>`;
  }
}

function formatDate(dateStr) {
  // Nate format: "05-12 15:26"
  return dateStr || '';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

(async () => {
  await loadCategories();
  await loadNews(currentCategory);
})();
