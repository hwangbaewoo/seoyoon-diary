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

/* ── 한국 음식 칼로리 DB ── */
const FOOD_DB = [
  // 밥류
  { name: '흰밥 (1공기)', kcal: 300 },
  { name: '현미밥 (1공기)', kcal: 280 },
  { name: '잡곡밥 (1공기)', kcal: 290 },
  { name: '비빔밥', kcal: 550 },
  { name: '김밥 (1줄)', kcal: 350 },
  { name: '유부초밥 (6개)', kcal: 330 },
  { name: '볶음밥', kcal: 450 },
  { name: '오므라이스', kcal: 500 },
  { name: '김치볶음밥', kcal: 420 },
  { name: '덮밥', kcal: 550 },
  { name: '쌈밥', kcal: 380 },
  // 찌개·국
  { name: '된장찌개', kcal: 150 },
  { name: '김치찌개', kcal: 200 },
  { name: '순두부찌개', kcal: 180 },
  { name: '부대찌개', kcal: 350 },
  { name: '갈비탕', kcal: 380 },
  { name: '설렁탕', kcal: 300 },
  { name: '미역국', kcal: 80 },
  { name: '사골국', kcal: 150 },
  { name: '삼계탕', kcal: 550 },
  { name: '해장국', kcal: 250 },
  { name: '육개장', kcal: 220 },
  { name: '동태찌개', kcal: 180 },
  { name: '콩나물국', kcal: 60 },
  // 고기류
  { name: '삼겹살 (1인분)', kcal: 700 },
  { name: '목살 (1인분)', kcal: 600 },
  { name: '갈비 (1인분)', kcal: 650 },
  { name: '불고기 (1인분)', kcal: 400 },
  { name: '제육볶음', kcal: 450 },
  { name: '닭갈비', kcal: 380 },
  { name: '치킨 (1/4마리)', kcal: 400 },
  { name: '프라이드치킨 (2조각)', kcal: 500 },
  { name: '양념치킨 (2조각)', kcal: 550 },
  { name: '닭볶음탕', kcal: 350 },
  { name: '떡갈비 (1인분)', kcal: 420 },
  { name: '소갈비찜', kcal: 580 },
  { name: '보쌈 (1인분)', kcal: 450 },
  { name: '족발 (1인분)', kcal: 500 },
  { name: '오리구이 (1인분)', kcal: 480 },
  // 면류
  { name: '라면 (1봉)', kcal: 500 },
  { name: '짜장면', kcal: 680 },
  { name: '짬뽕', kcal: 580 },
  { name: '냉면', kcal: 480 },
  { name: '칼국수', kcal: 520 },
  { name: '쌀국수', kcal: 450 },
  { name: '파스타', kcal: 550 },
  { name: '스파게티', kcal: 600 },
  { name: '우동', kcal: 400 },
  { name: '소바', kcal: 320 },
  { name: '막국수', kcal: 400 },
  { name: '수제비', kcal: 430 },
  // 분식
  { name: '떡볶이', kcal: 430 },
  { name: '순대', kcal: 350 },
  { name: '어묵', kcal: 150 },
  { name: '튀김 (모듬)', kcal: 400 },
  { name: '만두 (6개)', kcal: 350 },
  { name: '핫도그', kcal: 280 },
  { name: '토스트', kcal: 300 },
  { name: '샌드위치', kcal: 350 },
  { name: '김치전', kcal: 350 },
  { name: '파전', kcal: 380 },
  { name: '빈대떡', kcal: 420 },
  // 패스트푸드
  { name: '햄버거', kcal: 500 },
  { name: '빅맥', kcal: 550 },
  { name: '치즈버거', kcal: 480 },
  { name: '피자 (1조각)', kcal: 300 },
  { name: '감자튀김 (M)', kcal: 340 },
  { name: '핫윙 (6개)', kcal: 350 },
  { name: '너겟 (6개)', kcal: 280 },
  { name: '콜라 (355ml)', kcal: 150 },
  // 일식
  { name: '초밥 (1개)', kcal: 55 },
  { name: '초밥 (1인분 8pc)', kcal: 440 },
  { name: '돈까스', kcal: 650 },
  { name: '회 (1인분)', kcal: 200 },
  { name: '오니기리 (1개)', kcal: 180 },
  { name: '라멘', kcal: 550 },
  // 중식
  { name: '탕수육 (소)', kcal: 600 },
  { name: '마파두부', kcal: 280 },
  { name: '깐풍기', kcal: 550 },
  { name: '볶음밥 (중식)', kcal: 500 },
  // 채소·반찬
  { name: '샐러드 (그린)', kcal: 80 },
  { name: '시저샐러드', kcal: 250 },
  { name: '콥샐러드', kcal: 400 },
  { name: '나물 반찬', kcal: 80 },
  { name: '김치', kcal: 20 },
  { name: '깍두기', kcal: 25 },
  { name: '시금치나물', kcal: 60 },
  { name: '콩나물무침', kcal: 50 },
  { name: '두부조림', kcal: 150 },
  { name: '계란말이', kcal: 160 },
  { name: '잡채', kcal: 300 },
  // 계란·유제품
  { name: '계란 (1개)', kcal: 80 },
  { name: '계란 프라이 (1개)', kcal: 100 },
  { name: '계란찜', kcal: 120 },
  { name: '우유 (200ml)', kcal: 130 },
  { name: '두유 (200ml)', kcal: 100 },
  { name: '요거트 (100g)', kcal: 100 },
  { name: '그릭요거트 (100g)', kcal: 130 },
  { name: '치즈 (1장)', kcal: 60 },
  // 빵·간식
  { name: '식빵 (2장)', kcal: 160 },
  { name: '크로아상', kcal: 230 },
  { name: '베이글', kcal: 270 },
  { name: '머핀', kcal: 350 },
  { name: '도넛', kcal: 250 },
  { name: '케이크 (1조각)', kcal: 400 },
  { name: '마카롱 (1개)', kcal: 100 },
  { name: '쿠키 (1개)', kcal: 80 },
  { name: '초콜릿 (30g)', kcal: 160 },
  { name: '과자 (30g)', kcal: 150 },
  { name: '팝콘 (1컵)', kcal: 120 },
  { name: '아이스크림 (1개)', kcal: 200 },
  { name: '빙수', kcal: 300 },
  { name: '호떡', kcal: 230 },
  { name: '붕어빵 (1개)', kcal: 130 },
  // 과일
  { name: '사과 (1개)', kcal: 80 },
  { name: '바나나 (1개)', kcal: 90 },
  { name: '오렌지 (1개)', kcal: 60 },
  { name: '딸기 (10개)', kcal: 40 },
  { name: '포도 (1송이)', kcal: 100 },
  { name: '수박 (1쪽)', kcal: 60 },
  { name: '복숭아 (1개)', kcal: 50 },
  { name: '방울토마토 (10개)', kcal: 30 },
  { name: '키위 (1개)', kcal: 50 },
  { name: '망고 (1/2개)', kcal: 100 },
  { name: '블루베리 (1컵)', kcal: 85 },
  // 음료
  { name: '아메리카노', kcal: 10 },
  { name: '카페라떼', kcal: 120 },
  { name: '카푸치노', kcal: 100 },
  { name: '바닐라라떼', kcal: 250 },
  { name: '녹차', kcal: 5 },
  { name: '오렌지주스 (200ml)', kcal: 90 },
  { name: '이온음료 (500ml)', kcal: 130 },
  { name: '에너지드링크 (250ml)', kcal: 110 },
  { name: '맥주 (500ml)', kcal: 210 },
  { name: '소주 (1잔 50ml)', kcal: 65 },
  { name: '막걸리 (1잔)', kcal: 100 },
  { name: '와인 (1잔 150ml)', kcal: 120 },
  // 단백질 보충
  { name: '프로틴바', kcal: 200 },
  { name: '프로틴 쉐이크', kcal: 150 },
  { name: '에너지바', kcal: 250 },
  { name: '견과류 (30g)', kcal: 180 },
  { name: '아몬드 (10개)', kcal: 70 },
];

