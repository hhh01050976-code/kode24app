// 카테고리 클릭/지도 클릭 넣기

/*
[API 연결 예정 메모]
현재
- fakeData에서 카테고리 별 데이터 가져와 지도에 표시 
나중에 실제 API 연결 시 변경
1) fakeData
2) renderCategoryData()
3) openCountryDetatil()


*/

// 카테고리 데이터 지도에 표시
function renderCategoryData(categoryKey) {
  selectedCategory = categoryKey;
  selectedCountry = null;

  markersLayer.clearLayers();
  updateCurrentLabel();

  const selectedData = fakeData[categoryKey] || [];

  selectedData.forEach((item) => {
    const marker = L.marker([item.lat, item.lng], {
  icon: L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/252/252025.png",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  })
});

    marker.bindPopup(`
      <div class="data-popup">
        <strong>${item.country}</strong><br/>
        ${categoryLabels[categoryKey]}: ${item.value}
      </div>
    `);

    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      openCountryDetail(item.country);
    });

    marker.addTo(markersLayer);
  });

  renderCharts();
}

// 사이드바 토글
function setupSidebar() {
  const menuBtn = document.getElementById("menuBtn");
  const closeBtn = document.getElementById("closeBtn");
  const sidebar = document.getElementById("sidebar");

  if (!menuBtn || !closeBtn || !sidebar) return;

  menuBtn.addEventListener("click", () => {
    sidebar.classList.remove("closed");
  });

  closeBtn.addEventListener("click", () => {
    sidebar.classList.add("closed");
  });
}

// 카테고리 버튼
function setupCategoryButtons() {
  const buttons = document.querySelectorAll(".category-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const category = button.dataset.category;
      selectedCountry = null;
      renderCategoryData(category);

      const sidebar = document.getElementById("sidebar");
      if (sidebar) {
        sidebar.classList.add("closed");
      }
    });
  });
}

// 지도 빈 곳 클릭 시 초기화
function setupMapReset() {
  if (!map) return;

  map.on("click", () => {
    selectedCountry = null;
    selectedCategory = "countryTotal";

    setActiveCategoryButton("countryTotal");
    updateCurrentLabel();
    renderCategoryData("countryTotal");
  });
}

// 시작
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  setupSidebar();
  setupCategoryButtons();
  setupMapReset();
  setCurrentLocation();
});