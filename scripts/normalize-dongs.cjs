/**
 * 행정동 데이터 정규화 스크립트
 *
 * 1) 오탈자 수정: 야태동 → 야탑동 (알려진 오탈자 사전)
 * 2) 번호동 통합: "XXX1동","XXX2동","XXX3동" 등 → 대표동 "XXX동" 하나로 병합
 *    - "목1동".."목5동" → "목동"
 *    - "잠실2동","잠실3동" → "잠실동" (1이 없어도 통합)
 *    - "면목3·8동" 같은 복합 → "면목동"
 *    - "고척제1동" → "고척동"
 *    - "제1동".."제8동"(의정부) → 통합 대상에서 제외(의미 없는 번호동) 유지하지만
 *      단독 페이지 생성 방지는 data.ts 에서 처리
 *
 * 대상: seoul/gyeonggi/incheon districts.json + gyeonggi city-districts.json
 * 원본 백업은 .bak 으로 생성하지 않고(git이 있음) 직접 수정.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// 1. 오탈자 사전 (오른쪽이 올바른 표기)
const TYPO_FIX = {
  '야태': '야탑',
};

// 2. 번호동을 대표동으로 변환
//    입력 동명 → 변환된 대표동명 (또는 null = 통합 불가/유지)
function toRepresentative(name) {
  // "중산동1", "중산동2" 처럼 끝이 숫자인 경우 (동 뒤에 번호)
  let m = name.match(/^([가-힣]+동)[0-9]+$/);
  if (m) return m[1];
  // "면목3·8동" 같은 복합 번호동 → 기준동 추출
  // 패턴: (한글+)(숫자·숫자...)동
  m = name.match(/^([가-힣]+)[0-9··]+동$/);
  if (m) return m[1] + '동';
  // "고척제1동" → "고척동" (제N동 패턴)
  m = name.match(/^([가-힣]+)제[0-9]+동$/);
  if (m) return m[1] + '동';
  // "목1동","잠실2동" → "목동","잠실동"
  m = name.match(/^([가-힣]+)[0-9]+동$/);
  if (m) return m[1] + '동';
  // 의정부 "제1동".."제8동" 은 의미 있는 동명이 없으므로 통합 불가 → 유지
  // (의정부 행정동이 실제로 "의정부1동" 형태가 아닌 "제1동"이라 변환 대상 아님)
  return null; // 번호동이 아니거나 통합 불가
}

// 3. 오탈자 적용 (동명 전체에 대해)
function applyTypoFix(name) {
  let result = name;
  for (const [wrong, right] of Object.entries(TYPO_FIX)) {
    if (result.includes(wrong)) result = result.split(wrong).join(right);
  }
  return result;
}

// 한 동 배열을 정규화: 오탈자 수정 + 번호동 통합 + 중복 제거 (순서 유지)
function normalizeDongArray(dongs) {
  const seen = new Set();
  const out = [];
  for (let name of dongs) {
    name = applyTypoFix(name);
    const rep = toRepresentative(name);
    const final = rep || name;
    if (!seen.has(final)) {
      seen.add(final);
      out.push(final);
    }
  }
  return out;
}

// 파일 처리
function processDongArrays(obj) {
  let changed = 0;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string' && /동$/.test(obj[i])) {
        // 단일 동 문자열인 경우는 드묾 — 건너뜀 (보통 배열 안의 배열)
      }
      changed += processDongArrays(obj[i]);
    }
  } else if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      if (key === 'dongs' && Array.isArray(val)) {
        const before = val.length;
        const normalized = normalizeDongArray(val);
        if (JSON.stringify(normalized) !== JSON.stringify(val)) {
          obj[key] = normalized;
          changed++;
          console.log(`  [dongs] ${val.length} → ${normalized.length}개 (예: ${val.slice(0,3).join(',')} → ${normalized.slice(0,3).join(',')})`);
        }
      } else {
        changed += processDongArrays(val);
      }
    }
  }
  return changed;
}

const targets = [
  'src/data/seoul/districts.json',
  'src/data/gyeonggi/districts.json',
  'src/data/incheon/districts.json',
  'src/data/gyeonggi/city-districts.json',
];

let totalChanged = 0;
for (const rel of targets) {
  const full = path.join(ROOT, rel);
  console.log(`\n=== ${rel} ===`);
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  const changed = processDongArrays(data);
  if (changed > 0) {
    fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`  ✅ ${changed}개 배열 수정됨, 파일 저장`);
    totalChanged += changed;
  } else {
    console.log(`  (변경 없음)`);
  }
}

console.log(`\n=== 완료: 총 ${totalChanged}개 배열 정규화 ===`);