/* ── 한국 프랜차이즈 메뉴 DB ── */
const FRANCHISE_DB = [
  // ── 프레퍼스 ──
  { brand: '프레퍼스', menu: '포크 플레이트', kcal: 244, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '비프 플레이트', kcal: 385, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '치킨 샐러드 파스타', kcal: 410, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '치킨 로제 샐러드 파스타', kcal: 421, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '포크 샐러드 파스타', kcal: 437, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '포크 로제 샐러드 파스타', kcal: 448, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '치킨 데리야끼 덮밥', kcal: 492, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '포크 명이나물 덮밥', kcal: 526, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '비프 샐러드 파스타', kcal: 578, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '비프 로제 샐러드 파스타', kcal: 589, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '치킨 커리 덮밥', kcal: 591, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '비프 와사비 덮밥', kcal: 612, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '더블 치킨 데리야끼 덮밥', kcal: 613, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '포크 커리 덮밥', kcal: 622, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '더블 포크 명이나물 덮밥', kcal: 662, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '비프 커리 덮밥', kcal: 731, note: '1인분 기준' },
  { brand: '프레퍼스', menu: '비프 청양 들기름 파스타', kcal: 745, note: '1인분 기준' },

  // ── 맥도날드 ──
  { brand: '맥도날드', menu: '빅맥', kcal: 530, note: '1개 기준' },
  { brand: '맥도날드', menu: '쿼터파운더치즈', kcal: 510, note: '1개 기준' },
  { brand: '맥도날드', menu: '맥스파이시상하이버거', kcal: 490, note: '1개 기준' },
  { brand: '맥도날드', menu: '불고기버거', kcal: 365, note: '1개 기준' },
  { brand: '맥도날드', menu: '더블불고기버거', kcal: 530, note: '1개 기준' },
  { brand: '맥도날드', menu: '에그맥머핀', kcal: 300, note: '1개 기준' },
  { brand: '맥도날드', menu: '해시브라운', kcal: 150, note: '1개 기준' },
  { brand: '맥도날드', menu: '감자튀김 S', kcal: 230, note: '1개 기준' },
  { brand: '맥도날드', menu: '감자튀김 M', kcal: 320, note: '1개 기준' },
  { brand: '맥도날드', menu: '감자튀김 L', kcal: 440, note: '1개 기준' },
  { brand: '맥도날드', menu: '맥너겟 6조각', kcal: 280, note: '6조각 기준' },
  { brand: '맥도날드', menu: '맥너겟 9조각', kcal: 420, note: '9조각 기준' },
  { brand: '맥도날드', menu: '소프트콘', kcal: 100, note: '1개 기준' },
  { brand: '맥도날드', menu: '맥플러리', kcal: 330, note: '1개 기준' },

  // ── 버거킹 ──
  { brand: '버거킹', menu: '와퍼', kcal: 660, note: '1개 기준' },
  { brand: '버거킹', menu: '더블와퍼', kcal: 900, note: '1개 기준' },
  { brand: '버거킹', menu: '와퍼주니어', kcal: 360, note: '1개 기준' },
  { brand: '버거킹', menu: '불고기와퍼', kcal: 570, note: '1개 기준' },
  { brand: '버거킹', menu: '치킨버거', kcal: 450, note: '1개 기준' },
  { brand: '버거킹', menu: '크런치버거', kcal: 480, note: '1개 기준' },
  { brand: '버거킹', menu: '감자튀김 M', kcal: 340, note: '1개 기준' },

  // ── KFC ──
  { brand: 'KFC', menu: '오리지날치킨 1조각', kcal: 290, note: '1조각 기준' },
  { brand: 'KFC', menu: '핫크리스피 1조각', kcal: 310, note: '1조각 기준' },
  { brand: 'KFC', menu: '징거버거', kcal: 510, note: '1개 기준' },
  { brand: 'KFC', menu: '타워버거', kcal: 640, note: '1개 기준' },
  { brand: 'KFC', menu: '치킨랩', kcal: 380, note: '1개 기준' },
  { brand: 'KFC', menu: '코울슬로', kcal: 140, note: '1개 기준' },
  { brand: 'KFC', menu: '너겟 5조각', kcal: 220, note: '5조각 기준' },

  // ── 롯데리아 ──
  { brand: '롯데리아', menu: '롯데리아버거', kcal: 500, note: '1개 기준' },
  { brand: '롯데리아', menu: '데리버거', kcal: 480, note: '1개 기준' },
  { brand: '롯데리아', menu: '새우버거', kcal: 500, note: '1개 기준' },
  { brand: '롯데리아', menu: '불고기버거', kcal: 430, note: '1개 기준' },
  { brand: '롯데리아', menu: '모짜렐라인더버거', kcal: 600, note: '1개 기준' },
  { brand: '롯데리아', menu: '감자튀김', kcal: 280, note: '1개 기준' },

  // ── 맘스터치 ──
  { brand: '맘스터치', menu: '싸이버거', kcal: 520, note: '1개 기준' },
  { brand: '맘스터치', menu: '불싸이버거', kcal: 540, note: '1개 기준' },
  { brand: '맘스터치', menu: '망고싸이버거', kcal: 580, note: '1개 기준' },
  { brand: '맘스터치', menu: '싸이순살', kcal: 380, note: '1개 기준' },
  { brand: '맘스터치', menu: '치킨랩', kcal: 400, note: '1개 기준' },

  // ── 노브랜드버거 ──
  { brand: '노브랜드버거', menu: '시그니처버거', kcal: 510, note: '1개 기준' },
  { brand: '노브랜드버거', menu: '더블시그니처버거', kcal: 720, note: '1개 기준' },
  { brand: '노브랜드버거', menu: '치킨버거', kcal: 460, note: '1개 기준' },
  { brand: '노브랜드버거', menu: '슈림프버거', kcal: 440, note: '1개 기준' },

  // ── 파파이스 ──
  { brand: '파파이스', menu: '클래식치킨샌드위치', kcal: 570, note: '1개 기준' },
  { brand: '파파이스', menu: '스파이시치킨샌드위치', kcal: 580, note: '1개 기준' },
  { brand: '파파이스', menu: '치킨스트립 3조각', kcal: 340, note: '3조각 기준' },

  // ── 교촌치킨 ──
  { brand: '교촌치킨', menu: '교촌오리지날 반마리', kcal: 800, note: '반마리 기준' },
  { brand: '교촌치킨', menu: '허니오리지날 반마리', kcal: 850, note: '반마리 기준' },
  { brand: '교촌치킨', menu: '허니콤보 반마리', kcal: 900, note: '반마리 기준' },
  { brand: '교촌치킨', menu: '레드오리지날 반마리', kcal: 820, note: '반마리 기준' },
  { brand: '교촌치킨', menu: '교촌오리지날 한마리', kcal: 1600, note: '한마리 기준' },
  { brand: '교촌치킨', menu: '허니콤보 한마리', kcal: 1800, note: '한마리 기준' },

  // ── BBQ ──
  { brand: 'BBQ', menu: '황금올리브치킨 반마리', kcal: 850, note: '반마리 기준' },
  { brand: 'BBQ', menu: '자메이카통다리구이 반마리', kcal: 700, note: '반마리 기준' },
  { brand: 'BBQ', menu: 'BBQ순살 반마리', kcal: 750, note: '반마리 기준' },
  { brand: 'BBQ', menu: '황금올리브치킨 한마리', kcal: 1700, note: '한마리 기준' },
  { brand: 'BBQ', menu: 'BBQ윙 10개', kcal: 550, note: '10개 기준' },

  // ── BHC ──
  { brand: 'BHC', menu: '뿌링클 반마리', kcal: 830, note: '반마리 기준' },
  { brand: 'BHC', menu: '맛초킹 반마리', kcal: 800, note: '반마리 기준' },
  { brand: 'BHC', menu: '골드킹 반마리', kcal: 820, note: '반마리 기준' },
  { brand: 'BHC', menu: '포테킹 반마리', kcal: 870, note: '반마리 기준' },
  { brand: 'BHC', menu: '뿌링클 한마리', kcal: 1660, note: '한마리 기준' },

  // ── 굽네치킨 ──
  { brand: '굽네치킨', menu: '굽네오리지날 반마리', kcal: 680, note: '반마리 기준' },
  { brand: '굽네치킨', menu: '볼케이노 반마리', kcal: 700, note: '반마리 기준' },
  { brand: '굽네치킨', menu: '고추바사삭 반마리', kcal: 720, note: '반마리 기준' },
  { brand: '굽네치킨', menu: '굽네오리지날 한마리', kcal: 1360, note: '한마리 기준' },

  // ── 네네치킨 ──
  { brand: '네네치킨', menu: '네네후라이드 반마리', kcal: 720, note: '반마리 기준' },
  { brand: '네네치킨', menu: '네네양념 반마리', kcal: 800, note: '반마리 기준' },
  { brand: '네네치킨', menu: '닭다리살스테이크 반마리', kcal: 680, note: '반마리 기준' },

  // ── 60계치킨 ──
  { brand: '60계치킨', menu: '60계오리지날 반마리', kcal: 750, note: '반마리 기준' },
  { brand: '60계치킨', menu: '60계양념 반마리', kcal: 820, note: '반마리 기준' },
  { brand: '60계치킨', menu: '마늘간장 반마리', kcal: 790, note: '반마리 기준' },

  // ── 지코바 ──
  { brand: '지코바', menu: '지코바오리지날 반마리', kcal: 700, note: '반마리 기준' },
  { brand: '지코바', menu: '파닭 반마리', kcal: 750, note: '반마리 기준' },
  { brand: '지코바', menu: '간장치킨 반마리', kcal: 730, note: '반마리 기준' },

  // ── 처갓집 ──
  { brand: '처갓집', menu: '처갓집양념치킨 반마리', kcal: 780, note: '반마리 기준' },
  { brand: '처갓집', menu: '처갓집후라이드 반마리', kcal: 720, note: '반마리 기준' },

  // ── 스타벅스 ──
  { brand: '스타벅스', menu: '아메리카노 Tall', kcal: 10, note: 'Tall(355ml)' },
  { brand: '스타벅스', menu: '아메리카노 Grande', kcal: 15, note: 'Grande(473ml)' },
  { brand: '스타벅스', menu: '카페라떼 Tall', kcal: 150, note: 'Tall(355ml)' },
  { brand: '스타벅스', menu: '바닐라라떼 Tall', kcal: 280, note: 'Tall(355ml)' },
  { brand: '스타벅스', menu: '카라멜마끼아또 Tall', kcal: 250, note: 'Tall(355ml)' },
  { brand: '스타벅스', menu: '카라멜프라푸치노 Tall', kcal: 380, note: 'Tall(355ml)' },
  { brand: '스타벅스', menu: '그린티프라푸치노 Tall', kcal: 330, note: 'Tall(355ml)' },
  { brand: '스타벅스', menu: '초콜릿크림프라푸치노 Tall', kcal: 400, note: 'Tall(355ml)' },
  { brand: '스타벅스', menu: '딸기아사이리프레셔 Tall', kcal: 130, note: 'Tall(355ml)' },
  { brand: '스타벅스', menu: '자몽허니블랙티 Tall', kcal: 150, note: 'Tall(355ml)' },
  { brand: '스타벅스', menu: '스타벅스라떼 Tall', kcal: 200, note: 'Tall(355ml)' },

  // ── 투썸플레이스 ──
  { brand: '투썸플레이스', menu: '아메리카노', kcal: 10, note: '1잔 기준' },
  { brand: '투썸플레이스', menu: '카페라떼', kcal: 160, note: '1잔 기준' },
  { brand: '투썸플레이스', menu: '바닐라라떼', kcal: 290, note: '1잔 기준' },
  { brand: '투썸플레이스', menu: '스트로베리초콜렛생크림케이크', kcal: 450, note: '1조각 기준' },
  { brand: '투썸플레이스', menu: '티라미수케이크', kcal: 420, note: '1조각 기준' },
  { brand: '투썸플레이스', menu: '아이스초콜릿', kcal: 340, note: '1잔 기준' },

  // ── 할리스 ──
  { brand: '할리스', menu: '아메리카노', kcal: 10, note: '1잔 기준' },
  { brand: '할리스', menu: '카페라떼', kcal: 150, note: '1잔 기준' },
  { brand: '할리스', menu: '아이스블렌디드', kcal: 380, note: '1잔 기준' },
  { brand: '할리스', menu: '바닐라라떼', kcal: 270, note: '1잔 기준' },

  // ── 이디야 ──
  { brand: '이디야', menu: '아메리카노', kcal: 10, note: '1잔 기준' },
  { brand: '이디야', menu: '카페라떼', kcal: 140, note: '1잔 기준' },
  { brand: '이디야', menu: '바닐라라떼', kcal: 260, note: '1잔 기준' },
  { brand: '이디야', menu: '블렌디드', kcal: 320, note: '1잔 기준' },
  { brand: '이디야', menu: '레몬에이드', kcal: 180, note: '1잔 기준' },

  // ── 빽다방 ──
  { brand: '빽다방', menu: '빽아메리카노', kcal: 10, note: '1잔 기준' },
  { brand: '빽다방', menu: '빽라떼', kcal: 210, note: '1잔 기준' },
  { brand: '빽다방', menu: '오리지날커피', kcal: 250, note: '1잔 기준' },
  { brand: '빽다방', menu: '달달크림커피', kcal: 350, note: '1잔 기준' },
  { brand: '빽다방', menu: '딸기라떼', kcal: 300, note: '1잔 기준' },

  // ── 메가커피 ──
  { brand: '메가커피', menu: '아메리카노', kcal: 10, note: '1잔 기준' },
  { brand: '메가커피', menu: '카페라떼', kcal: 180, note: '1잔 기준' },
  { brand: '메가커피', menu: '바닐라라떼', kcal: 280, note: '1잔 기준' },
  { brand: '메가커피', menu: '크림라떼', kcal: 350, note: '1잔 기준' },
  { brand: '메가커피', menu: '메가밀크티', kcal: 300, note: '1잔 기준' },

  // ── 컴포즈커피 ──
  { brand: '컴포즈커피', menu: '아메리카노', kcal: 10, note: '1잔 기준' },
  { brand: '컴포즈커피', menu: '카페라떼', kcal: 160, note: '1잔 기준' },
  { brand: '컴포즈커피', menu: '달콤라떼', kcal: 270, note: '1잔 기준' },
  { brand: '컴포즈커피', menu: '딸기라떼', kcal: 290, note: '1잔 기준' },

  // ── 도미노피자 ──
  { brand: '도미노피자', menu: '슈퍼시드뱅뱅 1조각', kcal: 200, note: '1조각(8등분) 기준' },
  { brand: '도미노피자', menu: '페퍼로니 1조각', kcal: 220, note: '1조각(8등분) 기준' },
  { brand: '도미노피자', menu: '갈릭치킨 1조각', kcal: 230, note: '1조각(8등분) 기준' },
  { brand: '도미노피자', menu: '쉬림프크리미파스타 1조각', kcal: 240, note: '1조각(8등분) 기준' },
  { brand: '도미노피자', menu: '포테이토 1조각', kcal: 210, note: '1조각(8등분) 기준' },
  { brand: '도미노피자', menu: '치킨테이스터 1조각', kcal: 215, note: '1조각(8등분) 기준' },

  // ── 피자헛 ──
  { brand: '피자헛', menu: '더블크러스트 슈퍼슈프림 1조각', kcal: 280, note: '1조각(8등분) 기준' },
  { brand: '피자헛', menu: '씬앤크리스피 슈퍼슈프림 1조각', kcal: 220, note: '1조각(8등분) 기준' },
  { brand: '피자헛', menu: '치즈크러스트 1조각', kcal: 270, note: '1조각(8등분) 기준' },
  { brand: '피자헛', menu: '핫도그크러스트 1조각', kcal: 290, note: '1조각(8등분) 기준' },

  // ── 파파존스 ──
  { brand: '파파존스', menu: '클래식토마토 1조각', kcal: 200, note: '1조각(8등분) 기준' },
  { brand: '파파존스', menu: '가든파티 1조각', kcal: 190, note: '1조각(8등분) 기준' },
  { brand: '파파존스', menu: '수퍼파파 1조각', kcal: 240, note: '1조각(8등분) 기준' },
  { brand: '파파존스', menu: '치킨바베큐 1조각', kcal: 230, note: '1조각(8등분) 기준' },

  // ── 서브웨이 ──
  { brand: '서브웨이', menu: '이탈리안BMT 15cm', kcal: 380, note: '15cm 기준' },
  { brand: '서브웨이', menu: '터키베이컨아보카도 15cm', kcal: 360, note: '15cm 기준' },
  { brand: '서브웨이', menu: '에그마요 15cm', kcal: 350, note: '15cm 기준' },
  { brand: '서브웨이', menu: '참치 15cm', kcal: 420, note: '15cm 기준' },
  { brand: '서브웨이', menu: '스테이크&치즈 15cm', kcal: 400, note: '15cm 기준' },
  { brand: '서브웨이', menu: '로스트치킨 15cm', kcal: 310, note: '15cm 기준' },
  { brand: '서브웨이', menu: '베지 15cm', kcal: 270, note: '15cm 기준' },
  { brand: '서브웨이', menu: '이탈리안BMT 30cm', kcal: 760, note: '30cm 기준' },
  { brand: '서브웨이', menu: '참치 30cm', kcal: 840, note: '30cm 기준' },

  // ── 본죽 ──
  { brand: '본죽', menu: '전복죽', kcal: 270, note: '1인분 기준' },
  { brand: '본죽', menu: '야채죽', kcal: 220, note: '1인분 기준' },
  { brand: '본죽', menu: '흑임자죽', kcal: 280, note: '1인분 기준' },
  { brand: '본죽', menu: '쇠고기죽', kcal: 290, note: '1인분 기준' },
  { brand: '본죽', menu: '버섯들깨죽', kcal: 240, note: '1인분 기준' },
  { brand: '본죽', menu: '닭죽', kcal: 260, note: '1인분 기준' },
  { brand: '본죽', menu: '참치마요죽', kcal: 300, note: '1인분 기준' },

  // ── 파리바게뜨 ──
  { brand: '파리바게뜨', menu: '소금빵', kcal: 230, note: '1개 기준' },
  { brand: '파리바게뜨', menu: '크루아상', kcal: 280, note: '1개 기준' },
  { brand: '파리바게뜨', menu: '생크림케이크 1조각', kcal: 380, note: '1조각 기준' },
  { brand: '파리바게뜨', menu: '부드러운식빵 2장', kcal: 160, note: '2장 기준' },
  { brand: '파리바게뜨', menu: '단팥빵', kcal: 260, note: '1개 기준' },
  { brand: '파리바게뜨', menu: '초코크루아상', kcal: 310, note: '1개 기준' },

  // ── 뚜레쥬르 ──
  { brand: '뚜레쥬르', menu: '크루아상', kcal: 270, note: '1개 기준' },
  { brand: '뚜레쥬르', menu: '생크림케이크 1조각', kcal: 360, note: '1조각 기준' },
  { brand: '뚜레쥬르', menu: '초코케이크 1조각', kcal: 380, note: '1조각 기준' },
  { brand: '뚜레쥬르', menu: '단팥빵', kcal: 250, note: '1개 기준' },
  { brand: '뚜레쥬르', menu: '소금빵', kcal: 220, note: '1개 기준' },

  // ── 배스킨라빈스 ──
  { brand: '배스킨라빈스', menu: '싱글컵/콘', kcal: 150, note: '1스쿱 기준' },
  { brand: '배스킨라빈스', menu: '더블컵/콘', kcal: 300, note: '2스쿱 기준' },
  { brand: '배스킨라빈스', menu: '트리플컵/콘', kcal: 450, note: '3스쿱 기준' },
  { brand: '배스킨라빈스', menu: '쿼터 케이크', kcal: 600, note: '4인분 기준' },
  { brand: '배스킨라빈스', menu: '아이스크림케이크 1조각', kcal: 280, note: '1조각 기준' },
  { brand: '배스킨라빈스', menu: '밀크쉐이크', kcal: 430, note: '1잔 기준' },

  // ── 샐러디 ──
  { brand: '샐러디', menu: '클래식샐러드', kcal: 180, note: '기본 구성 기준' },
  { brand: '샐러디', menu: '치킨샐러드', kcal: 320, note: '기본 구성 기준' },
  { brand: '샐러디', menu: '연어샐러드', kcal: 380, note: '기본 구성 기준' },
  { brand: '샐러디', menu: '새우샐러드', kcal: 280, note: '기본 구성 기준' },
  { brand: '샐러디', menu: '그릭볼샐러드', kcal: 350, note: '기본 구성 기준' },
];

