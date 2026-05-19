const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const path = require('path');

const app = express();

const CATEGORIES = {
  n0100: '전체',
  n0101: '정치',
  n0102: '경제',
  n0103: '사회',
  n0104: '세계',
  n0105: 'IT/과학',
  n0106: '스포츠',
  n0107: '연예',
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/news', async (req, res) => {
  const category = req.query.category || 'n0100';

  if (!CATEGORIES[category]) {
    return res.status(400).json({ error: '유효하지 않은 카테고리입니다.' });
  }

  try {
    const url = `https://news.nate.com/recent?mid=${category}&type=c`;
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      timeout: 8000,
    });

    const buffer = await response.buffer();
    const html = iconv.decode(buffer, 'euc-kr');
    const $ = cheerio.load(html);

    const items = [];

    $('.mlt01').each((_, el) => {
      const linkEl = $(el).find('a.lt1');
      const href = linkEl.attr('href') || '';
      const link = href.startsWith('//') ? 'https:' + href : href;
      const title = $(el).find('h2.tit').text().trim();
      const summary = $(el).find('span.tb').clone().find('h2').remove().end().text().trim();
      const mediumEl = $(el).find('span.medium');
      const source = mediumEl.clone().find('em').remove().end().text().trim();
      const pubDate = mediumEl.find('em').text().trim();

      if (title && link) {
        items.push({ title, link, summary, source, pubDate });
      }
    });

    res.json(items);
  } catch (err) {
    console.error('스크래핑 오류:', err.message);
    res.status(500).json({ error: '뉴스를 불러오는 데 실패했습니다.' });
  }
});

app.get('/api/categories', (req, res) => {
  const list = Object.entries(CATEGORIES).map(([id, name]) => ({ id, name }));
  res.json(list);
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
  });
}

module.exports = app;
