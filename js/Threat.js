// 가해자 조직 & 패턴 JS

/*
[ API 연결 예정 메모 ]
현재 
- rawThreatData ( 로컬 js 파일 데이터 ) 기반으로 모든 통계 계산

나중에 API 연결 시 
1) rowThreatData
2) markerData
3) renderStats / renderCountrySummart

GET/api
*/
import { rawThreatData } from "./threatData.js";

function goBack() {
  window.location.href = "../index.html";
}
window.goBack = goBack;


let selectedCountry = null; //지금 지도에서 클릭한 나라
let currentCategory ="region"; //지금 보고 있는 카테고리 

//DOM 요소 가지고 오기 
const menuBtn = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const backBtn = document.querySelector(".back-btn");

const categoryButtons = document.querySelectorAll(".category-btn");
const statsSection = document.getElementById("statsSection");
const statsCircleWrap = document.getElementById("statsCircleWrap");
const statsTitle = document.getElementById("statsTitle");
const statsDesc = document.getElementById("statsDesc");
const categoryTitle = document.getElementById("categoryTitle");
const mapContainer = document.getElementById("mapContainer");


//지도 위험도 함수
function getRiskColorByIncidents(item){
  if (item.incidents >= 100) return "red";
  if (item.incidents >= 70) return "orange";
  if (item.incidents >= 40) return "yellow";
  return "green";
}



//지도 마커용 데이터 
const markerData = rawThreatData.map((item) => ({
  lat: item.lat,
  lng: item.lng,
  color: getRiskColorByIncidents(item),
  label: `${item.country} (${item.city})`,
  country: item.country
}));



// 사이드바 열기/닫기
function openSidebar() {
  if (sidebar) sidebar.classList.add("open");
  if (overlay) overlay.classList.add("show");
  if (menuBtn) menuBtn.classList.add("hide");
  if (backBtn) backBtn.classList.add("hide");
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
  if (menuBtn) menuBtn.classList.remove("hide");
  if (backBtn) backBtn.classList.remove("hide");
}

if (menuBtn) menuBtn.addEventListener("click", openSidebar);
if (closeBtn) closeBtn.addEventListener("click", closeSidebar);
if (overlay) overlay.addEventListener("click", closeSidebar);


let map = null;
let markerGroup = null;
//지도 생성
function createMap() {
  if (!mapContainer || typeof L === "undefined") return;

  map = L.map("mapContainer", {
    zoomControl: false,
    worldCopyJump: true,
    maxBounds: [
      [-60, -180],
      [85, 180]
    ],
    maxBoundsViscosity: 1.0
  });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
    }).addTo(map);

  map.setView([20, 20], 2);
  map.setMinZoom(2);
  map.setMaxZoom(6);

  markerGroup = L.layerGroup().addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

//마커 아이콘 생성
function createMarkerIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div class="custom-marker ${color}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

//지도 마커 렌더링
function renderMarkers() {
  if (!map || !markerGroup) return;

  markerGroup.clearLayers();

  markerData.forEach((marker) => {
    const leafletMarker = L.marker([marker.lat, marker.lng], {
      icon: createMarkerIcon(marker.color)
    }).bindPopup(marker.label);

    leafletMarker.on("click", () => {
      selectedCountry = marker.country;
      renderStats(currentCategory);
    });

    markerGroup.addLayer(leafletMarker);
  });
}

// 지도 클릭 시 팝업 닫기
function bindMapEvents() {
  if (!map) return;

  map.on("click", () => {
    selectedCountry = null;
    renderStats(currentCategory);
    map.closePopup();
  });
}


// ---------- 통계 계산 ----------
//그룹 합계 계산 함수 
function sumByKey(data, groupKey, valueKey) {
  const result = {};

  data.forEach((item) => {
    result[item[groupKey]] = (result[item[groupKey]] || 0) + item[valueKey];
  });

  return result;
}
//국가별 평균 계산
function avgByCountry(data) {
  const grouped = {};

  data.forEach((item) => {
    if (!grouped[item.country]) {
      grouped[item.country] = { total: 0, count: 0 };
    }

    grouped[item.country].total += item.extortionAmount;
    grouped[item.country].count += 1;
  });

  return Object.entries(grouped).map(([country, value]) => ({
    country,
    avg: Math.round(value.total / value.count)
  }));
}

//상위 지역 계산
function getTopRegions(data) {
  const regionTotals = sumByKey(data, "region", "incidents");

  return Object.entries(regionTotals)
    .map(([region, incidents]) => ({ region, incidents }))
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 4);
}

function getTopCountriesByAverageAmount(data) {
  return avgByCountry(data)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 4);
}

function getBotStats(data) {
  const botPercentList = data.map((item) => ({
    country: item.country,
    percent: Math.round(item.botScore * 100)
  }));

  const sorted = [...botPercentList].sort((a, b) => b.percent - a.percent);

  const avgPercent = Math.round(
    data.reduce((sum, item) => sum + item.botScore, 0) / data.length * 100
  );

  const highRiskCount = data.filter((item) => item.botScore >= 0.6).length;

  return {
    avgPercent,
    highest: sorted[0],
    second: sorted[1],
    highRiskCount
  };
}

function getTopMethodByCountry(data) {
  // 지금 데이터는 국가당 1행이라 그대로 method가 대표 방식이 됨
  // 나중에 같은 국가 여러 건 들어오면 group해서 최빈값 계산하도록 확장 가능
  return data
    .map((item) => ({
      country: item.country,
      method: item.method,
      incidents: item.incidents
    }))
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 4);
}

//필터링 데이터 반환 
function getFileteredData() {
    if(!selectedCountry) return rawThreatData;
    return rawThreatData.filter((item) => item.country === selectedCountry);
}


