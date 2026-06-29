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
  ReviewsData,
  ReviewItem,
  Province,
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

/* === 리뷰 === */

/** 리뷰 전체 데이터 (메타 + 목록) */
export function getReviewsData(): ReviewsData {
  return reviewsData as unknown as ReviewsData;
}

/** 리뷰 목록만 */
export function getReviews(): ReviewItem[] {
  return (reviewsData as unknown as ReviewsData).reviews;
}

/** 리뷰 요약 (평점/개수) */
export function getReviewSummary() {
  return (reviewsData as unknown as ReviewsData).summary;
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
   관련 지역(이웃) 자동 조회 — 내부링크 강화용
   ========================================================================== */

/**
 * 같은 광역단체 내 이웃 생활권을 반환 (현재 slug 제외)
 * nearbyAreas → 부족하면 같은 province의 다른 ready 생활권으로 보충.
 */
export function getNearbyLifeAreas(province: Province, currentSlug: string, max = 8): LifeArea[] {
  const all = getReadyLifeAreas(province);
  const current = all.find((a) => a.slug === currentSlug);
  // 1순위: 데이터에 명시된 인접 생활권
  const nearbySlugs = current?.nearbyAreas ?? [];
  const nearby = nearbySlugs
    .map((s) => all.find((a) => a.slug === s))
    .filter((a): a is LifeArea => !!a && a.slug !== currentSlug);
  // 2순위: 부족하면 같은 province 다른 생활권으로 보충
  const result = [...nearby];
  if (result.length < max) {
    for (const a of all) {
      if (result.length >= max) break;
      if (a.slug === currentSlug) continue;
      if (result.find((r) => r.slug === a.slug)) continue;
      result.push(a);
    }
  }
  return result.slice(0, max);
}

/**
 * 같은 광역단체 내 이웃 행정구·시군을 반환 (현재 slug 제외)
 */
export function getNearbyDistricts(province: Province, currentSlug: string, max = 6): DistrictData[] {
  const all = getDistricts(province).filter((d) => !d.noindex);
  return all.filter((d) => d.slug !== currentSlug).slice(0, max);
}

/** 광역단체별 대표 롱테일 키워드 (내부링크 앵커 다양화용) */
export const LONGTAIL_KEYWORDS: Record<Province, string[]> = {
  seoul: [
    '출장마사지 방문 가능 지역',
    '홈타이 예약 전 확인사항',
    '호텔·오피스텔 방문 기준',
    '역세권 방문 가능 지역',
    '추가 이동비 안내',
  ],
  gyeonggi: [
    '시·군별 방문 가능 지역',
    '신도시 출장마사지 기준',
    '읍면동 방문 안내',
    '외곽 추가 이동비',
    '역세권 방문 가능 지역',
  ],
  incheon: [
    '구·군별 방문 가능 지역',
    '공항·도서 방문 기준',
    '신도시 출장마사지 안내',
    '역세권 방문 가능 지역',
    '추가 이동비 안내',
  ],
};
