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
import { getPriceTable, getReviews, getAggregateRating } from './data';

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

/** 가격 문자열("100,000원")에서 숫자만 추출 */
function parsePrice(value: string): number {
  const n = Number(String(value).replace(/[^0-9]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/**
 * AggregateRating 스키마 — 실제 후기가 있을 때만 생성(없으면 null).
 * 허위 후기·가짜 평점 금지 정책: reviews.json에 실제 후기가 입력된 경우에만 노출.
 */
export function aggregateRatingSchema() {
  const agg = getAggregateRating();
  if (!agg) return null;
  return {
    '@type': 'AggregateRating',
    ratingValue: agg.ratingValue,
    reviewCount: agg.reviewCount,
    bestRating: agg.bestRating,
    worstRating: agg.worstRating,
  };
}

/** Review 노드 배열 — 실제 후기가 있을 때만(없으면 빈 배열) */
export function reviewNodes() {
  return getReviews().map((r) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.author },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: r.body,
    datePublished: r.date,
  }));
}

/**
 * Service 스키마 — 방문형(출장) 서비스 본질에 맞는 핵심 스키마.
 *  - provider: Organization
 *  - areaServed: 서비스 제공 지역
 *  - offers: 실제 가격표(price-table.json) 기반 AggregateOffer + OfferCatalog
 *  - aggregateRating / review: 실제 후기가 있을 때만 부착(가짜 평점 금지)
 */
export function serviceSchema(opts?: {
  name?: string;
  description?: string;
  areaServed?: string[];
  path?: string;
}) {
  const price = getPriceTable();
  const courses = price.courses ?? [];
  const prices = courses.map((c) => parsePrice(c.price)).filter((n) => n > 0);
  const lowPrice = prices.length ? Math.min(...prices) : undefined;
  const highPrice = prices.length ? Math.max(...prices) : undefined;
  const areas = opts?.areaServed ?? ['서울', '경기', '인천'];
  const rating = aggregateRatingSchema();
  const reviews = reviewNodes();

  const offerCatalog =
    courses.length > 0
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: '출장마사지 코스',
            itemListElement: courses.map((c) => ({
              '@type': 'Offer',
              priceCurrency: 'KRW',
              price: parsePrice(c.price),
              itemOffered: {
                '@type': 'Service',
                name: c.name,
                ...(c.desc ? { description: c.desc } : {}),
              },
            })),
          },
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'KRW',
            ...(lowPrice ? { lowPrice } : {}),
            ...(highPrice ? { highPrice } : {}),
            offerCount: courses.length,
          },
        }
      : {};

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: '출장마사지',
    name: opts?.name ?? `${siteConfig.name} 수도권 출장마사지`,
    description: opts?.description ?? siteConfig.organization.description,
    url: opts?.path ? absUrl(opts.path) : siteConfig.url,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
      ...(siteConfig.phoneTel
        ? { telephone: `+82-${siteConfig.phoneDisplay?.replace(/^0/, '')}` }
        : {}),
    },
    areaServed: areas.map((a) => ({ '@type': 'AdministrativeArea', name: a })),
    ...offerCatalog,
    ...(rating ? { aggregateRating: rating } : {}),
    ...(reviews.length ? { review: reviews } : {}),
  };
}

/**
 * ItemList 스키마 — 허브/목록 페이지의 내부 링크 구조를 명시.
 * 검색엔진의 사이트 구조 이해와 내부 링크 신호 강화에 사용.
 */
export function itemListSchema(
  items: { name: string; url: string }[],
  listName?: string
) {
  if (!items || items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(listName ? { name: listName } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      url: absUrl(item.url),
    })),
  };
}

/** 여러 스키마 결합 (null 제거) */
export function buildSchemaGraph(schemas: object[]): object[] {
  return schemas.filter(Boolean);
}
