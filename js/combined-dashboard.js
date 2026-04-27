// 가해자 조직 패턴 + 글로벌 피해 현황 합친 JS

/* =========================
   통합 대시보드 JS
========================= */

/* -------------------------
   공통 화면 전환
------------------------- */
const dashboardSelect = document.getElementById("dashboardSelect");
const victimView = document.getElementById("victimView");
const threatView = document.getElementById("threatView");
const globalBackBtn = document.getElementById("globalBackBtn");

const openVictimViewBtn = document.getElementById("openVictimView");
const openThreatViewBtn = document.getElementById("openThreatView");

let victimMap;
let victimMarkersLayer;
let threatMap = null;
let threatMarkerGroup = null;

let victimLocationMarker = null;
let threatLocationMarker = null;

let selectedCategory = "countryTotal";
let selectedCountry = null;

let barChartInstance = null;
let donutChartInstance = null;
let countryDetailChartInstance = null;

let threatSelectedCountry = null;
let currentCategory = "region";

/* -------------------------
   공통 위치 기능
------------------------- */
function moveToMyLocation(targetMap, type) {
  if (!targetMap) return;

  if (!navigator.geolocation) {
    alert("이 브라우저에서는 위치 기능을 지원하지 않습니다.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

        const offsetY = type === "victim" ? -17 : -1;

      const marker = L.popup({
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        className: "my-location-popup",
        offset: [0, offsetY ],
      })
        .setLatLng([lat, lng])
        .setContent('<div class="my-location-label">현재 위치</div>')
        .openOn(targetMap);

      if (type === "victim") {
        if (victimLocationMarker) {
          targetMap.removeLayer(victimLocationMarker);
        }
        victimLocationMarker = marker;
      }

      if (type === "threat") {
        if (threatLocationMarker) {
          targetMap.removeLayer(threatLocationMarker);
        }
        threatLocationMarker = marker;
      }

      targetMap.setView([lat, lng], 6);
    },
    (error) => {
      console.log("GPS 오류:", error);
      alert("현재 위치를 가져올 수 없습니다. 브라우저 위치 권한을 허용해주세요.");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

/* -------------------------
   화면 전환
------------------------- */
function showSelectScreen() {
  dashboardSelect.classList.remove("hidden");
  victimView.classList.add("hidden");
  threatView.classList.add("hidden");
}

function showVictimView() {
  dashboardSelect.classList.add("hidden");
  victimView.classList.remove("hidden");
  threatView.classList.add("hidden");

  setTimeout(() => {
    if (!victimMap) {
      initVictimMap();
      setupVictimSidebar();
      setupVictimCategoryButtons();
      setupVictimMapReset();
      renderVictimCategoryData("countryTotal");

      setTimeout(() => {
        moveToMyLocation(victimMap, "victim");
      }, 500);
    } else {
      victimMap.invalidateSize();
      renderCharts();
    }
  }, 200);
}

function showThreatView() {
  dashboardSelect.classList.add("hidden");
  victimView.classList.add("hidden");
  threatView.classList.remove("hidden");

  setTimeout(() => {
    if (!threatMap) {
      createThreatMap();
      renderThreatMarkers();
      bindThreatMapEvents();
      setupThreatSidebar();
      setupThreatCategoryButtons();
      renderThreatStats("region");

      setTimeout(() => {
        moveToMyLocation(threatMap, "threat");
      }, 500);
    } else {
      threatMap.invalidateSize();
    }
  }, 200);
}

if (openVictimViewBtn) {
  openVictimViewBtn.addEventListener("click", showVictimView);
}

if (openThreatViewBtn) {
  openThreatViewBtn.addEventListener("click", showThreatView);
}

if (globalBackBtn) {
  globalBackBtn.addEventListener("click", () => {
    const isSelectVisible = !dashboardSelect.classList.contains("hidden");

    if (isSelectVisible) {
      window.location.href = "../index.html";
      return;
    }

    showSelectScreen();
  });
}

/* -------------------------
   피해 현황 데이터
------------------------- */
const categoryLabels = {
  countryTotal: "국가별 피해 발생",
  cityDensity: "도시 단위 발생 밀도",
  yearlyChange: "전년 대비 증감률",
  monthlyChange: "달별 피해 증감률",
  timeDayRate: "시간대 요일별 발생률",
  platformRate: "플랫폼별 발생률",
  typeRate: "유형별 발생 비중",
};

const fakeData = {
  countryTotal: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "128건", chartValue: 128 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "94건", chartValue: 94 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "203건", chartValue: 203 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "76건", chartValue: 76 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "167건", chartValue: 167 },
    { country: "캐나다", lat: 45.4215, lng: -75.6972, value: "63건", chartValue: 63 },
    { country: "멕시코", lat: 19.4326, lng: -99.1332, value: "72건", chartValue: 72 },
    { country: "브라질", lat: -23.5505, lng: -46.6333, value: "88건", chartValue: 88 },
    { country: "아르헨티나", lat: -34.6037, lng: -58.3816, value: "41건", chartValue: 41 },
    { country: "프랑스", lat: 48.8566, lng: 2.3522, value: "69건", chartValue: 69 },
    { country: "독일", lat: 52.52, lng: 13.405, value: "74건", chartValue: 74 },
    { country: "스페인", lat: 40.4168, lng: -3.7038, value: "57건", chartValue: 57 },
    { country: "이탈리아", lat: 41.9028, lng: 12.4964, value: "53건", chartValue: 53 },
    { country: "호주", lat: -33.8688, lng: 151.2093, value: "61건", chartValue: 61 },
    { country: "뉴질랜드", lat: -36.8485, lng: 174.7633, value: "28건", chartValue: 28 },
    { country: "필리핀", lat: 14.5995, lng: 120.9842, value: "66건", chartValue: 66 },
    { country: "태국", lat: 13.7563, lng: 100.5018, value: "59건", chartValue: 59 },
    { country: "베트남", lat: 21.0278, lng: 105.8342, value: "71건", chartValue: 71 },
    { country: "인도네시아", lat: -6.2088, lng: 106.8456, value: "84건", chartValue: 84 },
    { country: "남아프리카공화국", lat: -26.2041, lng: 28.0473, value: "39건", chartValue: 39 },
    { country: "나이지리아", lat: 6.5244, lng: 3.3792, value: "58건", chartValue: 58 },
    { country: "이집트", lat: 30.0444, lng: 31.2357, value: "47건", chartValue: 47 },
  ],

  cityDensity: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "서울 밀도 54", chartValue: 54 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "도쿄 밀도 47", chartValue: 47 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "뉴욕 밀도 66", chartValue: 66 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "런던 밀도 33", chartValue: 33 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "델리 밀도 59", chartValue: 59 },
    { country: "캐나다", lat: 45.4215, lng: -75.6972, value: "토론토 밀도 31", chartValue: 31 },
    { country: "멕시코", lat: 19.4326, lng: -99.1332, value: "멕시코시티 밀도 38", chartValue: 38 },
    { country: "브라질", lat: -23.5505, lng: -46.6333, value: "상파울루 밀도 42", chartValue: 42 },
    { country: "프랑스", lat: 48.8566, lng: 2.3522, value: "파리 밀도 36", chartValue: 36 },
    { country: "독일", lat: 52.52, lng: 13.405, value: "베를린 밀도 34", chartValue: 34 },
    { country: "호주", lat: -33.8688, lng: 151.2093, value: "시드니 밀도 29", chartValue: 29 },
    { country: "나이지리아", lat: 6.5244, lng: 3.3792, value: "라고스 밀도 41", chartValue: 41 },
  ],

  yearlyChange: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "+12%", chartValue: 12 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "+8%", chartValue: 8 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "+19%", chartValue: 19 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "+6%", chartValue: 6 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "+14%", chartValue: 14 },
    { country: "브라질", lat: -23.5505, lng: -46.6333, value: "+11%", chartValue: 11 },
    { country: "독일", lat: 52.52, lng: 13.405, value: "+7%", chartValue: 7 },
    { country: "베트남", lat: 21.0278, lng: 105.8342, value: "+10%", chartValue: 10 },
    { country: "인도네시아", lat: -6.2088, lng: 106.8456, value: "+13%", chartValue: 13 },
    { country: "나이지리아", lat: 6.5244, lng: 3.3792, value: "+9%", chartValue: 9 },
  ],

  monthlyChange: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "+4.2%", chartValue: 4.2 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "-1.1%", chartValue: 1.1 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "+7.6%", chartValue: 7.6 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "+2.4%", chartValue: 2.4 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "+5.8%", chartValue: 5.8 },
    { country: "캐나다", lat: 45.4215, lng: -75.6972, value: "+2.1%", chartValue: 2.1 },
    { country: "브라질", lat: -23.5505, lng: -46.6333, value: "+3.9%", chartValue: 3.9 },
    { country: "프랑스", lat: 48.8566, lng: 2.3522, value: "+2.8%", chartValue: 2.8 },
    { country: "태국", lat: 13.7563, lng: 100.5018, value: "+4.5%", chartValue: 4.5 },
    { country: "이집트", lat: 30.0444, lng: 31.2357, value: "+2.6%", chartValue: 2.6 },
  ],

  timeDayRate: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "금요일 / 22시", chartValue: 82 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "토요일 / 23시", chartValue: 76 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "일요일 / 21시", chartValue: 88 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "금요일 / 20시", chartValue: 64 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "토요일 / 22시", chartValue: 79 },
    { country: "독일", lat: 52.52, lng: 13.405, value: "토요일 / 21시", chartValue: 62 },
    { country: "브라질", lat: -23.5505, lng: -46.6333, value: "일요일 / 23시", chartValue: 68 },
    { country: "필리핀", lat: 14.5995, lng: 120.9842, value: "금요일 / 23시", chartValue: 71 },
    { country: "호주", lat: -33.8688, lng: 151.2093, value: "토요일 / 20시", chartValue: 55 },
    { country: "나이지리아", lat: 6.5244, lng: 3.3792, value: "일요일 / 22시", chartValue: 67 },
  ],

  platformRate: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "Instagram 45%", chartValue: 45 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "LINE 52%", chartValue: 52 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "Snapchat 37%", chartValue: 37 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "WhatsApp 31%", chartValue: 31 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "Telegram 41%", chartValue: 41 },
    { country: "브라질", lat: -23.5505, lng: -46.6333, value: "Instagram 39%", chartValue: 39 },
    { country: "독일", lat: 52.52, lng: 13.405, value: "Telegram 33%", chartValue: 33 },
    { country: "태국", lat: 13.7563, lng: 100.5018, value: "LINE 44%", chartValue: 44 },
    { country: "필리핀", lat: 14.5995, lng: 120.9842, value: "Facebook 42%", chartValue: 42 },
    { country: "멕시코", lat: 19.4326, lng: -99.1332, value: "WhatsApp 36%", chartValue: 36 },
  ],

  typeRate: [
    { country: "대한민국", lat: 37.5665, lng: 126.9780, value: "몸캠 피싱 61%", chartValue: 61 },
    { country: "일본", lat: 35.6762, lng: 139.6503, value: "연애빙자형 42%", chartValue: 42 },
    { country: "미국", lat: 38.9072, lng: -77.0369, value: "SNS 유도형 55%", chartValue: 55 },
    { country: "영국", lat: 51.5072, lng: -0.1276, value: "협박형 36%", chartValue: 36 },
    { country: "인도", lat: 28.6139, lng: 77.2090, value: "메신저 유도형 49%", chartValue: 49 },
    { country: "브라질", lat: -23.5505, lng: -46.6333, value: "SNS 유도형 44%", chartValue: 44 },
    { country: "프랑스", lat: 48.8566, lng: 2.3522, value: "협박형 35%", chartValue: 35 },
    { country: "인도네시아", lat: -6.2088, lng: 106.8456, value: "메신저 유도형 46%", chartValue: 46 },
    { country: "나이지리아", lat: 6.5244, lng: 3.3792, value: "파일 유도형 38%", chartValue: 38 },
    { country: "호주", lat: -33.8688, lng: 151.2093, value: "SNS 유도형 34%", chartValue: 34 },
  ],
};

