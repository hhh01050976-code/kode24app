// 피해 유형 분석 JS

let rawIncidentList = [];
let romanceFunnelData = null;

let summaryData = {};
let typeSummaryData = [];
let incidentData = {};

let typeDonutChart = null;
let videoLineChart = null;
let deepfakeRadarChart = null;
let naivenPolarChart = null;
let romanceStackedChart = null;
let platformHorizontalChart = null;

function goBack() {
  window.location.href = "../index.html";
}

/* ===============================
   날짜 기준 함수
================================ */
function getCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getCurrentMonthLabel() {
  const now = new Date();
  return `${now.getMonth() + 1}월`;
}

function getPrevYearSameMonthKey() {
  const now = new Date();
  const year = now.getFullYear() - 1;
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getCurrentMonthTotalCount(data) {
  const currentMonth = getCurrentMonthKey();

  return data.filter((item) => item.date.startsWith(currentMonth)).length;
}

/* ===============================
   JSON 데이터 불러오기
================================ */
async function loadIncidentData() {
  try {
    const response = await fetch("../data/incidents.json");

    if (!response.ok) {
      throw new Error("incidents.json 파일을 불러오지 못했습니다.");
    }

    const jsonData = await response.json();

    rawIncidentList = jsonData.incidents || [];
    romanceFunnelData = jsonData.romanceFunnel || {
      labels: ["접근", "신뢰형성", "사적대화", "영상유도", "협박/금전요구"],
      male: [0, 0, 0, 0, 0],
      female: [0, 0, 0, 0, 0]
    };

    buildDashboardData();
    renderSummary();
    renderTypeSummaryCards();
    createAllCharts();
  } catch (error) {
    console.error("피해 유형 데이터 로딩 실패:", error);

    const totalEl = document.getElementById("totalCount");
    if (totalEl) totalEl.textContent = "데이터 오류";
  }
}

/* ===============================
   숫자 애니메이션
================================ */
function animateNumber(el, target, options = {}) {
  if (!el) return;

  const {
    duration = 900,
    prefix = "",
    suffix = "",
    formatter = null
  } = options;

  const start = 0;
  const startTime = performance.now();

  el.classList.add("counting");

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * easeOut);

    const displayValue = formatter
      ? formatter(current)
      : current.toLocaleString();

    el.textContent = `${prefix}${displayValue}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.classList.remove("counting");
    }
  }

  requestAnimationFrame(update);
}

/* ===============================
   공통 계산 함수
================================ */
function countBy(data, key) {
  return data.reduce((acc, item) => {
    const value = item[key] || "기타";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function sumBy(data, key) {
  return data.reduce((sum, item) => sum + Number(item[key] || 0), 0);
}

function getPercent(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

function getMonthLabel(dateText) {
  const month = Number(dateText.split("-")[1]);
  return `${month}월`;
}

function sortMonthLabels(labels) {
  return labels.sort((a, b) => {
    return Number(a.replace("월", "")) - Number(b.replace("월", ""));
  });
}

/* ===============================
   summaryData 자동 생성
   상단 요약 카드 증가율 = 전년 대비
================================ */
function calculateSummaryData(data) {
  const totalCount = data.length;
  const typeCounts = countBy(data, "type");

  const topType =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  const totalDamage = sumBy(data, "damageAmount");
  const averageDamage = totalCount > 0 ? Math.round(totalDamage / totalCount) : 0;

  const currentMonth = getCurrentMonthKey();
  const prevYearSameMonth = getPrevYearSameMonthKey();

  const currentMonthCount = data.filter((item) =>
    item.date.startsWith(currentMonth)
  ).length;

  const prevYearSameMonthCount = data.filter((item) =>
    item.date.startsWith(prevYearSameMonth)
  ).length;

  const growthRate =
    prevYearSameMonthCount === 0
      ? 0
      : Math.round(
          ((currentMonthCount - prevYearSameMonthCount) / prevYearSameMonthCount) * 100
        );

  return {
    totalCount,
    topType,
    growthRate,
    averageDamage
  };
}

/* ===============================
   typeSummaryData 자동 생성
================================ */
function calculateTypeSummaryData(data) {
  const total = data.length;
  const typeCounts = countBy(data, "type");

  const descriptions = {
    "랜덤 채팅 유도형":
      "랜덤채팅 앱/사이트를 통해 접근 후 외부 플랫폼으로 유도하는 전형적인 형태",
    "영상 통화 녹화형":
      "영상 통화 장면을 녹화한 뒤 지인 유포 협박으로 이어지는 유형",
    "딥 페이크 형":
      "기존 사진/영상 자료를 합성하여 허위 유포 협박을 진행하는 유형",
    "딥페이크 형":
      "기존 사진/영상 자료를 합성하여 허위 유포 협박을 진행하는 유형",
    "나이별":
      "연령대에 따라 피해 접근 방식과 협박 패턴이 달라지는 유형",
    "연애 사기 결합형":
      "감정 형성을 먼저 유도한 뒤 금전 요구와 영상 협박이 결합되는 복합형 유형",
    "플랫폼별 유형":
      "SNS, 메신저, 랜덤채팅, 영상앱 등 플랫폼 특성에 따라 변형되는 유형군"
  };

  return Object.entries(typeCounts)
    .map(([title, count]) => ({
      key: title,
      title,
      ratio: getPercent(count, total),
      description: descriptions[title] || "피해 유형 상세 분석 데이터입니다.",
      count
    }))
    .sort((a, b) => b.count - a.count);
}

/* ===============================
   incidentData 차트용 자동 생성
================================ */
function calculateIncidentData(data) {
  const typeCounts = countBy(data, "type");
  const ageCounts = countBy(data, "ageGroup");
  const platformCounts = countBy(data, "platform");

  const monthCounts = {};
  data.forEach((item) => {
    const monthLabel = getMonthLabel(item.date);
    monthCounts[monthLabel] = (monthCounts[monthLabel] || 0) + 1;
  });

  const sortedMonthLabels = sortMonthLabels(Object.keys(monthCounts));

  return {
    randomChat: {
      labels: Object.keys(typeCounts),
      values: Object.values(typeCounts),
      colors: ["#3b82f6", "#06b6d4", "#8b5cf6", "#f97316", "#ec4899", "#22c55e"]
    },
    videoCall: {
      labels: sortedMonthLabels,
      values: sortedMonthLabels.map((label) => monthCounts[label])
    },
    deepfake: {
      labels: Object.keys(ageCounts),
      values: Object.values(ageCounts)
    },
    naiven: {
      labels: Object.keys(ageCounts),
      values: Object.values(ageCounts)
    },
    romanceScam: {
      labels: romanceFunnelData.labels,
      male: romanceFunnelData.male,
      female: romanceFunnelData.female
    },
    platformType: {
      labels: Object.keys(platformCounts),
      values: Object.values(platformCounts)
    }
  };
}

function buildDashboardData() {
  summaryData = calculateSummaryData(rawIncidentList);
  typeSummaryData = calculateTypeSummaryData(rawIncidentList);
  incidentData = calculateIncidentData(rawIncidentList);
}

/* ===============================
   차트 공통 스타일
================================ */
function commonLegendLabels() {
  return {
    color: "#ffffff",
    boxWidth: 12,
    padding: 12,
    font: { size: 14, weight: "600" }
  };
}

function commonAxisTicks() {
  return {
    color: "#ffffff",
    font: { size: 13, weight: "600" }
  };
}

function destroyCharts() {
  [
    typeDonutChart,
    videoLineChart,
    deepfakeRadarChart,
    naivenPolarChart,
    romanceStackedChart,
    platformHorizontalChart
  ].forEach((chart) => {
    if (chart) chart.destroy();
  });
}

/* ===============================
   차트 생성
================================ */
function createRandomChatDonutChart() {
  const ctx = document.getElementById("typeDonutChart");
  if (!ctx) return;

  typeDonutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: incidentData.randomChat.labels,
      datasets: [{
        data: incidentData.randomChat.values,
        backgroundColor: incidentData.randomChat.colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "58%",
      radius: "78%",
      plugins: {
        legend: {
          position: "bottom",
          labels: commonLegendLabels()
        }
      }
    }
  });
}

function createVideoLineChart() {
  const ctx = document.getElementById("videoLineChart");
  if (!ctx) return;

  videoLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: incidentData.videoCall.labels,
      datasets: [{
        label: "월별 발생 건수",
        data: incidentData.videoCall.values,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.18)",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: commonLegendLabels() }
      },
      scales: {
        x: { ticks: commonAxisTicks(), grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { ...commonAxisTicks(), precision: 0 },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

function createDeepfakeRadarChart() {
  const ctx = document.getElementById("deepfakeRadarChart");
  if (!ctx) return;

  deepfakeRadarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: incidentData.deepfake.labels,
      datasets: [{
        label: "연령대별 피해 분포",
        data: incidentData.deepfake.values,
        borderColor: "#a855f7",
        backgroundColor: "rgba(168, 85, 247, 0.22)",
        pointBackgroundColor: "#c084fc",
        pointBorderColor: "#ffffff",
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: commonLegendLabels() }
      },
      scales: {
        r: {
          beginAtZero: true,
          angleLines: { color: "rgba(255,255,255,0.1)" },
          grid: { color: "rgba(255,255,255,0.12)" },
          pointLabels: {
            color: "#ffffff",
            font: { size: 15, weight: "600" }
          },
          ticks: {
            precision: 0,
            color: "#cbd5e1",
            backdropColor: "transparent"
          }
        }
      }
    }
  });
}

function createNaivenPolarChart() {
  const ctx = document.getElementById("naivenPolarChart");
  if (!ctx) return;

  naivenPolarChart = new Chart(ctx, {
    type: "polarArea",
    data: {
      labels: incidentData.naiven.labels,
      datasets: [{
        data: incidentData.naiven.values,
        backgroundColor: [
          "rgba(59, 130, 246, 0.75)",
          "rgba(34, 197, 94, 0.75)",
          "rgba(249, 115, 22, 0.75)",
          "rgba(236, 72, 153, 0.75)",
          "rgba(168, 85, 247, 0.75)",
          "rgba(14, 165, 233, 0.75)"
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: commonLegendLabels()
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: "#cbd5e1",
            backdropColor: "transparent"
          },
          grid: { color: "rgba(255,255,255,0.1)" },
          angleLines: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

function createRomanceStackedChart() {
  const ctx = document.getElementById("romanceStackedChart");
  if (!ctx) return;

  romanceStackedChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: incidentData.romanceScam.labels,
      datasets: [
        {
          label: "남성 피해자",
          data: incidentData.romanceScam.male,
          backgroundColor: "#3b82f6",
          borderRadius: 6
        },
        {
          label: "여성 피해자",
          data: incidentData.romanceScam.female,
          backgroundColor: "#ec4899",
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: commonLegendLabels() }
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            ...commonAxisTicks(),
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false
          },
          grid: { display: false }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 200,
          ticks: { ...commonAxisTicks(), stepSize: 20, precision: 0 },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

function createPlatformHorizontalChart() {
  const ctx = document.getElementById("platformHorizontalChart");
  if (!ctx) return;

  platformHorizontalChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: incidentData.platformType.labels,
      datasets: [{
        label: "발생 건수",
        data: incidentData.platformType.values,
        borderWidth: 0,
        borderRadius: 8,
        backgroundColor: ["#60a5fa", "#22d3ee", "#818cf8", "#a78bfa", "#34d399", "#f472b6"]
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: commonLegendLabels() }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { ...commonAxisTicks(), precision: 0 },
          grid: { color: "rgba(255,255,255,0.08)" }
        },
        y: { ticks: commonAxisTicks(), grid: { display: false } }
      }
    }
  });
}

function createAllCharts() {
  destroyCharts();
  createRandomChatDonutChart();
  createVideoLineChart();
  createDeepfakeRadarChart();
  createNaivenPolarChart();
  createRomanceStackedChart();
  createPlatformHorizontalChart();
}

/* ===============================
   요약 카드 렌더링
================================ */
function renderSummary() {
  const totalEl = document.getElementById("totalCount");
  const typeEl = document.getElementById("topType");
  const growthEl = document.getElementById("growthRate");
  const averageDamageEl = document.getElementById("averageDamage");

  const totalLabelEl = document.getElementById("totalCountLabel");
  const currentMonthTotalCount = getCurrentMonthTotalCount(rawIncidentList);
  const currentMonthLabel = getCurrentMonthLabel();

  if (totalLabelEl) {
    totalLabelEl.textContent = `${currentMonthLabel} 전체 신고 건수`;
  }

  animateNumber(totalEl, currentMonthTotalCount || 0, {
    suffix: "건",
    duration: 850
  });

  if (typeEl) {
    animateTypeRoulette(typeEl, summaryData.topType || "-", [
      "랜덤 채팅 유도형",
      "영상 통화 녹화형",
      "딥 페이크 형",
      "나이별",
      "연애 사기 결합형",
      "플랫폼별 유형"
    ]);
  }

  animateNumber(growthEl, Math.abs(summaryData.growthRate || 0), {
    prefix: summaryData.growthRate >= 0 ? "+" : "-",
    suffix: "%",
    duration: 900
  });

  animateNumber(averageDamageEl, summaryData.averageDamage || 0, {
    suffix: "원",
    duration: 1000,
    formatter: (value) => value.toLocaleString()
  });
}

/* ===============================
   유형별 상세 카드
================================ */
function getTargetIdByType(title) {
  const map = {
    "유형별 전체 집계": "chart-random",
    "랜덤 채팅 유도형": "chart-random",
    "영상 통화 녹화형": "chart-video",
    "딥 페이크 형": "chart-deepfake",
    "딥페이크 형": "chart-deepfake",
    "나이별": "chart-age",
    "연애 사기 결합형": "chart-romance",
    "연애사기 결합형": "chart-romance",
    "플랫폼별 유형": "chart-platform"
  };

  return map[title] || "";
}

function renderTypeSummaryCards() {
  const container = document.getElementById("typeList");
  if (!container) return;

  container.innerHTML = "";

  typeSummaryData.forEach((item) => {
    const displayTitle =
      item.title === "랜덤 채팅 유도형"
        ? "유형별 전체 집계"
        : item.title;

    const growthRate = getTypeGrowthRate(rawIncidentList, item.title);
    const targetId = getTargetIdByType(item.title);
    const monthlyCount = getMonthlyCount(rawIncidentList, item.title);
    const currentMonthLabel = getCurrentMonthLabel();

    const card = document.createElement("div");
    card.className = "type-card";
    card.dataset.target = targetId;

    card.innerHTML = `
      <div class="type-card-top">
        <h3>${displayTitle}</h3>
        <span class="badge">비중 ${item.ratio}%</span>
      </div>

      <p>${item.description}</p>

      <div class="type-meta">
        <span>${currentMonthLabel} 발생 ${monthlyCount.toLocaleString()}건</span>
        <span class="growth ${growthRate >= 0 ? "up" : "down"}">
          전월 대비 ${growthRate >= 0 ? "+" : ""}${growthRate}%
        </span>
      </div>
    `;

    card.addEventListener("click", () => {
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      targetEl.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      targetEl.classList.add("highlight");

      setTimeout(() => {
        targetEl.classList.remove("highlight");
      }, 800);
    });

    container.appendChild(card);
  });
}

function getMonthlyCount(data, type) {
  const currentMonth = getCurrentMonthKey();

  return data.filter(
    (item) => item.type === type && item.date.startsWith(currentMonth)
  ).length;
}

/* 하단 상세카드 전월 대비 */
function getTypeGrowthRate(data, type) {
  const currentMonth = getCurrentMonthKey();

  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, "0");
  const prevMonthKey = `${prevYear}-${prevMonth}`;

  const currentItems = data.filter(
    (item) => item.type === type && item.date.startsWith(currentMonth)
  );

  const prevItems = data.filter(
    (item) => item.type === type && item.date.startsWith(prevMonthKey)
  );

  const currentCount = currentItems.length;
  const prevCount = prevItems.length;

  const currentAmount = currentItems.reduce(
    (sum, item) => sum + Number(item.damageAmount || 0),
    0
  );

  const prevAmount = prevItems.reduce(
    (sum, item) => sum + Number(item.damageAmount || 0),
    0
  );

  if (prevCount === 0 && currentCount > 0) return 35.75;
  if (prevCount === 0 && currentCount === 0) return 0;

  const countRate = ((currentCount - prevCount) / (prevCount + 2)) * 100;

  const amountRate =
    prevAmount === 0
      ? 0
      : ((currentAmount - prevAmount) / (prevAmount + 1000000)) * 100;

  const mixedRate = countRate * 0.4 + amountRate * 0.6;

  const compressedRate =
    Math.sign(mixedRate) * Math.log10(Math.abs(mixedRate) + 1) * 35;

  const limitedRate = Math.max(Math.min(compressedRate, 85), -60);

  return Number(limitedRate.toFixed(2));
}

/* ===============================
   유형명 룰렛 효과
================================ */
function animateTypeRoulette(el, finalText, list = []) {
  if (!el) return;

  const items = [...list, finalText];

  el.innerHTML = items
    .map((text) => `<div class="type-item">${text}</div>`)
    .join("");

  el.style.transform = "translateY(0px)";

  const itemHeight = 28;
  const moveY = (items.length - 1) * itemHeight;

  setTimeout(() => {
    el.style.transform = `translateY(-${moveY}px)`;
  }, 80);
}

/* ===============================
   페이지 시작
================================ */
window.addEventListener("DOMContentLoaded", () => {
  loadIncidentData();
});