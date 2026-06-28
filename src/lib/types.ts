/**
 * 데이터 타입 정의 (스펙 13절 필수 필드 기준)
 *
 * 수도권 매트릭스형 사이트 — 지역 × 생활권 × 역세권 × 이용장소 4축 구조.
 * contentStatus / indexPriority / noindex 필드로 단계적 배포(1차-A → B → C)를 제어한다.
 */

/** 광역자치단체 (서울·경기·인천) */
export type Province = 'seoul' | 'gyeonggi' | 'incheon';

/** 콘텐츠 상태 — 단계적 색인/배포 제어용 */
export type ContentStatus = 'ready' | 'draft' | 'noindex' | 'blocked';

/** 색인 우선순위
 *  1 = 1차 색인 (1차-A 즉시 공개)
 *  2 = 2차 색인 (1차-B)
 *  3 = 3차 색인 (1차-C)
 *  0 = DB 보관 (페이지 생성 안 함, 향후 확장용)
 */
export type IndexPriority = 0 | 1 | 2 | 3;

/** 페이지 유형 (스펙 11절 템플릿 분류) */
export type PageType =
  | 'home' // 수도권 메인
  | 'hub' // 지역 허브 (서울/경기/인천 메인)
  | 'area' // 지역별 보기 허브
  | 'district' // 행정구·시군
  | 'admin-dong' // 행정동·읍면동
  | 'station' // 역세권
  | 'life-area' // 생활권
  | 'use-case' // 이용 장소별 안내
  | 'check' // 예약 전 확인
  | 'legal' // 개인정보 처리방침 등 법적 페이지
  | 'guide'; // 운영 기준 등

/** 생활권 유형 (스펙 7절) */
export type LifeAreaType =
  | 'business' // 업무지구
  | 'new-town' // 신도시
  | 'old-town' // 원도심
  | 'residential' // 주거지
  | 'lodging' // 숙소 인접권
  | 'airport' // 공항권
  | 'outer'; // 외곽 이동권

/** 이용 장소 (스펙 9절) */
export type UseCaseSlug =
  | 'home' // 자택
  | 'hotel' // 호텔·숙소
  | 'officetel' // 오피스텔
  | 'business-district' // 업무지구
  | 'station-area' // 역세권
  | 'night' // 야간 예약
  | 'outer-area'; // 외곽 지역

/** FAQ 항목 */
export interface FAQItem {
  question: string;
  answer: string;
}

/** 외부 권위 출처 링크 (E-E-A-T 신호) */
export interface ExternalLink {
  label: string; // 표시명 (예: "서울교통공사")
  url: string; // 공식 URL
  desc?: string; // 참고 목적
}

/** 모든 지역/콘텐츠 데이터의 공통 필수 필드 (스펙 13절) */
export interface BaseRegionData {
  name: string; // 표기명 (예: "강남역·역삼")
  slug: string; // URL 슬러그 (예: "gangnam-yeoksam")
  type: PageType;
  province: Province;
  city?: string; // 시·군 (경기/인천)
  district?: string; // 행정구·일반구 (예: "gangnam-gu")
  adminDong?: string; // 행정동·읍면동
  nearbyStations?: string[]; // 가까운 역 슬러그
  nearbyAreas?: string[]; // 인접 생활권 슬러그
  nearbyRegions?: string[]; // 인접 행정구역 슬러그
  lifeArea?: string; // 소속 생활권 슬러그
  useCases?: UseCaseSlug[]; // 적용 가능 이용 장소
  checklist?: string[]; // 예약 전 확인사항
  searchIntent: string; // 검색 의도 (SEO용)
  contentFocus: string; // 콘텐츠 방향 (차별화 포인트)
  indexPriority: IndexPriority;
  contentStatus: ContentStatus;
  canonicalUrl: string; // 정규 URL (path만, 예: /seoul/life/gangnam-yeoksam/)
  noindex: boolean;
  lastUpdated: string; // ISO 날짜
}

/** 생활권 데이터 — life-areas.json 한 항목 */
export interface LifeArea extends BaseRegionData {
  type: 'life-area';
  lifeAreaType: LifeAreaType;
  description: string; // 생활권 설명
  includes: string[]; // 포함 지역 (예: ["강남역", "역삼역"])
  relatedDistricts?: string[]; // 관련 행정구역 슬러그
  relatedStations?: string[]; // 관련 역세권 슬러그
  body?: string; // 본문(1,500자 이상 권장)
  faq?: FAQItem[];
  externalLinks?: ExternalLink[]; // 권위 외부 링크
}

/** 행정구·시군 데이터 */
export interface DistrictData extends BaseRegionData {
  type: 'district';
  parent?: string; // 상위 시 (경기 일반구의 경우)
  representativeLifeAreas?: string[]; // 대표 생활권 슬러그
  representativeDongs?: string[]; // 대표 행정동/읍면동
  nearbyStationsData?: string[]; // 대표 역세권 슬러그
  dongs?: string[]; // 해당 구/시군의 행정동 이름 목록 (대표동 통합)
  body?: string;
  faq?: FAQItem[];
  externalLinks?: ExternalLink[];
}

/** 행정동·읍면동 데이터 */
export interface AdminDongData extends BaseRegionData {
  type: 'admin-dong';
  parent: string; // 소속 행정구/시군 slug
  dongType?: 'dong' | 'eup' | 'myeon';
  relatedLifeArea?: string;
  body?: string;
  faq?: FAQItem[];
}

/** 역세권 데이터 (역명 기준 1개 URL) */
export interface StationData extends BaseRegionData {
  type: 'station';
  stationName: string; // 역명 (예: "강남역")
  adjacentDongs?: string[];
  relatedLifeArea?: string;
  isTransfer?: boolean; // 환승역 여부
  lines?: string[]; // 노선 (참고용, 노선별 분리 안 함)
  faq?: FAQItem[];
  externalLinks?: ExternalLink[];
}

/** 이용 장소별 안내 데이터 */
export interface UseCaseData {
  name: string;
  slug: UseCaseSlug;
  label: string; // 메뉴 표기 (예: "자택 이용")
  summary: string; // 한 줄 요약
  body: string; // 본문 (set:html 렌더링 → 외부링크 HTML 허용)
  points: string[]; // 확인 포인트
  faq?: FAQItem[];
  externalLinks?: ExternalLink[];
}

/** 예약 전 확인 체크리스트 항목 */
export interface ChecklistItem {
  id: string;
  question: string;
  detail?: string;
}

/** 가격표 코스 항목 */
export interface PriceCourse {
  name: string;
  duration: string;
  price: string;
  desc?: string;
}

/** 가격표 데이터 */
export interface PriceTableData {
  lastUpdated: string;
  note?: string;
  courses: PriceCourse[];
  additionalFees?: { name: string; price: string; desc?: string }[];
  legalNote?: string;
}

/** 사이트 전역 설정 */
export interface SiteConfig {
  name: string;
  url: string;
  title: string;
  description: string;
  focusKeyword: string;
  subKeywords: string[];
  phone?: string;
  phoneDisplay?: string;
  phoneTel?: string;
  telegramUrl?: string; // 텔레그램 문의 링크
  organization: {
    name: string;
    url: string;
    logo?: string;
    description: string;
  };
}

/** 브레드크럼 항목 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}