/* -------------------------
   피해 지도
------------------------- */
function initVictimMap(lat = 20, lng = 0, zoom = 2) {
  victimMap = L.map("victimMap", {
    minZoom: 2,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0,
  }).setView([lat, lng], zoom);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(victimMap);

  victimMarkersLayer = L.layerGroup().addTo(victimMap);

  setTimeout(() => {
    victimMap.invalidateSize();
  }, 200);
}

function updateVictimCurrentLabel() {
  const currentLabel = document.getElementById("currentCategoryLabel");
  if (!currentLabel) return;

  if (selectedCountry) {
    currentLabel.textContent = `현재 선택: ${selectedCountry} / 카테고리별 데이터`;
  } else {
    currentLabel.textContent = `현재 선택: ${categoryLabels[selectedCategory]}`;
  }
}

function renderVictimCategoryData(categoryKey) {
  selectedCategory = categoryKey;
  selectedCountry = null;

  victimMarkersLayer.clearLayers();
  updateVictimCurrentLabel();

  const selectedData = fakeData[categoryKey] || [];

  selectedData.forEach((item) => {
const marker = L.circleMarker([item.lat, item.lng], {
  radius: 8,
  color: "rgba(255,255,255,0.95)",
  weight: 2,
  fillColor: "#8b5cf6",
  fillOpacity: 0.9,
});

    marker.bindPopup(`
      <div class="data-popup">
        <strong>${item.country}</strong><br/>
        ${categoryLabels[categoryKey]}: ${item.value}
      </div>
    `);

    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      selectedCountry = item.country;
      openCountryDetail(item.country);
    });

    marker.addTo(victimMarkersLayer);
  });

  renderCharts();
}

