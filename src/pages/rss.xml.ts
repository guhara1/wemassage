import type { APIRoute } from 'astro';
import { siteConfig } from '../data/site';

/**
 * RSS 2.0 피드 - 네이버/구글 색인용
 * 핵심 페이지(메인·광역허브·허브)를 아이템으로 노출.
 */
export const GET: APIRoute = async () => {
  const baseUrl = siteConfig.url;
  const buildDate = new Date().toUTCString();

  const items = [
    { loc: '/', priority: '1.0', title: `${siteConfig.name} - 수도권 출장마사지 방문 가능 지역 안내`, desc: '서울·경기·인천 수도권 출장마사지 방문 가능 지역, 생활권, 역세권, 예약 전 확인사항 안내' },
    { loc: '/seoul/', priority: '0.9', title: '서울 출장마사지 - 25개 행정구 방문 가능 지역', desc: '서울 25개 행정구 방문 가능 지역과 예약 전 확인사항' },
    { loc: '/gyeonggi/', priority: '0.9', title: '경기 출장마사지 - 31개 시·군 방문 가능 지역', desc: '경기 31개 시·군(특례시 4곳 포함) 방문 가능 지역과 예약 전 확인사항' },
    { loc: '/incheon/', priority: '0.9', title: '인천 출장마사지 - 9구 2군 방문 가능 지역', desc: '인천 9구 2군(2026.7.1 개편 반영) 방문 가능 지역과 예약 전 확인사항' },
    { loc: '/area/', priority: '0.8', title: '수도권 출장마사지 지역별 보기', desc: '서울·경기·인천 전 지역 허브' },
    { loc: '/life/', priority: '0.8', title: '수도권 출장마사지 생활권 보기', desc: '업무지구·신도시·역세권·주거 생활권별 방문 가능 지역' },
    { loc: '/station/', priority: '0.8', title: '수도권 출장마사지 지하철역 보기', desc: '강남역·수원역·부평역 등 역세권별 방문 가능 지역' },
    { loc: '/use/', priority: '0.8', title: '수도권 출장마사지 이용 장소별 안내', desc: '자택·호텔·오피스텔·업무지구·야간·외곽별 확인사항' },
    { loc: '/check/', priority: '0.8', title: '출장마사지 예약 전 확인사항', desc: '예약 전 반드시 확인할 체크리스트' },
    { loc: '/about/', priority: '0.6', title: `${siteConfig.name} 사이트 소개`, desc: '운영 목적과 품질 기준' },
    { loc: '/contact/', priority: '0.6', title: '고객센터', desc: '예약 문의 및 안내 채널' },
  ];

  const itemXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${baseUrl}${item.loc}</link>
      <guid>${baseUrl}${item.loc}</guid>
      <description>${escapeXml(item.desc)}</description>
      <priority>${item.priority}</priority>
    </item>`
    )
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} - 수도권 출장마사지 정보</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(siteConfig.organization.description)}</description>
    <language>ko</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