/* ── 프랜차이즈 DB 검색 함수 ── */
function searchFranchiseDB(brand, menu) {
  const bl = brand.toLowerCase();
  const ml = menu.toLowerCase();

  let results = FRANCHISE_DB;

  if (brand) {
    results = results.filter(item => item.brand.toLowerCase().includes(bl));
  }

  if (menu && results.length > 0) {
    const menuFiltered = results.filter(item => item.menu.toLowerCase().includes(ml));
    if (menuFiltered.length > 0) results = menuFiltered;
  }

  return results.slice(0, 10).map(item => ({
    name: item.menu,
    brand: item.brand,
    kcal: item.kcal,
    note: item.note || '1인분 기준',
    source: 'local',
  }));
}

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

  // 해당 월에 기록이 있는 날짜 모두 수집
  const allDates = new Set();
  ['mood', 'food', 'diary', 'exercise', 'photos'].forEach(key => {
    if (data[key]) Object.keys(data[key]).filter(d => d.startsWith(prefix)).forEach(d => allDates.add(d));
  });

  allDates.forEach(date => {
    result[date] = {};
    // 감정 (이모지)
    if (data.mood?.[date]) {
      result[date].emoji   = data.mood[date].emoji;
      result[date].emotion = data.mood[date].emotion;
    }
    // 대표 사진
    if (data.photos?.[date]?.featured) result[date].featured = data.photos[date].featured;
    // 운동 기록 여부
    if (data.exercise?.[date]) result[date].hasExercise = true;
    // 일기 기록 여부
    if (data.diary?.[date]?.text) result[date].hasDiary = true;
    // 식단 기록 여부 (한 끼라도 있으면)
    if (data.food?.[date]) {
      const hasFood = MEALS.some(m => (data.food[date][m] || []).length > 0);
      if (hasFood) result[date].hasFood = true;
    }
  });

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