function setupVictimSidebar() {
  const menuBtn = document.getElementById("victimMenuBtn");
  const closeBtn = document.getElementById("victimCloseBtn");
  const sidebar = document.getElementById("victimSidebar");

  if (!menuBtn || !closeBtn || !sidebar) return;

  menuBtn.onclick = () => {
    sidebar.classList.remove("closed");
    sidebar.classList.add("open");
  };

  closeBtn.onclick = () => {
    sidebar.classList.remove("open");
    sidebar.classList.add("closed");
  };
}

function setupVictimCategoryButtons() {
  const buttons = document.querySelectorAll(".victim-category");

  buttons.forEach((button) => {
    button.onclick = () => {
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const category = button.dataset.category;
      renderVictimCategoryData(category);

      const sidebar = document.getElementById("victimSidebar");
      if (sidebar) {
        sidebar.classList.remove("open");
        sidebar.classList.add("closed");
      }
    };
  });
}

function setupVictimMapReset() {
  if (!victimMap) return;

  victimMap.on("click", () => {
    selectedCountry = null;
    selectedCategory = "countryTotal";
    setActiveVictimCategoryButton("countryTotal");
    renderVictimCategoryData("countryTotal");
  });
}

function setActiveVictimCategoryButton(categoryKey) {
  const buttons = document.querySelectorAll(".victim-category");
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === categoryKey);
  });
}

