/**
 * 데이터 로드 및 단계적 색인 제어 라이브러리
 *
 * contentStatus / indexPriority / noindex 필드로 단계적 배포(1차-A → B → C)를 제어.
 * 1차-A(indexPriority === 1 && contentStatus === 'ready') 항목이 페이지 생성 + 색인 대상.
 * draft / noindex 항목은 noindex 메타만 삽입.
 */
import type {
  LifeArea,
  DistrictData,
  UseCaseData,
  ChecklistItem,
  PriceTableData,
  Province,
  Review,
  ReviewsData,
  RelatedLink,
} from './types';
import { romanize } from './romanize';
import seoulLifeAreas from '../data/seoul/life-areas.json';
import seoulDistricts from '../data/seoul/districts.json';
import gyeonggiLifeAreas from '../data/gyeonggi/life-areas.json';
import gyeonggiDistricts from '../data/gyeonggi/districts.json';
import incheonLifeAreas from '../data/incheon/life-areas.json';
import incheonDistricts from '../data/incheon/districts.json';
import gyeonggiCityDistricts from '../data/gyeonggi/city-districts.json';
import useCasesData from '../data/common/use-cases.json';
import checklistData from '../data/common/checklists.json';
import priceTableData from '../data/common/price-table.json';
import reviewsData from '../data/common/reviews.json';

type LifeAreaMap = Record<Province, LifeArea[]>;

const lifeAreasByProvince: LifeAreaMap = {
  seoul: seoulLifeAreas as LifeArea[],
  gyeonggi: gyeonggiLifeAreas as LifeArea[],
  incheon: incheonLifeAreas as LifeArea[],
};

const districtsByProvince: Record<Province, DistrictData[]> = {
  seoul: seoulDistricts as DistrictData[],
  gyeonggi: gyeonggiDistricts as DistrictData[],
  incheon: incheonDistricts as DistrictData[],
};

/* === 생활권 === */

export function getAllLifeAreas(): LifeArea[] {
  return [
    ...lifeAreasByProvince.seoul,
    ...lifeAreasByProvince.gyeonggi,
    ...lifeAreasByProvince.incheon,
  ];
}

export function getLifeAreasByProvince(province: Province): LifeArea[] {
  return lifeAreasByProvince[province];
}

/**
 * 색인 대상 생활권 (contentStatus === 'ready' 전체)
 * 콘텐츠가 준비된 생활권은 priority(1·2·3)에 무관하게 페이지를 생성한다.
 * noindex 항목은 페이지 생성에서 제외(생성 시 noindex 메타 처리).
 */
export function getReadyLifeAreas(province?: Province): LifeArea[] {
  const source = province ? lifeAreasByProvince[province] : getAllLifeAreas();
  return source.filter(
    (area) => area.contentStatus === 'ready' && !area.noindex
  );
}

export function getLifeArea(province: Province, slug: string): LifeArea | undefined {
  return lifeAreasByProvince[province].find((area) => area.slug === slug);
}

export function findLifeAreaBySlug(slug: string): LifeArea | undefined {
  return getAllLifeAreas().find((area) => area.slug === slug);
}

/* === 행정구·시군 === */

export function getDistricts(province: Province): DistrictData[] {
  return districtsByProvince[province].filter((d) => d.contentStatus === 'ready');
}

export function getDistrict(province: Province, slug: string): DistrictData | undefined {
  return districtsByProvince[province].find((d) => d.slug === slug);
}

/** 1차 색인 대상 행정구만 */
export function getReadyDistricts(province: Province): DistrictData[] {
  return districtsByProvince[province].filter(
    (d) => d.indexPriority === 1 && d.contentStatus === 'ready'
  );
}

/* === 이용 장소 === */

export function getAllUseCases(): UseCaseData[] {
  return useCasesData as UseCaseData[];
}

export function getUseCase(slug: string): UseCaseData | undefined {
  return (useCasesData as UseCaseData[]).find((item) => item.slug === slug);
}

/* === 체크리스트 === */

export function getChecklist(): ChecklistItem[] {
  return checklistData as ChecklistItem[];
}

/* === 가격표 === */

export function getPriceTable(): PriceTableData {
  return priceTableData as PriceTableData;
}

/* === 후기·평점 (실제 후기 입력 시에만 노출) === */

/** 실제 입력된 이용자 후기 목록 (없으면 빈 배열) */
export function getReviews(): Review[] {
  const data = reviewsData as unknown as ReviewsData;
  return Array.isArray(data.items) ? data.items : [];
}

