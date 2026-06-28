/**
 * 파비콘 PNG 생성 스크립트
 * favicon.svg → 다양한 크기 PNG (모던/iOS/안드로이드 웹앱)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const svg = fs.readFileSync(path.join(PUBLIC, 'favicon.svg'));

// 생성할 크기 목록
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },  // iOS Safari
  { name: 'android-chrome-192x192.png', size: 192 },  // 안드로이드 홈화면
  { name: 'android-chrome-512x512.png', size: 512 },  // PWA
];

(async () => {
  for (const { name, size } of sizes) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(path.join(PUBLIC, name));
    console.log(`✅ ${name} (${size}x${size})`);
  }

  // web manifest (안드로이드/PWA용)
  const manifest = {
    name: 'WE 마사지',
    short_name: 'WE 마사지',
    description: '서울·경기·인천 수도권 출장마사지 방문 가능 지역 안내',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: '#0a0e1a',
    background_color: '#0a0e1a',
    display: 'standalone',
    start_url: '/',
  };
  fs.writeFileSync(
    path.join(PUBLIC, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  console.log('✅ site.webmanifest');
  console.log('\n파비콘 생성 완료');
})().catch((e) => {
  console.error('실패:', e.message);
  process.exit(1);
});