/* -------------------------
   국가 상세 차트
------------------------- */
function getCountryDetailData(countryName) {
  const baseData = (fakeData.countryTotal || []).find(
    (item) => item.country === countryName
  );

  const baseValue = baseData?.chartValue || 50;

  const fallbackValues = {
    countryTotal: baseValue,
    cityDensity: Math.round(baseValue * 0.42),
    yearlyChange: Math.max(4, Math.round(baseValue * 0.08)),
    monthlyChange: Math.max(1, Math.round(baseValue * 0.025)),
    timeDayRate: Math.min(90, Math.round(baseValue * 0.55)),
    platformRate: Math.min(70, Math.round(baseValue * 0.38)),
    typeRate: Math.min(75, Math.round(baseValue * 0.43)),
  };

  return Object.keys(categoryLabels).map((categoryKey) => {
    const found = (fakeData[categoryKey] || []).find(
      (item) => item.country === countryName
    );

    return {
      categoryKey,
      label: categoryLabels[categoryKey],
      value: found?.value || `${fallbackValues[categoryKey]}`,
      chartValue: found?.chartValue ?? fallbackValues[categoryKey],
    };
  });
}

function renderCountryDetailChart(countryName) {
  const canvas = document.getElementById("countryDetailChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (countryDetailChartInstance) {
    countryDetailChartInstance.destroy();
  }

  const details = getCountryDetailData(countryName);

  const labels = details.map((item) => item.label.split(" "));
  const values = details.map((item) => item.chartValue ?? 0);

  const detail3DPlugin = {
    id: "detail3DBar",

    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);

      meta.data.forEach((bar) => {
        const { x, y, base, width } = bar.getProps(
          ["x", "y", "base", "width"],
          true
        );

        const depth = 9;
        const left = x - width / 2;
        const right = x + width / 2;

        ctx.save();

        // 오른쪽 면
        ctx.beginPath();
        ctx.moveTo(right, y);
        ctx.lineTo(right + depth, y - depth);
        ctx.lineTo(right + depth, base - depth);
        ctx.lineTo(right, base);
        ctx.closePath();
        ctx.fillStyle = "rgba(76, 29, 149, 0.38)";
        ctx.fill();

        // 윗면
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.lineTo(right + depth, y - depth);
        ctx.lineTo(left + depth, y - depth);
        ctx.closePath();
        ctx.fillStyle = "rgba(191, 219, 254, 0.5)";
        ctx.fill();

        // 앞면 광택
        const shine = ctx.createLinearGradient(left, y, right, y);
        shine.addColorStop(0, "rgba(255,255,255,0.28)");
        shine.addColorStop(0.45, "rgba(255,255,255,0.04)");
        shine.addColorStop(1, "rgba(0,0,0,0.18)");

        ctx.fillStyle = shine;
        ctx.fillRect(left, y, width, base - y);

        ctx.shadowColor = "rgba(147,197,253,0.75)";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 1;
        ctx.strokeRect(left, y, width, base - y);

        ctx.restore();
      });
    },
  };

  countryDetailChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          barThickness: 26,
          borderRadius: 5,
          borderWidth: 0,
          backgroundColor: [
            "#2563eb",
            "#3b82f6",
            "#60a5fa",
            "#93c5fd",
            "#8b5cf6",
            "#7c8df8",
            "#c4b5fd",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 22,
          right: 18,
          bottom: 4,
          left: 0,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderColor: "rgba(168, 85, 247, 0.75)",
          borderWidth: 1,
          titleColor: "#ffffff",
          bodyColor: "#e9d5ff",
          cornerRadius: 12,
          padding: 12,
          displayColors: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#ffffff",
            font: {
              size: 12,
              weight: "700",
            },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
            padding: 8,
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "rgba(255,255,255,0.85)",
            font: { size: 13 },
          },
          grid: {
            color: "rgba(168,85,247,0.14)",
          },
          border: { display: false },
        },
      },
    },
    plugins: [detail3DPlugin],
  });
}

