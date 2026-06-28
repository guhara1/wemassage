/**
 * 한국어 → 로마자 슬러그 변환 (행정동 URL용)
 *
 * 「국어의 로마자 표기법」(2000, 문화관광부) 기본 원칙을 단순화하여 적용.
 * 정확한 표기보다는 URL 슬러그로서의 가독성·일관성이 목적.
 *
 * 참고: SEO를 위해 영문 슬러그 사용 (예: 역삼동 → yeoksam-dong)
 */

/** 자음(초성) 매핑 */
const CHO: Record<string, string> = {
  ㄱ: 'g', ㄲ: 'kk', ㄴ: 'n', ㄷ: 'd', ㄸ: 'tt', ㄹ: 'r', ㅁ: 'm',
  ㅂ: 'b', ㅃ: 'pp', ㅅ: 's', ㅆ: 'ss', ㅇ: '', ㅈ: 'j', ㅉ: 'jj',
  ㅊ: 'ch', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 'h',
};

/** 중성 매핑 */
const JUNG: Record<string, string> = {
  ㅏ: 'a', ㅐ: 'ae', ㅑ: 'ya', ㅒ: 'yae', ㅓ: 'eo', ㅔ: 'e', ㅕ: 'yeo',
  ㅖ: 'ye', ㅗ: 'o', ㅘ: 'wa', ㅙ: 'wae', ㅚ: 'oe', ㅛ: 'yo', ㅜ: 'u',
  ㅝ: 'wo', ㅞ: 'we', ㅟ: 'wi', ㅠ: 'yu', ㅡ: 'eu', ㅢ: 'ui', ㅣ: 'i',
};

/** 종성 매핑 */
const JONG: Record<string, string> = {
  ㄱ: 'k', ㄲ: 'k', ㄳ: 'k', ㄴ: 'n', ㄵ: 'n', ㄶ: 'n', ㄷ: 't',
  ㄹ: 'l', ㄺ: 'k', ㄻ: 'm', ㄼ: 'l', ㄽ: 'l', ㄾ: 'l', ㄿ: 'l',
  ㅀ: 'l', ㅁ: 'm', ㅂ: 'p', ㅄ: 'p', ㅅ: 't', ㅆ: 't', ㅇ: 'ng',
  ㅈ: 't', ㅊ: 't', ㅋ: 'k', ㅌ: 't', ㅍ: 'p', ㅎ: 't',
};

const HANGEUL_START = 0xac00;
const HANGEUL_END = 0xd7a3;

/** 한글 음절 한 글자를 로마자로 변환 */
function syllableToRoman(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code < HANGEUL_START || code > HANGEUL_END) return ch;
  const value = code - HANGEUL_START;
  const choIdx = Math.floor(value / 588);
  const jungIdx = Math.floor((value % 588) / 28);
  const jongIdx = value % 28;

  const CHO_LIST = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG_LIST = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG_LIST = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

  const cho = CHO[CHO_LIST[choIdx]] ?? '';
  const jung = JUNG[JUNG_LIST[jungIdx]] ?? '';
  const jong = jongIdx === 0 ? '' : (JONG[JONG_LIST[jongIdx]] ?? '');

  return cho + jung + jong;
}

/** 문자열을 URL용 로마자 슬러그로 변환 */
export function romanize(input: string): string {
  if (!input) return '';
  let result = '';
  for (const ch of input) {
    result += syllableToRoman(ch);
  }
  // 정리: 소문자, 공백/특수문자 → 하이픈, 연속 하이픈 축약, 끝 trim
  return result
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
