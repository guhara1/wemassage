/**
 * JSON-LD 구조화 데이터 생성 라이브러리
 *
 * 스펙 2절 기준 5종 스키마:
 *   - Organization  (전역, E-E-A-T 신뢰 신호 — sameAs 포함)
 *   - WebSite       (SearchAction, 사이트링크 검색박스)
 *   - WebPage       (모든 페이지)
 *   - BreadcrumbList (모든 페이지)
 *   - ImageObject   (선호 이미지 — Google 2026.3 정책 반영)
 *   - FAQPage       (FAQ 포함 페이지)
 *
 * 주의: 오프라인 매장이 없는 방문형 사이트이므로 LocalBusiness Schema는 사용하지 않는다.
 */
import type { FAQItem, BreadcrumbItem } from './types';
import { siteConfig } from '../data/site';

/** 사이트 절대 URL 생성 */
export function absUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}

/** WebPage 스키마 */
export function webPageSchema(
  path: string,
  title: string,
  description: string,
  breadcrumbs?: BreadcrumbItem[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': absUrl(path),
    url: absUrl(path),
    name: title,
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    ...(breadcrumbs
      ? {
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((item, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: item.name,
              item: absUrl(item.url),
            })),
          },
        }
      : {}),
  };
}

/** BreadcrumbList 스키마 */
export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absUrl(item.url),
    })),
  };
}

/**
 * Organization 스키마 (오프라인 매장 없음 → LocalBusiness 사용 안 함)
 *  - contactPoint: 전화예약 번호 (reservations)
 *  - sameAs: E-E-A-T 신뢰 신호 (텔레그램 등)
 */
export function organizationSchema() {
  const sameAs: string[] = [];
  if (siteConfig.telegramUrl) sameAs.push(siteConfig.telegramUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.organization.name,
    url: siteConfig.organization.url,
    description: siteConfig.organization.description,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(siteConfig.phoneTel
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: `+82-${siteConfig.phoneDisplay?.replace(/^0/, '')}`,
            contactType: 'reservations',
            areaServed: ['서울', '경기', '인천'],
            availableLanguage: ['Korean'],
          },
        }
      : {}),
  };
}

/**
 * ImageObject 스키마 — 선호 이미지 지정 (Google 2026.3 정책)
 * 메인/허브 페이지에서 og:image와 연동하여 명시적 선호 썸네일 지정.
 */
export function imageObjectSchema(imagePath: string, caption?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    url: absUrl(imagePath),
    contentUrl: absUrl(imagePath),
    caption: caption || siteConfig.description,
    representativeOfPage: true,
  };
}

/** FAQPage 스키마 */
export function faqPageSchema(faqs: FAQItem[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * WebSite 스키마 (SearchAction 포함)
 * 사이트링크 검색박스 지원. 메인 페이지에서 전역으로 한 번만 노출.
 */
export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.organization.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** 여러 스키마 결합 (null 제거) */
export function buildSchemaGraph(schemas: object[]): object[] {
  return schemas.filter(Boolean);
}