function openCountryDetail(countryName) {
  const modal = document.getElementById("countryDetailModal");
  const chartSection = document.querySelector("#victimView .chart-section");
  const detailTitle = document.getElementById("detailTitle");
  const mainContent = document.getElementById("victimMainContent");

  if (mainContent) mainContent.classList.add("expanded-map");
  if (detailTitle) detailTitle.textContent = `${countryName} 상세 데이터`;

  renderCountryDetailChart(countryName);

  if (modal) modal.classList.remove("hidden");
  if (chartSection) chartSection.classList.add("hidden");

  setTimeout(() => {
    if (victimMap) victimMap.invalidateSize();
  }, 200);
}

function closeCountryDetail() {
  const modal = document.getElementById("countryDetailModal");
  const chartSection = document.querySelector("#victimView .chart-section");
  const mainContent = document.getElementById("victimMainContent");

  if (mainContent) mainContent.classList.remove("expanded-map");
  if (modal) modal.classList.add("hidden");
  if (chartSection) chartSection.classList.remove("hidden");

  setTimeout(() => {
    if (victimMap) victimMap.invalidateSize();
    renderCharts();
  }, 200);
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "closeDetailBtn") {
    closeCountryDetail();
  }
});

/* =========================
   3D 막대 차트
========================= */
function renderBarChart() {
  const canvas = document.getElementById("barChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (barChartInstance) {
    barChartInstance.destroy();
  }

    const sorted = [...(fakeData[selectedCategory] || [])]
    .sort((a, b) => b.chartValue - a.chartValue)
    .slice(0, 4);

  const labels = sorted.map((item) => item.country);
  const values = sorted.map((item) => item.chartValue);

  const titleEl = document.getElementById("barChartTitle");
  if (titleEl) titleEl.textContent = `${categoryLabels[selectedCategory]} TOP 4 순위`;

  const bar3DPlugin = {
    id: "strongBar3D",

    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);

      meta.data.forEach((bar) => {
        const { x, y, base, width } = bar.getProps(
          ["x", "y", "base", "width"],
          true
        );

        const depth = 12;
        const left = x - width / 2;
        const right = x + width / 2;

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(right, y);
        ctx.lineTo(right + depth, y - depth);
        ctx.lineTo(right + depth, base - depth);
        ctx.lineTo(right, base);
        ctx.closePath();
        ctx.fillStyle = "rgba(76, 29, 149, 0.45)";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.lineTo(right + depth, y - depth);
        ctx.lineTo(left + depth, y - depth);
        ctx.closePath();
        ctx.fillStyle = "rgba(191, 219, 254, 0.55)";
        ctx.fill();

        const shine = ctx.createLinearGradient(left, y, right, y);
        shine.addColorStop(0, "rgba(255,255,255,0.30)");
        shine.addColorStop(0.45, "rgba(255,255,255,0.05)");
        shine.addColorStop(1, "rgba(0,0,0,0.22)");

        ctx.fillStyle = shine;
        ctx.fillRect(left, y, width, base - y);

        ctx.shadowColor = "rgba(168, 85, 247, 0.95)";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(left, y, width, base - y);

        ctx.restore();
      });
    },
  };

  barChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: values,
        barThickness: 30,
        borderRadius: 4,
        backgroundColor: [
          "#2563eb",
          "#3b82f6",
          "#60a5fa",
          "#93c5fd",
          "#bfdbfe",
        ],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 26,
          right: 24,
          bottom: 8,
          left: 0,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderColor: "rgba(168, 85, 247, 0.8)",
          borderWidth: 1,
          titleColor: "#ffffff",
          bodyColor: "#e9d5ff",
          cornerRadius: 12,
          padding: 12,
          displayColors: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#ffffff",
            font: { size: 14, weight: "700" },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "rgba(255,255,255,0.85)",
            font: { size: 13 },
          },
          grid: { color: "rgba(168,85,247,0.15)" },
          border: { display: false },
        },
      },
    },
    plugins: [bar3DPlugin],
  });
}


function getDonutDataByCategory(categoryKey) {
  const donutDataMap = {
    countryTotal: {
      title: "피해 유형 비율",
      data: [
        { label: "SNS 유도형", value: 32 },
        { label: "메신저 유도형", value: 26 },
        { label: "파일 유도형", value: 22 },
        { label: "연애 유도형", value: 20 },
      ],
    },

    cityDensity: {
      title: "도시 밀집 유형 비율",
      data: [
        { label: "대도시", value: 42 },
        { label: "수도권", value: 28 },
        { label: "관광지", value: 18 },
        { label: "기타", value: 12 },
      ],
    },

    yearlyChange: {
      title: "전년 대비 증감 유형",
      data: [
        { label: "증가", value: 58 },
        { label: "유지", value: 24 },
        { label: "감소", value: 12 },
        { label: "급증", value: 6 },
      ],
    },

    monthlyChange: {
      title: "월별 변동 유형",
      data: [
        { label: "증가세", value: 45 },
        { label: "완만", value: 30 },
        { label: "감소세", value: 15 },
        { label: "급변", value: 10 },
      ],
    },

    timeDayRate: {
      title: "발생 시간대 비율",
      data: [
        { label: "야간", value: 40 },
        { label: "주말", value: 25 },
        { label: "평일", value: 22 },
        { label: "새벽", value: 13 },
      ],
    },

    platformRate: {
      title: "플랫폼별 비율",
      data: [
        { label: "Instagram", value: 35 },
        { label: "LINE", value: 25 },
        { label: "Telegram", value: 22 },
        { label: "기타", value: 18 },
      ],
    },

    typeRate: {
      title: "피해 유형 비율",
      data: [
        { label: "몸캠 피싱", value: 38 },
        { label: "SNS 유도형", value: 27 },
        { label: "메신저 유도형", value: 21 },
        { label: "연애 유도형", value: 14 },
      ],
    },
  };

  return donutDataMap[categoryKey] || donutDataMap.countryTotal;
}

