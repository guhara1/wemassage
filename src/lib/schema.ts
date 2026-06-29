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
import type { FAQItem, BreadcrumbItem, PriceTableData, ReviewItem, ReviewsData } from './types';
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

/**
 * Offer 스키마 — 실제 가격 정보 (구글 정책 준수: 실제 데이터만)
 * Review/AggregateRating(가짜 점수·후기)는 구글 스팸 정책 위반으로 사용하지 않음.
 */
export function offerSchema(
  courseName: string,
  price: string,
  description?: string
) {
  // "100,000원" → 숫자 추출
  const priceNum = parseInt(price.replace(/[^0-9]/g, ''), 10);
  return {
    '@type': 'Offer',
    name: courseName,
    description: description || courseName,
    price: isNaN(priceNum) ? price : String(priceNum),
    priceCurrency: 'KRW',
    availability: 'https://schema.org/InStock',
  };
}

/**
 * Service 스키마 — 출장 마사지 서비스 정보
 * 가격표(Offer 목록)를 포함하여 서비스 범위 명시.
 */
export function serviceSchema(priceData?: PriceTableData, areaServed?: string[]) {
  const offers = priceData?.courses?.map((c) => offerSchema(c.name, c.price, c.desc)) ?? [];
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: '수도권 출장마사지',
    serviceType: '방문 마사지 서비스',
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    areaServed: (areaServed ?? ['서울', '경기', '인천']).map((a) => ({
      '@type': 'AdministrativeArea',
      name: a,
    })),
    description: siteConfig.organization.description,
    ...(offers.length > 0
      ? {
          offers: {
            '@type': 'AggregateOffer',
            lowPrice: priceData?.courses?.[0]?.price ?? '',
            highPrice: priceData?.courses?.[priceData.courses.length - 1]?.price ?? '',
            priceCurrency: 'KRW',
            offerCount: offers.length,
          },
        }
      : {}),
  };
}

/**
 * AggregateRating 스키마 — 실제 수집된 리뷰 기반 평점
 * (구글 정책: 가짜가 아닌 실제 데이터만 사용)
 */
export function aggregateRatingSchema(reviews: ReviewsData) {
  const s = reviews.summary;
  return {
    '@type': 'AggregateRating',
    ratingValue: s.averageRating,
    reviewCount: s.totalCount,
    bestRating: s.bestRating,
    worstRating: s.worstRating,
  };
}

/**
 * Review 스키마 — 개별 리뷰 (실제 고객 후기)
 */
export function reviewSchema(review: ReviewItem) {
  return {
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author,
    },
    datePublished: review.date,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.text,
    ...(review.region ? { areaServed: review.region } : {}),
  };
}

/**
 * ReviewList + AggregateRating 결합 스키마 (Product로 평점 노출)
 * 메인/허브 페이지에서 검색결과 별표 노출에 사용.
 */
export function reviewsSchema(reviews: ReviewsData, itemName?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: itemName || `${siteConfig.name} 수도권 출장마사지`,
    description: siteConfig.organization.description,
    aggregateRating: aggregateRatingSchema(reviews),
    review: reviews.reviews.slice(0, 20).map((r) => reviewSchema(r)),
  };
}
