const fs = require('fs');
const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');

let withReview = 0;
let withoutReview = 0;
const missing = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name === 'index.html') {
      const html = fs.readFileSync(f, 'utf8');
      const rel = path.relative(DIST, f).split(path.sep).join('/');
      if (html.includes('"@type":"Review"') && html.includes('AggregateRating')) {
        withReview++;
      } else {
        withoutReview++;
        missing.push(rel.replace(/index\.html$/, ''));
      }
    }
  }
}
walk(DIST);

console.log('=== Review 스키마 보유 현황 ===');
console.log('Review 스키마 있음:', withReview, '페이지');
console.log('Review 스키마 없음:', withoutReview, '페이지');
console.log('');
console.log('=== 카테고리별 분포 (없는 페이지) ===');
const cats = {};
for (const p of missing) {
  const parts = p.split('/');
  let cat;
  if (parts.length === 1 || parts[0] === '') cat = '루트';
  else if (parts[0] === 'seoul' || parts[0] === 'gyeonggi' || parts[0] === 'incheon') {
    if (parts[1] === 'life') cat = parts[0]+'/생활권';
    else if (parts.length === 2) cat = parts[0]+'/행정구시군';
    else if (parts.length === 3 && parts[1].endsWith('-gu')) cat = parts[0]+'/일반구';
    else if (parts.length === 3) cat = parts[0]+'/행정동';
    else cat = parts[0]+'/행정동(깊이)';
  }
  else cat = '기타허브';
  cats[cat] = (cats[cat] || 0) + 1;
}
for (const [c, n] of Object.entries(cats).sort((a,b)=>b[1]-a[1])) {
  console.log(`  ${c}: ${n}`);
}