/* =========================
   3D 도넛 차트
========================= */
function renderDonutChart() {
  const canvas = document.getElementById("donutChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (donutChartInstance) {
    donutChartInstance.destroy();
  }

  const donutInfo = getDonutDataByCategory(selectedCategory);
  const typeData = donutInfo.data;

  const labels = typeData.map((item) => item.label);
  const values = typeData.map((item) => item.value);

  const titleEl = document.getElementById("donutChartTitle");
  if (titleEl) titleEl.textContent = donutInfo.title;

  const colors = ["#8b5cf6", "#7c8df8", "#60a5fa", "#93c5fd"];
  const sideColors = ["#6d5bd0", "#5b6ee1", "#3b82f6", "#60a5fa"];

  const donut3DPlugin = {
    id: "strongDonut3D",

    beforeDatasetDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);

      ctx.save();

      for (let depth = 10; depth > 0; depth -= 2) {
        meta.data.forEach((arc, index) => {
          const props = arc.getProps(
            ["x", "y", "startAngle", "endAngle", "innerRadius", "outerRadius"],
            true
          );

          ctx.beginPath();
          ctx.arc(props.x, props.y + depth, props.outerRadius, props.startAngle, props.endAngle);
          ctx.arc(props.x, props.y + depth, props.innerRadius, props.endAngle, props.startAngle, true);
          ctx.closePath();

          ctx.fillStyle = sideColors[index % sideColors.length];
          ctx.fill();
        });
      }

      ctx.restore();
    },

    afterDatasetDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      const arc = meta.data[0];

      if (!arc) return;

      const { x, y, innerRadius, outerRadius } = arc.getProps(
        ["x", "y", "innerRadius", "outerRadius"],
        true
      );

      ctx.save();

      ctx.shadowColor = "rgba(168,85,247,0.9)";
      ctx.shadowBlur = 24;

      ctx.beginPath();
      ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(8, 10, 30, 0.96)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, outerRadius - 4, Math.PI * 1.05, Math.PI * 1.85);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 7;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(168,85,247,0.45)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    },
  };

  donutChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: "rgba(255,255,255,0.22)",
          borderWidth: 2,
          hoverOffset: 8,
          spacing: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      radius: "76%",
      cutout: "46%",
      rotation: -0.6,
      layout: {
        padding: {
          top: 8,
          bottom: 30,
        },
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#ffffff",
            boxWidth: 12,
            padding: 12,
            font: { size: 14, weight: "700" },
          },
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderColor: "rgba(168, 85, 247, 0.8)",
          borderWidth: 1,
          titleColor: "#ffffff",
          bodyColor: "#e9d5ff",
          cornerRadius: 12,
          padding: 12,
          displayColors: false,
          callbacks: {
            label(context) {
              return `${context.label}: ${context.raw}%`;
            },
          },
        },
      },
    },
    plugins: [donut3DPlugin],
  });
}

function renderCharts() {
  renderBarChart();
  renderDonutChart();
}