//카테고리 통계 데이터 생성 
function buildCategoryStats(data) {
  const topRegions = getTopRegions(data);
  const topCountriesMoney = getTopCountriesByAverageAmount(data);
  const botStats = getBotStats(data);
  const topMethods = getTopMethodByCountry(data);

  return {
    region: {
      title: "가해자 밀집 지역 통계",
      desc: "발생 건수 기준 상위 4개 지역",
      circles: topRegions.map((item, index) => ({
        label: `${index + 1}위 ${item.region}`,
        value: `${item.incidents}건`,
        color: ["red", "blue", "green", "orange"][index]
      }))
    },

    money: {
      title: "국가별 평균 협박 금액",
      desc: "평균 협박 금액 기준 상위 4개 국가",
      circles: topCountriesMoney.map((item, index) => ({
        label: `${index + 1}위 ${item.country}`,
        value: `$${item.avg}`,
        color: ["red", "blue", "green", "orange"][index]
      }))
    },

    bot: {
      title: "자동화 봇 비율",
      desc: "봇 사용 관련 핵심 지표",
      circles: [
        {
          label: "평균 봇 비율",
          value: `${botStats.avgPercent}%`,
          color: "red"
        },
        {
          label: `1위 ${botStats.highest.country}`,
          value: `${botStats.highest.percent}%`,
          color: "blue"
        },
        {
          label: `2위 ${botStats.second.country}`,
          value: `${botStats.second.percent}%`,
          color: "green"
        },
        {
          label: "고위험 국가 수",
          value: `${botStats.highRiskCount}개`,
          color: "orange"
        }
      ]
    },

    method: {
      title: "국가별 협박 방식",
      desc: "국가별 가장 많이 나타난 대표 협박 방식",
      circles: topMethods.map((item, index) => ({
        label: `${item.country}`,
        value: item.method,
        color: ["red", "blue", "green", "orange","yellow"][index]
      }))
    }
  };
}

function getCategoryStats() {
    const fileteredData = getFileteredData();

    if (selectedCountry){
        return buildSingleCountryStats(fileteredData);
    }
    return buildCategoryStats(fileteredData);
}



// 통계 렌더링
function renderStats(categoryKey) {

    if (selectedCountry){
        renderCountrySummart();
        return;
    }

    const stats = buildCategoryStats(rawThreatData);
    const data = stats[categoryKey];
    if (!data || !statsCircleWrap) return;

    if (statsTitle) statsTitle.textContent = data.title;
    if (statsDesc) statsDesc.textContent = data.desc;
    if (categoryTitle) categoryTitle.textContent = data.title;

    statsCircleWrap.innerHTML = "";
        
    data.circles.forEach((item) => {
        const card = document.createElement("div");
        card.className = "stat-card";

        card.innerHTML = `
        <div class="circle ${item.color}">${item.value}</div>
        <div class="stat-label">${item.label}</div>
        `;

        statsCircleWrap.appendChild(card);
    });

    if (statsSection) statsSection.classList.remove("hidden");
    }



//나라 클릭 시 상세 통계 렌더링 
function renderCountrySummart() {
  if (!statsCircleWrap || !selectedCountry) return;

  const item = rawThreatData.find((d) => d.country === selectedCountry);
  if (!item) return;

  // 1) 전세계 국가 순위 계산 (incidents 기준)
  const sortedCountries = [...rawThreatData].sort(
    (a, b) => b.incidents - a.incidents
  );

  const countryRank = sortedCountries.findIndex(
    (d) => d.country === item.country
  ) + 1;

  // 2) 국가별 평균 금액 순위 계산
  const sortedAmount = [...rawThreatData].sort(
    (a, b) => b.extortionAmount - a.extortionAmount
  );
  const amountRank = sortedAmount.findIndex((d) => d.country === item.country) + 1;

  // 3) 봇 비율
  const botPercent = Math.round(item.botScore * 100);

  // 4) 대표 협박 방식
  const topMethod = item.method;

  const countryCircles = [
    {
      label: `${item.country}<br> 전 세계 순위`,
      value: `${countryRank}위`,
      color: "red"
    },
    {
      label: `${item.country}<br> 평균 협박 금액`,
      value: `$${item.extortionAmount}`,
      color: "blue"
    },
    {
      label: `${item.country}<br> 봇 사용 비율`,
      value: `${botPercent}%`,
      color: "green"
    },
    {
      label: `${item.country}<br> 대표 협박 방식`,
      value: topMethod,
      color: "orange"
    }
  ];

  if (statsTitle) statsTitle.textContent = `${item.country} 요약 분석`;
  if (statsDesc) statsDesc.textContent = `${item.country} 선택 상태`;
  if (categoryTitle) categoryTitle.textContent = `${item.country} 상세 정보`;

  statsCircleWrap.innerHTML = "";

  countryCircles.forEach((item) => {
    const card = document.createElement("div");
    card.className = "stat-card";

    card.innerHTML = `
      <div class="circle ${item.color}">${item.value}</div>
      <div class="stat-label">${item.label}</div>
    `;

    statsCircleWrap.appendChild(card);
  });

  if (statsSection) statsSection.classList.remove("hidden");
}


// 카테고리 버튼 클릭 이벤트 
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const category = button.dataset.category;
    currentCategory = category;

    //카테고리 클릭 시 나라 선택 해제 -> 전세계 통계로 복귀 
    selectedCountry = null;

    //그래도 혹시 열려 있는 지도 팝업도 닫기 
    if (map) {
      map.closePopup();
    }

    renderStats(category);
    closeSidebar();
  });
});

// 초기 실행
createMap();
renderMarkers();
bindMapEvents();
renderStats("region");

// 창 크기 변경 시 지도 재계산
window.addEventListener("resize", () => {
  if (map) {
    map.invalidateSize();
  }
});