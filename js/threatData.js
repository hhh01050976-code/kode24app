//가해자 활동 패턴 분석 가짜 데이터 더미들

/*
[API 연결 예정 메모]

나중에 실제 API 연결 시 이 파일은 더 이상 사용하지 않음 (삭제 가능)
기존 코드에서 import 제거 후 fetch로 교체
*/

export const rawThreatData = [
  {
    region: "동남아",
    country: "태국",
    city: "방콕",
    incidents: 120,
    extortionAmount: 1400,
    botScore: 0.82,
    method: "영상 유도형",
    lat: 13.7563,
    lng: 100.5018,
    color: "red"
  },
  {
    region: "동남아",
    country: "필리핀",
    city: "마닐라",
    incidents: 95,
    extortionAmount: 1100,
    botScore: 0.74,
    method: "영상 유도형",
    lat: 14.5995,
    lng: 120.9842,
    color: "red"
  },
  {
    region: "동아시아",
    country: "한국",
    city: "서울",
    incidents: 88,
    extortionAmount: 980,
    botScore: 0.43,
    method: "링크 유도형",
    lat: 37.5665,
    lng: 126.9780,
    color: "blue"
  },
  {
    region: "동아시아",
    country: "일본",
    city: "도쿄",
    incidents: 73,
    extortionAmount: 1050,
    botScore: 0.39,
    method: "직접 협박형",
    lat: 35.6762,
    lng: 139.6503,
    color: "blue"
  },
  {
    region: "유럽",
    country: "독일",
    city: "프랑크푸르트",
    incidents: 44,
    extortionAmount: 870,
    botScore: 0.31,
    method: "링크 유도형",
    lat: 50.1109,
    lng: 8.6821,
    color: "green"
  },
  {
    region: "중동",
    country: "아랍에미리트",
    city: "두바이",
    incidents: 39,
    extortionAmount: 1320,
    botScore: 0.52,
    method: "직접 협박형",
    lat: 25.2048,
    lng: 55.2708,
    color: "orange"
  },
  {
    region: "아프리카",
    country: "나이지리아",
    city: "아부자",
    incidents: 41,
    extortionAmount: 760,
    botScore: 0.64,
    method: "영상 유도형",
    lat: 9.0820,
    lng: 8.6753,
    color: "green"
  },
  {
    region: "남미",
    country: "브라질",
    city: "브라질리아",
    incidents: 52,
    extortionAmount: 690,
    botScore: 0.48,
    method: "혼합형",
    lat: -15.7939,
    lng: -47.8828,
    color: "red"
  },
  {
    region: "북미",
    country: "미국",
    city: "뉴욕",
    incidents: 61,
    extortionAmount: 1600,
    botScore: 0.36,
    method: "링크 유도형",
    lat: 40.7128,
    lng: -74.0060,
    color: "blue"
  },
  {
    region: "오세아니아",
    country: "호주",
    city: "시드니",
    incidents: 24,
    extortionAmount: 830,
    botScore: 0.28,
    method: "혼합형",
    lat: -33.8688,
    lng: 151.2093,
    color: "blue"
  }
];