/* -------------------------
   가해자 분석 데이터
------------------------- */
const rawThreatData = [
  { country: "대한민국", city: "서울", region: "아시아", lat: 37.5665, lng: 126.9780, incidents: 112, extortionAmount: 1800, botScore: 0.68, method: "메신저 <br>유도형" },
  { country: "일본", city: "도쿄", region: "아시아", lat: 35.6762, lng: 139.6503, incidents: 88, extortionAmount: 2100, botScore: 0.57, method: "연애 <br> 유도형" },
  { country: "인도", city: "델리", region: "아시아", lat: 28.6139, lng: 77.2090, incidents: 98, extortionAmount: 1500, botScore: 0.63, method: "파일 <br>유도형" },
  { country: "필리핀", city: "마닐라", region: "아시아", lat: 14.5995, lng: 120.9842, incidents: 61, extortionAmount: 1300, botScore: 0.55, method: "SNS <br> 유도형" },

  { country: "미국", city: "뉴욕", region: "북미", lat: 40.7128, lng: -74.0060, incidents: 134, extortionAmount: 2600, botScore: 0.74, method: "SNS <br>유도형" },
  { country: "캐나다", city: "토론토", region: "북미", lat: 43.6532, lng: -79.3832, incidents: 58, extortionAmount: 2200, botScore: 0.48, method: "협박 <br>형" },
  { country: "멕시코", city: "멕시코시티", region: "북미", lat: 19.4326, lng: -99.1332, incidents: 67, extortionAmount: 1700, botScore: 0.51, method: "파일 <br> 유도형" },

  { country: "영국", city: "런던", region: "유럽", lat: 51.5072, lng: -0.1276, incidents: 72, extortionAmount: 1700, botScore: 0.49, method: "협박 <br> 형" },
  { country: "프랑스", city: "파리", region: "유럽", lat: 48.8566, lng: 2.3522, incidents: 69, extortionAmount: 1900, botScore: 0.53, method: "연애 <br> 유도형" },
  { country: "독일", city: "베를린", region: "유럽", lat: 52.52, lng: 13.405, incidents: 64, extortionAmount: 1850, botScore: 0.46, method: "메신저 <br> 유도형" },

  { country: "브라질", city: "상파울루", region: "남미", lat: -23.5505, lng: -46.6333, incidents: 81, extortionAmount: 1600, botScore: 0.58, method: "SNS <br> 유도형" },
  { country: "아르헨티나", city: "부에노스아이레스", region: "남미", lat: -34.6037, lng: -58.3816, incidents: 32, extortionAmount: 1400, botScore: 0.44, method: "협박 <br>형" },

  { country: "호주", city: "시드니", region: "오세아니아", lat: -33.8688, lng: 151.2093, incidents: 55, extortionAmount: 2400, botScore: 0.5, method: "SNS <br> 유도형" },

  { country: "남아프리카공화국", city: "요하네스버그", region: "아프리카", lat: -26.2041, lng: 28.0473, incidents: 28, extortionAmount: 1200, botScore: 0.47, method: "파일 <br> 유도형" },
  { country: "나이지리아", city: "라고스", region: "아프리카", lat: 6.5244, lng: 3.3792, incidents: 73, extortionAmount: 1100, botScore: 0.69, method: "메신저 <br>유도형" }
];


const statsSection = document.getElementById("statsSection");
const statsCircleWrap = document.getElementById("statsCircleWrap");
const statsTitle = document.getElementById("statsTitle");
const statsDesc = document.getElementById("statsDesc");
const categoryTitle = document.getElementById("categoryTitle");
const mapContainer = document.getElementById("mapContainer");

function getRiskColorByIncidents(item) {
  if (item.incidents >= 100) return "red";
  if (item.incidents >= 70) return "orange";
  if (item.incidents >= 40) return "yellow";
  return "green";
}

const markerData = rawThreatData.map((item) => ({
  lat: item.lat,
  lng: item.lng,
  color: getRiskColorByIncidents(item),
  label: `${item.country} (${item.city})`,
  country: item.country,
}));

function setupThreatSidebar() {
  const menuBtn = document.getElementById("threatMenuBtn");
  const closeBtn = document.getElementById("threatCloseBtn");
  const sidebar = document.getElementById("threatSidebar");

  if (menuBtn && sidebar) {
    menuBtn.onclick = () => {
      sidebar.classList.remove("closed");
      sidebar.classList.add("open");
    };
  }

  if (closeBtn && sidebar) {
    closeBtn.onclick = () => {
        sidebar.classList.remove("open");
      sidebar.classList.add("closed");
    };
  }
}

