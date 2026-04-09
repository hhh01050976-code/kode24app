// 공통 변수만 관리 

/*
[ API 연결 예정 메모 ]
현재
- fakeData에 모든 지도 데이터 저장
- 지도, 차트, 카테고리 모두 이 데이터 사용


나중에 실제 API 연결 시 
1)  fakeData 제거
2) 서버에서 데이터 받아오기
3) setCurrentLocation / renderCategoryData

이 파일은 데이터 중심 파일이라 
fakeData만 api로 바꾸면 전체 시스템 연결 됌 
*/

let map;
let markersLayer;

let selectedCategory = "countryTotal";
let selectedCountry = null;

// 카테고리 라벨
const categoryLabels = {
  countryTotal: "국가별 피해 발생",
  cityDensity: "도시 단위 발생 밀도",
  yearlyChange: "전년 대비 증감률",
  monthlyChange: "달별 피해 증감률",
  timeDayRate: "시간대 요일별 발생률",
  platformRate: "플랫폼별 발생률",
  typeRate: "유형별 발생 비중",
};

// 일단 가짜 JSON 데이터
// 나중에 공공데이터 API 또는 서버 JSON으로 대체 가능
const fakeData = {
  countryTotal: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "128건", chartValue: 128 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "94건", chartValue: 94 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "203건", chartValue: 203 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "76건", chartValue: 76 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "167건", chartValue: 167 },
  ],

  cityDensity: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "서울 밀도 54", chartValue: 54 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "도쿄 밀도 47", chartValue: 47 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "뉴욕 밀도 66", chartValue: 66 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "런던 밀도 33", chartValue: 33 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "델리 밀도 59", chartValue: 59 },
  ],

  yearlyChange: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "+12%", chartValue: 12 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "+8%", chartValue: 8 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "+19%", chartValue: 19 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "+6%", chartValue: 6 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "+14%", chartValue: 14 },
  ],

  monthlyChange: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "+4.2%", chartValue: 4.2 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "-1.1%", chartValue: 1.1 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "+7.6%", chartValue: 7.6 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "+2.4%", chartValue: 2.4 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "+5.8%", chartValue: 5.8 },
  ],

  timeDayRate: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "금요일 / 22시", chartValue: 82 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "토요일 / 23시", chartValue: 76 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "일요일 / 21시", chartValue: 88 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "금요일 / 20시", chartValue: 64 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "토요일 / 22시", chartValue: 79 },
  ],

  platformRate: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "Instagram 45%", chartValue: 45 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "LINE 52%", chartValue: 52 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "Snapchat 37%", chartValue: 37 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "WhatsApp 31%", chartValue: 31 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "Telegram 41%", chartValue: 41 },
  ],

  typeRate: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "몸캠 피싱 61%", chartValue: 61 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "연애빙자형 42%", chartValue: 42 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "SNS 유도형 55%", chartValue: 55 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "협박형 36%", chartValue: 36 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "메신저 유도형 49%", chartValue: 49 },
  ],
};

// 지도 초기화
function initMap(lat = 20, lng = 0, zoom = 2) {
  map = L.map("map", {
    minZoom: 2,
    maxBounds: [
      [-85, -180],
      [85, 180]
    ],
    maxBoundsViscosity: 1.0
  }).setView([lat, lng], zoom);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

// 사용자 위치 가져오기
function setCurrentLocation() {
  if (!navigator.geolocation) {
    console.log("브라우저가 위치 정보를 지원하지 않습니다.");
    renderCategoryData("countryTotal");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      map.setView([userLat, userLng], 3);

      L.circleMarker([userLat, userLng], {
        radius: 5,
        fillColor: "#ef4444",
        color: "#ffffff",
        weight: 1,
        opacity: 1,
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup('<div class="my-location-popup">현재 위치</div>')
        .openPopup();

      renderCategoryData("countryTotal");
    },
    (error) => {
      console.log("위치 가져오기 실패:", error);
      // 실패하면 서울 기준으로 보여주기
      map.setView([37.5665, 126.9780], 3);
      renderCategoryData("countryTotal");
    }
  );
}

//뒤로가기 함수
function goBack() {
  window.location.href = "../html/Home.html";
}


//국가 상세 모달 열기 
function openCountryDetail(countryName) {
  const modal = document.getElementById("countryDetailModal");
  const chartSection = document.querySelector(".chart-section");
  const detailTitle = document.getElementById("detailTitle");
  const mainContent = document.getElementById("mainContent");

  if (mainContent) mainContent.classList.add("expanded-map");

  if (detailTitle) {
    detailTitle.textContent = `${countryName} 상세 데이터`;
  }

  renderCountryDetailChart(countryName);

  if (modal) modal.classList.remove("hidden");
  if (chartSection) chartSection.classList.add("hidden");

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 200);
}
//국가 상세 모달 닫기 
function closeCountryDetail() {
  const modal = document.getElementById("countryDetailModal");
  const chartSection = document.querySelector(".chart-section");
  const mainContent = document.getElementById("mainContent");

  if (mainContent) mainContent.classList.remove("expanded-map");
  if (modal) modal.classList.add("hidden");
  if (chartSection) chartSection.classList.remove("hidden");

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 200);
}
document.getElementById("closeDetailBtn").addEventListener("click", closeCountryDetail);

//상단 라벨 업데이트 
function updateCurrentLabel() {
  const currentLabel = document.getElementById("currentCategoryLabel");
  if (!currentLabel) return;

  currentLabel.textContent = `현재 선택: ${categoryLabels[selectedCategory]}`;
}