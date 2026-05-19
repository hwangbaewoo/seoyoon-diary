# 네이트 뉴스 뷰어

네이트 뉴스를 카테고리별로 조회하는 웹 앱입니다.

## 로컬 실행

```bash
npm install
npm start
```

브라우저에서 http://localhost:3000 접속

개발 모드 (파일 변경 시 자동 재시작):
```bash
npm run dev
```

## API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/categories` | 카테고리 목록 |
| GET | `/api/news?category={id}` | 카테고리별 뉴스 |

카테고리 ID: `n0100` 전체, `n0101` 정치, `n0102` 경제, `n0103` 사회, `n0104` 세계, `n0105` IT/과학, `n0106` 스포츠, `n0107` 연예

## Railway 배포

1. [railway.app](https://railway.app) 가입 후 GitHub 로그인
2. New Project → Deploy from GitHub repo → 이 저장소 선택
3. 자동 빌드 및 배포 완료 (약 2~3분)
4. Settings → Networking → Generate Domain 클릭

## 기술 스택

- Node.js 18+, Express 4
- Cheerio (HTML 파싱), node-fetch, iconv-lite (EUC-KR 인코딩)