function createThreatMap() {
  if (!mapContainer || typeof L === "undefined") return;

  threatMap = L.map("mapContainer", {
    zoomControl: false,
    worldCopyJump: true,
    maxBounds: [[-60, -180], [85, 180]],
    maxBoundsViscosity: 1.0,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(threatMap);

  threatMap.setView([20, 20], 2);
  threatMap.setMinZoom(2);
  threatMap.setMaxZoom(6);

  threatMarkerGroup = L.layerGroup().addTo(threatMap);

  setTimeout(() => {
    threatMap.invalidateSize();
  }, 300);
}

function createMarkerIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div class="custom-marker ${color}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function renderThreatMarkers() {
  if (!threatMap || !threatMarkerGroup) return;

  threatMarkerGroup.clearLayers();

  markerData.forEach((marker) => {
    const leafletMarker = L.marker([marker.lat, marker.lng], {
      icon: createMarkerIcon(marker.color),
    }).bindPopup(marker.label);

    // ✅ 나라 클릭 → 해당 국가 통계
    leafletMarker.on("click", () => {
      threatSelectedCountry = marker.country;
      renderThreatStats(currentCategory);
    });

    // ✅ 팝업 X 클릭 → 전체 통계로 복귀
    leafletMarker.on("popupclose", () => {
      threatSelectedCountry = null;
      currentCategory = "region";

      renderThreatStats("region");

      // ⭐ 카테고리 버튼 active도 같이 초기화
      const buttons = document.querySelectorAll(".threat-category");
      buttons.forEach((btn) => {
        btn.classList.toggle(
          "active",
          btn.dataset.category === "region"
        );
      });
    });

    threatMarkerGroup.addLayer(leafletMarker);
  });
}

function bindThreatMapEvents() {
  if (!threatMap) return;

  threatMap.on("click", () => {
    threatSelectedCountry = null;
    renderThreatStats(currentCategory);
    threatMap.closePopup();
  });
}

function sumByKey(data, groupKey, valueKey) {
  const result = {};

  data.forEach((item) => {
    result[item[groupKey]] = (result[item[groupKey]] || 0) + item[valueKey];
  });

  return result;
}

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
    avg: Math.round(value.total / value.count),
  }));
}

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
    percent: Math.round(item.botScore * 100),
  }));

  const sorted = [...botPercentList].sort((a, b) => b.percent - a.percent);

  const avgPercent = Math.round(
    (data.reduce((sum, item) => sum + item.botScore, 0) / data.length) * 100
  );

  const highRiskCount = data.filter((item) => item.botScore >= 0.6).length;

  return {
    avgPercent,
    highest: sorted[0],
    second: sorted[1],
    highRiskCount,
  };
}

function getTopMethodByCountry(data) {
  return data
    .map((item) => ({
      country: item.country,
      method: item.method,
      incidents: item.incidents,
    }))
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 4);
}

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
        color: ["red", "blue", "green", "orange"][index],
      })),
    },
    money: {
      title: "국가별 평균 협박 금액",
      desc: "평균 협박 금액 기준 상위 4개 국가",
      circles: topCountriesMoney.map((item, index) => ({
        label: `${index + 1}위 ${item.country}`,
        value: `$${item.avg}`,
        color: ["red", "blue", "green", "orange"][index],
      })),
    },
    bot: {
      title: "자동화 봇 비율",
      desc: "봇 사용 관련 핵심 지표",
      circles: [
        { label: "평균 봇 비율", value: `${botStats.avgPercent}%`, color: "red" },
        { label: `1위 ${botStats.highest.country}`, value: `${botStats.highest.percent}%`, color: "blue" },
        { label: "최근 증가율", value: "+12%", color: "green" },
        { label: "고위험 패턴", value: "메신저 <br> 유도형", color: "orange"},
      ],
    },
    method: {
      title: "국가별 협박 방식",
      desc: "국가별 가장 많이 나타난 대표 협박 방식",
      circles: topMethods.map((item, index) => ({
        label: `${item.country}`,
        value: item.method,
        color: ["red", "blue", "green", "orange"][index],
      })),
    },
  };
}

function renderThreatCountrySummary() {
  if (!statsCircleWrap || !threatSelectedCountry) return;

  const item = rawThreatData.find((d) => d.country === threatSelectedCountry);
  if (!item) return;

  const sortedCountries = [...rawThreatData].sort((a, b) => b.incidents - a.incidents);
  const countryRank = sortedCountries.findIndex((d) => d.country === item.country) + 1;
  const botPercent = Math.round(item.botScore * 100);

  const countryCircles = [
    { label: `${item.country}<br> 전 세계 순위`, value: `${countryRank}위`, color: "red" },
    { label: `${item.country}<br> 평균 협박 금액`, value: `$${item.extortionAmount}`, color: "blue" },
    { label: `${item.country}<br> 봇 사용 비율`, value: `${botPercent}%`, color: "green" },
    { label: `${item.country}<br> 대표 협박 방식`, value: item.method, color: "orange" },
  ];

  if (statsTitle) statsTitle.textContent = `${item.country} 요약 분석`;
  if (statsDesc) statsDesc.textContent = "";
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

function renderThreatStats(categoryKey) {
  if (threatSelectedCountry) {
    renderThreatCountrySummary();
    return;
  }

  const stats = buildCategoryStats(rawThreatData);
  const data = stats[categoryKey];

  if (!data || !statsCircleWrap) return;

  if (statsTitle) statsTitle.textContent = data.title;
  if (statsDesc) statsDesc.textContent = "";
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

function setupThreatCategoryButtons() {
  const buttons = document.querySelectorAll(".threat-category");

  buttons.forEach((button) => {
    button.onclick = () => {
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      currentCategory = button.dataset.category;
      threatSelectedCountry = null;

      if (threatMap) threatMap.closePopup();

      renderThreatStats(currentCategory);

      const sidebar = document.getElementById("threatSidebar");
      if (sidebar) {
        sidebar.classList.remove("open");
        sidebar.classList.add("closed");
      }
    };
  });
}

/* 초기 */
showSelectScreen();