/** 후기 존재 여부 */
export function hasReviews(): boolean {
  return getReviews().length > 0;
}

/**
 * 실제 후기 기반 평균 평점 집계.
 * 후기가 없으면 null → AggregateRating 스키마/별점 미생성(가짜 평점 금지).
 */
export function getAggregateRating(): {
  ratingValue: number;
  reviewCount: number;
  bestRating: number;
  worstRating: number;
} | null {
  const items = getReviews();
  if (items.length === 0) return null;
  const sum = items.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const ratingValue = Math.round((sum / items.length) * 10) / 10;
  return { ratingValue, reviewCount: items.length, bestRating: 5, worstRating: 1 };
}

/* === 유틸 === */

export const PROVINCE_LABEL: Record<Province, string> = {
  seoul: '서울',
  gyeonggi: '경기',
  incheon: '인천',
};

export const PROVINCE_PATH: Record<Province, string> = {
  seoul: 'seoul',
  gyeonggi: 'gyeonggi',
  incheon: 'incheon',
};

export function getLifeAreaCount(province: Province): number {
  return getReadyLifeAreas(province).length;
}

/**
 * 한국어 조사 자동 처리
 * @param word 단어
 * @param pp 페어 조사 ('은는','이가','을를','과와','로으로')
 */
export function postposition(word: string, pp: string): string {
  if (!word) return pp;
  const last = word.charCodeAt(word.length - 1) - 0xac00;
  const hasBatchim = last % 28 !== 0;
  if (pp === '로으로') {
    const jong = last % 28;
    if (jong === 8) return word + '로';
    return hasBatchim ? word + '으로' : word + '로';
  }
  return hasBatchim ? word + pp[0] : word + pp[1];
}

/* ==========================================================================
   행정구(gu) 계층 — 경기도 일반구 보유 시 (수원/성남/용인/고양/화성/부천/안산/안양)
   ========================================================================== */

interface CityDistrict {
  slug: string;
  name: string;
  dongs: string[];
}

interface CityDistrictsData {
  name: string;
  districts: CityDistrict[];
}

/** 특정 경기 시가 일반구를 보유하고 있는지 */
export function hasGuDistricts(citySlug: string): boolean {
  const data = (gyeonggiCityDistricts as Record<string, CityDistrictsData>)[citySlug];
  return !!(data && data.districts && data.districts.length > 0);
}

/** 특정 경기 시의 행정구(gu) 목록 반환 */
export function getGuDistricts(citySlug: string): CityDistrict[] {
  const data = (gyeonggiCityDistricts as Record<string, CityDistrictsData>)[citySlug];
  return data?.districts ?? [];
}

/** 특정 행정구(gu) 단일 조회 */
export function getGuDistrict(citySlug: string, guSlug: string): CityDistrict | undefined {
  return getGuDistricts(citySlug).find((g) => g.slug === guSlug);
}

/* ==========================================================================
   행정동·읍면동 로마자 슬러그 + 역 라벨
   ========================================================================== */

/**
 * 특정 구/시군의 행정동을 {name, slug} 배열로 반환 (표시용)
 * 동명 → 로마자 슬러그 변환 (「국어의 로마자 표기법」 준수, 가독성 우선)
 * 동일 구 내 슬러그 충돌 시 -2, -3 부여
 */
export function getDongList(
  province: Province,
  districtSlug: string
): { name: string; slug: string }[] {
  const district = getDistrict(province, districtSlug);
  const dongs = district?.dongs ?? [];
  const seen = new Map<string, number>();
  const result: { name: string; slug: string }[] = [];
  for (const name of dongs) {
    let slug = romanize(name);
    if (seen.has(slug)) {
      const count = (seen.get(slug) || 1) + 1;
      seen.set(slug, count);
      slug = `${slug}-${count}`;
    } else {
      seen.set(slug, 1);
    }
    result.push({ name, slug });
  }
  return result;
}

/** 특정 동 슬러그로 단일 동 조회 */
export function getDong(
  province: Province,
  districtSlug: string,
  dongSlug: string
): { name: string; slug: string } | undefined {
  return getDongList(province, districtSlug).find((d) => d.slug === dongSlug);
}

/**
 * 행정구(gu) 내 행정동 리스트 반환 (경기도 일반구 보유 시)
 * 슬러그 충돌 시 -2, -3 부여
 */
