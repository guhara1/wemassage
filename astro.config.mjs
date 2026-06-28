import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * WE 마사지 - 수도권 매트릭스형 출장마사지 사이트
 * 배포 도메인: we-massage.pages.dev (Cloudflare Pages)
 * - 환경 변수 SITE_URL 우선, 없으면 기본값 사용
 * - trailing slash 유지 (지시서 URL 규칙: /seoul/)
 */
export const SITE_URL = process.env.SITE_URL || 'https://we-massage.pages.dev';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
  trailingSlash: 'always',
});
