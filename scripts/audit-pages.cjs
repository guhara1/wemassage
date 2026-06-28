const fs = require('fs');
const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');

const pages = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name === 'index.html') {
      pages.push(path.relative(DIST, f).split(path.sep).join('/').replace(/index\.html$/, ''));
    }
  }
}
walk(DIST);

const cnt = (re) => pages.filter((p) => re.test(p)).length;

console.log('========== 페이지 생성 전수 집계 ==========\n');

console.log('[서울]');
console.log('  행정구(/seoul/X-gu/):', cnt(/^seoul\/[^/]+-gu\/$/));
console.log('  행정동(/seoul/구/동/):', cnt(/^seoul\/[^/]+\/[^/]+\/$/));
console.log('  생활권:', cnt(/^seoul\/life\//));

console.log('\n[경기]');
console.log('  행정시(/gyeonggi/X/):', cnt(/^gyeonggi\/[^/]+\/$/));
console.log('  일반구(/gyeonggi/시/구/):', cnt(/^gyeonggi\/[^/]+\/[^/]+-gu\/$/));
console.log('  일반시 읍면동(/gyeonggi/시/동/):', cnt(/^gyeonggi\/[^/]+\/[^/]+\/$/) - cnt(/^gyeonggi\/[^/]+\/[^/]+-gu\/$/));
console.log('  일반구내 동(/gyeonggi/시/구/동/):', cnt(/^gyeonggi\/[^/]+\/[^/]+-gu\/[^/]+\/$/));
console.log('  생활권:', cnt(/^gyeonggi\/life\//));

console.log('\n[인천]');
console.log('  구·군(/incheon/X/):', cnt(/^incheon\/[^/]+\/$/));
console.log('  행정동·읍면:', cnt(/^incheon\/[^/]+\/[^/]+\/$/));
console.log('  생활권:', cnt(/^incheon\/life\//));

console.log('\n[허브/기타]');
const rootLevel = pages.filter((p) => !p.includes('/')).length;
const topHubs = pages.filter((p) => p.split('/').length === 2 && !p.startsWith('seoul') && !p.startsWith('gyeonggi') && !p.startsWith('incheon')).length;
console.log('  루트 허브(index, area, life, station, use, check, about, contact, privacy):', rootLevel + topHubs);

console.log('\n총계:', pages.length);