export function getDongListByGu(
  citySlug: string,
  guSlug: string
): { name: string; slug: string }[] {
  const gu = getGuDistrict(citySlug, guSlug);
  if (!gu) return [];
  const seen = new Map<string, number>();
  const result: { name: string; slug: string }[] = [];
  for (const name of gu.dongs) {
    let slug = romanize(name);
    if (seen.has(slug)) {
      const count = (seen.get(slug) || 1) + 1;
      seen.set(slug, count);
      slug = `${slug}-${count}`;
    } else {
      seen.set(slug, 1);
    }
    result.push({ name, slug });
  }
  return result;
}

/** 행정구(gu) 내 특정 동 슬러그로 단일 동 조회 */
export function getDongByGu(
  citySlug: string,
  guSlug: string,
  dongSlug: string
): { name: string; slug: string } | undefined {
  return getDongListByGu(citySlug, guSlug).find((d) => d.slug === dongSlug);
}
const STATION_LABELS: Record<string, string> = {
  'gangnam-station': '강남역',
  'yeoksam-station': '역삼역',
  'seocho-station': '서초역',
  'yangjae-station': '양재역',
  'seolleung-station': '선릉역',
  'jamsil-station': '잠실역',
  'seokchon-station': '석촌역',
  'hongik-univ-station': '홍대입구역',
  'hapjeong-station': '합정역',
  'gongdeok-station': '공덕역',
  'yeouido-station': '여의도역',
  'yeongdeungpo-station': '영등포역',
  'seongsu-station': '성수역',
  'wangsimni-station': '왕십리역',
  'yongsan-station': '용산역',
  'seoul-station': '서울역',
  'konkuk-univ-station': '건대입구역',
  'achasan-station': '아차산역',
  'magok-station': '마곡역',
  'balsan-station': '발산역',
  'guro-digital-complex-station': '구로디지털단지역',
  'gasan-digital-complex-station': '가산디지털단지역',
  'geumcheon-gu-office-station': '금천구청역',
  'sillim-station': '신림역',
  'seoul-national-univ-station': '서울대입구역',
  'sadang-station': '사당역',
  'noryangjin-station': '노량진역',
  'mokdong-station': '목동역',
  'sinjeong-negeori-station': '신정네거리역',
  'yeonsinnae-station': '연신내역',
  'bulgwang-station': '불광역',
  'nowon-station': '노원역',
  'sanggye-station': '상계역',
  'sangbong-station': '상봉역',
  'myeonmok-station': '면목역',
  'jongno-3-sam-ga-station': '종로3가역',
  'gwanghwamun-station': '광화문역',
  'myeongdong-station': '명동역',
  'euljiro-ipeg-station': '을지로입구역',
  'cheonho-station': '천호역',
  'gildong-station': '길동역',
  'suyu-station': '수유역',
  'dobong-station': '도봉역',
  'cheongnyangni-station': '청량리역',
  'sinseol-dong-station': '신설동역',
  'sinchon-station': '신촌역',
  'hongje-station': '홍제역',
  'seongbuk-station': '성북역',
  'suwon-station': '수원역',
  'pangyo-station': '판교역',
  'jeongja-station': '정자역',
  'jukjeon-station': '죽전역',
  'giheung-station': '기흥역',
  'dongtan-station': '동탄역',
  'byeongjeom-station': '병점역',
  'bucheon-station': '부천역',
  'jung-dong-station': '중동역',
  'beomgye-station': '범계역',
  'anyang-station': '안양역',
  'jeongbalsan-station': '정발산역',
  'daehwa-station': '대화역',
  'uijeongbu-station': '의정부역',
  'minrak-station': '민락역',
  'misa-station': '미사역',
  'hanam-geonsan-station': '하남검산역',
  'cheolsan-station': '철산역',
  'gwangmyeong-station': '광명역',
  'central-station': '중앙역',
  'choji-station': '초지역',
  'pyeongtaek-station': '평택역',
  'songtan-station': '송탄역',
  'jeongwang-station': '정왕역',
  'osan-station': '오산역',
  'uiwang-station': '의왕역',
  'naeson-station': '내손역',
  'gwacheon-station': '과천역',
  'government-complex-gwacheon-station': '정부과천청사역',
  'icheon-station': '이천역',
  'bubal-station': '부발역',
  'yeoju-station': '여주역',
  'yangpyeong-station': '양평역',
  'yongmun-station': '용문역',
  'yangju-station': '양주역',
  'deokgye-station': '덕계역',
  'pocheon-station': '포천역',
  'soheul-station': '소흘역',
  'dongducheon-station': '동두천역',
  'bosan-station': '보산역',
  'gapyeong-station': '가평역',
  'cheongpyeong-station': '청평역',
  'yeoncheon-station': '연천역',
  'jeongok-station': '전곡역',
  'geumchon-station': '금촌역',
  'guri-station': '구리역',
  'sanbon-station': '산본역',
  'dangjeong-station': '당정역',
  'anseong-station': '안성역',
  'incheon-national-univ-station': '인천대입구역',
  'songdo-moonlight-festival-park-station': '송도달빛축제공원역',
  'incheon-cityhall-station': '인천시청역',
  'arts-center-station': '예술회관역',
  'bupyeong-station': '부평역',
  'bupyeong-market-station': '부평시장역',
  'juan-station': '주안역',
  'dohwa-station': '도화역',
  'dongincheon-station': '동인천역',
  'cheongna-international-city-station': '청라국제도시역',
  'geomdan-sageori-station': '검단사거리역',
  'unseo-station': '운서역',
  'incheon-airport-station': '인천공항역',
  'gyeyang-station': '계양역',
  'gyesan-station': '계산역',
};

