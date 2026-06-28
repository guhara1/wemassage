/**
 * OG 이미지 생성 스크립트
 * SVG → 1200×630 WebP (Google 선호 이미지 정책)
 * 오렌지 그라데이션 + WE 마사지 브랜드
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0e1a"/>
      <stop offset="1" stop-color="#161d2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffb347"/>
      <stop offset="0.5" stop-color="#ff7a18"/>
      <stop offset="1" stop-color="#e85d04"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.3" r="0.6">
      <stop offset="0" stop-color="#ff7a18" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ff7a18" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>

  <!-- WE badge -->
  <rect x="90" y="90" width="120" height="64" rx="14" fill="url(#accent)"/>
  <text x="150" y="134" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#0a0e1a" text-anchor="middle">WE</text>

  <text x="90" y="280" font-family="Arial, sans-serif" font-size="62" font-weight="900" fill="#f0f2f5" text-anchor="start" letter-spacing="-2">서울·경기·인천</text>
  <text x="90" y="360" font-family="Arial, sans-serif" font-size="72" font-weight="900" text-anchor="start" letter-spacing="-2">
    <tspan fill="#ffb347">수도권</tspan>
    <tspan fill="#f0f2f5"> 출장마사지</tspan>
  </text>
  <text x="90" y="430" font-family="Arial, sans-serif" font-size="32" font-weight="600" fill="#b8bec9" text-anchor="start">지역 · 생활권 · 역세권 · 이용장소 안내</text>

  <text x="90" y="560" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#ff7a18" text-anchor="start">WE 마사지</text>
</svg>`;

const outDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  // WebP (SEO 우선)
  await sharp(Buffer.from(svg))
    .resize(1200, 630)
    .webp({ quality: 85 })
    .toFile(path.join(outDir, 'og-image.webp'));

  // PNG (보조 - 호환성)
  await sharp(Buffer.from(svg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(outDir, 'og-image.png'));

  console.log('OG 이미지 생성 완료: og-image.webp, og-image.png');
})().catch((e) => {
  console.error('OG 이미지 생성 실패:', e);
  process.exit(1);
});
