# Cloudflare Pages 배포 가이드

## 저장소 연결 시 빌드 구성

| 항목 | 값 |
|---|---|
| Framework preset | **Astro** |
| Build command | **`npm run build`** |
| Build output directory | **`dist`** |
| Root directory | (비워둠 — 루트에 프로젝트 있음) |

## 환경 변수 (필수)

Cloudflare Pages → Settings → Environment variables에 추가:

| 변수 | 값 | 비고 |
|---|---|---|
| `NODE_VERSION` | `22` | Cloudflare 기본값(18)과 다름, 반드시 설정 |

선택 (도메인 확정 후):

| 변수 | 값 | 비고 |
|---|---|---|
| `SITE_URL` | `https://wemassage.pages.dev` | sitemap/canonical의 절대 URL용. 미설정 시 astro.config.mjs 기본값 사용 |

## 동작 흐름

1. `git push origin main` → Cloudflare가 자동 감지
2. `npm install` → Astro + sitemap + sharp 설치
3. `npm run build` → `dist/` 에 1,655페이지 + sitemap + rss 생성
4. `dist/` 배포 → `wemassage.pages.dev` 서빙

## 참고

- 빌드 산출물(`dist/`, `node_modules/`)은 .gitignore로 제외됨 → GitHub에 올라가지 않음
- Cloudflare에서 빌드 시점에 새로 설치/빌드하므로 항상 최신 상태 유지
- `_redirects`, `.nojekyll`, `robots.txt`, `og-image.webp/png`는 `public/`에서 자동 복사됨
- 인천 2026.7.1 개편 이후 `public/_redirects`의 주석 처리된 리다이렉트 활성화 (jung-gu/dong-gu/seo-gu → 신설구)
