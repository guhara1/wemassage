/**
 * 내부 링크 무결성 검사 스크립트
 * dist/ 의 모든 HTML에서 추출한 내부 링크(href="/...")가
 * 실제 존재하는 페이지인지 전수 점검. 깨진 링크(404)를 보고.
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');

// 1. dist의 모든 index.html 경로 수집 → 유효 페이지 집합
const allPages = new Set();
const staticAssets = new Set(); // favicon.svg, sitemap, _astro/* 등 (index.html이 아님)
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else {
      const rel = path.relative(DIST, full).replace(/\\/g, '/');
      if (entry.name === 'index.html') {
        allPages.add('/' + rel.replace(/index\.html$/, ''));
      } else {
        staticAssets.add('/' + rel);
      }
    }
  }
}
walk(DIST);

// 2. 각 HTML에서 내부 링크 추출
const linkRegex = /href="(\/[^"]*)"/g;
const brokenByPage = {};  // page -> [broken links]
const brokenLinks = {};   // broken link -> count
let totalLinks = 0;

for (const page of allPages) {
  const file = path.join(DIST, page.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    const href = m[1];
    // 외부/앵커/mailto/tel/skip
    if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
    // 쿼리스트링/해시 제거
    const cleanHref = href.split('#')[0].split('?')[0];
    if (!cleanHref.startsWith('/')) continue;
    totalLinks++;
    // 페이지 존재 여부
    let exists = allPages.has(cleanHref);
    if (!exists && !cleanHref.endsWith('/')) exists = allPages.has(cleanHref + '/');
    // 정적 에셋(favicon, sitemap, _astro/*, og-image 등)은 별도 확인
    if (!exists) exists = staticAssets.has(cleanHref);
    if (!exists) {
      (brokenByPage[page] ||= []).push(cleanHref);
      brokenLinks[cleanHref] = (brokenLinks[cleanHref] || 0) + 1;
    }
  }
}

// 3. 보고
const brokenCount = Object.keys(brokenLinks).length;
console.log(`=== 내부 링크 검사 결과 ===`);
console.log(`전체 페이지 수: ${allPages.size}`);
console.log(`검사한 내부 링크 수: ${totalLinks}`);
console.log(`깨진 링크(고유): ${brokenCount}`);
console.log('');

if (brokenCount === 0) {
  console.log('✅ 모든 내부 링크가 정상 연결됩니다.');
} else {
  console.log(`❌ 깨진 링크 ${brokenCount}개 (빈도순):`);
  const sorted = Object.entries(brokenLinks).sort((a, b) => b[1] - a[1]);
  for (const [link, count] of sorted.slice(0, 30)) {
    console.log(`  [${count}회] ${link}`);
  }
  if (sorted.length > 30) console.log(`  ... 외 ${sorted.length - 30}개`);
}