export function stationLabel(slug: string): string {
  return STATION_LABELS[slug] ?? slug.replace(/-/g, ' ');
}

/* ==========================================================================
   내부 링크(롱테일) 빌더 — 메인/지역/생활권 페이지 상호 연결 강화
   ========================================================================== */

/**
 * 생활권 상세 페이지의 롱테일 관련 링크 묶음.
 * - 인접 생활권(nearbyAreas): "{지역} {생활권} 출장마사지·홈타이"
 * - 관련 행정구역(relatedDistricts): "{지역} {구·시군} 출장마사지"
 * 색인 제외(noindex)·미준비(draft) 항목은 링크하지 않는다.
 */
export function getLifeAreaRelatedLinks(area: LifeArea): RelatedLink[] {
  const out: RelatedLink[] = [];
  const seen = new Set<string>([area.canonicalUrl]);

  for (const slug of area.nearbyAreas ?? []) {
    const a = findLifeAreaBySlug(slug);
    if (!a || a.contentStatus !== 'ready' || a.noindex) continue;
    const href = `/${a.province}/life/${a.slug}/`;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({
      name: `${PROVINCE_LABEL[a.province]} ${a.name} 출장마사지·홈타이`,
      href,
      desc: a.description,
      badge: '인접 생활권',
    });
  }

  for (const slug of area.relatedDistricts ?? []) {
    const d = getDistrict(area.province, slug);
    if (!d || d.contentStatus !== 'ready' || d.noindex) continue;
    const href = `/${area.province}/${d.slug}/`;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({
      name: `${PROVINCE_LABEL[area.province]} ${d.name} 출장마사지`,
      href,
      desc: d.contentFocus,
      badge: '행정구역',
    });
  }

  return out;
}

/** 생활권의 관련 역세권 칩 링크(롱테일 앵커, 역세권 허브로 연결) */
export function getLifeAreaStationLinks(area: LifeArea): RelatedLink[] {
  const seen = new Set<string>();
  const out: RelatedLink[] = [];
  for (const slug of area.relatedStations ?? []) {
    const label = stationLabel(slug);
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ name: `${label} 출장마사지`, href: '/station/' });
  }
  return out;
}

/**
 * 행정구역(구·시군) 상세 페이지의 "주변 지역" 롱테일 링크.
 * 같은 광역단체 내 다른 색인 대상 구·시군으로 연결한다(자기 자신 제외).
 */
export function getNearbyDistrictLinks(
  province: Province,
  currentSlug: string,
  limit = 8
): RelatedLink[] {
  return getDistricts(province)
    .filter((d) => d.slug !== currentSlug && !d.noindex)
    .slice(0, limit)
    .map((d) => ({
      name: `${PROVINCE_LABEL[province]} ${d.name} 출장마사지`,
      href: `/${province}/${d.slug}/`,
      desc: d.contentFocus,
      badge: '주변 지역',
    }));
}

/**
 * 메인/허브용 롱테일 바로가기 칩.
 * 각 생활권의 searchIntent 첫 구절(실제 검색어 형태)을 앵커로 사용한다.
 */
export function getLongtailLifeLinks(province?: Province): RelatedLink[] {
  return getReadyLifeAreas(province).map((area) => {
    const anchor = (area.searchIntent || '').split(',')[0].trim() || `${area.name} 출장마사지`;
    return {
      name: anchor,
      href: `/${area.province}/life/${area.slug}/`,
      badge: PROVINCE_LABEL[area.province],
    };
  });
}