/* ── API: 브랜드 메뉴 검색 (로컬 DB 우선 → Open Food Facts 폴백) ── */
app.get('/api/brand-search', async (req, res) => {
  const brand = (req.query.brand || '').trim();
  const menu  = (req.query.menu  || '').trim();
  if (!brand && !menu) return res.json([]);

  // 1) 로컬 프랜차이즈 DB 검색
  const localResults = searchFranchiseDB(brand, menu);
  if (localResults.length > 0) {
    return res.json(localResults);
  }

  // 2) 로컬에 없으면 Open Food Facts 폴백
  try {
    const query = [brand, menu].filter(Boolean).join(' ');
    const url = `https://world.openfoodfacts.org/cgi/search.pl`
      + `?search_terms=${encodeURIComponent(query)}`
      + `&search_simple=1&action=process&json=1&page_size=15`
      + `&fields=product_name,brands,nutriments,serving_size,serving_quantity`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'SeoyoonDiary/1.0 (personal diary app)' },
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();

    const results = (data.products || [])
      .map(p => {
        const name  = p.product_name?.trim();
        const br    = (p.brands || brand).split(',')[0].trim();
        const n     = p.nutriments || {};
        const kcalServing = n['energy-kcal_serving'] || n['energy-kcal'];
        const kcal100     = n['energy-kcal_100g'];
        const kcal = kcalServing
          ? Math.round(kcalServing)
          : kcal100 ? Math.round(kcal100) : 0;
        const note = kcalServing ? '1회 제공량' : '100g 기준';
        if (!name || kcal <= 0) return null;
        return { name, brand: br, kcal, note };
      })
      .filter(Boolean)
      .slice(0, 10);

    res.json(results);
  } catch (e) {
    console.log('브랜드 검색 오류:', e.message);
    res.status(500).json({ error: '검색 오류' });
  }
});

/* ── API: 음식 칼로리 검색 ── */
app.get('/api/food-search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const lower = q.toLowerCase();
  const results = FOOD_DB
    .filter(f => f.name.toLowerCase().includes(lower))
    .sort((a, b) => {
      // 앞에서 일치할수록 우선
      const ai = a.name.toLowerCase().indexOf(lower);
      const bi = b.name.toLowerCase().indexOf(lower);
      return ai - bi;
    })
    .slice(0, 8);
  res.json(results);
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
app.listen(PORT, '0.0.0.0', () => console.log(`내 일기 서버 실행 중: http://localhost:${PORT}`));
