// 차트 함수만 관리 [ 글로벌 피해 현황 ]

/*
[ API 연결 예정 메모 ]
현재
- fakeData 기반으로 차트 데이터 생성
- selectedCategory / selectedCountry 기준으로 필터링

나중에
1) getCountryDetailData()
2) renderBarChart / renderDonutChart
3) 전체 차트 구조는 그대로 사용 가능
   데이터만 API로 교체하면 됨
*/

let barChartInstance = null;
let donutChartInstance = null;
let countryDetailChartInstance = null;

// 국가 클릭 시 상세 데이터 생성
function getCountryDetailData(countryName) {
  const details = [];

  Object.keys(categoryLabels).forEach((categoryKey) => {
    const found = (fakeData[categoryKey] || []).find(
      (item) => item.country === countryName
    );

    if (found) {
      details.push({
        categoryKey,
        label: categoryLabels[categoryKey],
        value: found.value,
        chartValue: found.chartValue ?? found.value ?? 0,
      });
    }
  });

  return details;
}

// 나라 클릭 시 상세 차트 렌더링
function renderCountryDetailChart(countryName) {
  const canvas = document.getElementById("countryDetailChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (countryDetailChartInstance) {
    countryDetailChartInstance.destroy();
  }

  const details = getCountryDetailData(countryName);

  const labels = details.map((item) => {
    return item.label.split(" ");
  });

  const values = details.map((item) => item.chartValue ?? item.value ?? 0);

  countryDetailChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderWidth: 0,
          borderRadius: 8,
          backgroundColor: [
            "#2563eb",
            "#3b82f6",
            "#60a5fa",
            "#93c5fd",
            "#a78bfa",
            "#8b5cf6",
            "#7c3aed",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      layout: {
        padding: {
          top: 10,
          bottom: 0,
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#e2e8f0",
            font: {
              size: 13,
              weight: "600",
            },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
            padding: 6,
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: "#ffffff",
            font: {
              size: 15,
            },
          },
          grid: {
            color: "rgba(255,255,255,0.08)",
          },
        },
      },
    },
  });
}

// 상단 현재 선택 라벨 업데이트
function updateCurrentLabel() {
  const currentLabel = document.getElementById("currentCategoryLabel");

  if (!currentLabel) return;

  if (selectedCountry) {
    currentLabel.textContent = `현재 선택: ${selectedCountry} / 카테고리별 데이터`;
  } else {
    currentLabel.textContent = `현재 선택: ${categoryLabels[selectedCategory]}`;
  }
}

// 활성 카테고리 버튼 상태 업데이트
function setActiveCategoryButton(categoryKey) {
  const buttons = document.querySelectorAll(".category-btn");

  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === categoryKey);
  });
}

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

  const sorted = [...(fakeData[selectedCategory] || [])].sort(
    (a, b) => b.chartValue - a.chartValue
  );

  const labels = sorted.map((item) => item.country);
  const values = sorted.map((item) => item.chartValue);

  const titleEl = document.getElementById("barChartTitle");
  if (titleEl) {
    titleEl.textContent = `${categoryLabels[selectedCategory]} TOP 순위`;
  }

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

        // 오른쪽 3D 면
        ctx.beginPath();
        ctx.moveTo(right, y);
        ctx.lineTo(right + depth, y - depth);
        ctx.lineTo(right + depth, base - depth);
        ctx.lineTo(right, base);
        ctx.closePath();
        ctx.fillStyle = "rgba(46, 16, 101, 0.95)";
        ctx.fill();

        // 윗면
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.lineTo(right + depth, y - depth);
        ctx.lineTo(left + depth, y - depth);
        ctx.closePath();
        ctx.fillStyle = "rgba(216, 180, 254, 0.9)";
        ctx.fill();

        // 앞면 광택
        const shine = ctx.createLinearGradient(left, y, right, y);
        shine.addColorStop(0, "rgba(255,255,255,0.28)");
        shine.addColorStop(0.45, "rgba(255,255,255,0.04)");
        shine.addColorStop(1, "rgba(0,0,0,0.18)");

        ctx.fillStyle = shine;
        ctx.fillRect(left, y, width, base - y);

        // 네온 외곽선
        ctx.shadowColor = "rgba(168, 85, 247, 0.95)";
        ctx.shadowBlur = 18;
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
      datasets: [
        {
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
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 24,
          right: 22,
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
            font: {
              size: 14,
              weight: "700",
            },
          },
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "rgba(255,255,255,0.85)",
            font: {
              size: 13,
            },
          },
          grid: {
            color: "rgba(168,85,247,0.15)",
          },
          border: {
            display: false,
          },
        },
      },
    },
    plugins: [bar3DPlugin],
  });
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

  const sorted = [...(fakeData[selectedCategory] || [])].sort(
    (a, b) => b.chartValue - a.chartValue
  );

  const labels = sorted.map((item) => item.country);
  const values = sorted.map((item) => item.chartValue);

  const titleEl = document.getElementById("donutChartTitle");
  if (titleEl) {
    titleEl.textContent = `${categoryLabels[selectedCategory]} TOP 순위`;
  }

  const colors = ["#a855f7", "#7c3aed", "#5b21b6", "#4c1d95", "#c084fc"];

  const sideColors = ["#581c87", "#4c1d95", "#3b0764", "#2e1065", "#6b21a8"];

  const donut3DPlugin = {
    id: "strongDonut3D",

    beforeDatasetDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);

      ctx.save();

      // 도넛 아래쪽을 여러 번 복제해서 두께감 만들기
      for (let depth = 20; depth > 0; depth -= 2) {
        meta.data.forEach((arc, index) => {
          const props = arc.getProps(
            [
              "x",
              "y",
              "startAngle",
              "endAngle",
              "innerRadius",
              "outerRadius",
            ],
            true
          );

          ctx.beginPath();

          ctx.arc(
            props.x,
            props.y + depth,
            props.outerRadius,
            props.startAngle,
            props.endAngle
          );

          ctx.arc(
            props.x,
            props.y + depth,
            props.innerRadius,
            props.endAngle,
            props.startAngle,
            true
          );

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

      // 전체 네온 외곽
      ctx.shadowColor = "rgba(168,85,247,0.9)";
      ctx.shadowBlur = 24;

      ctx.beginPath();
      ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // 중앙 구멍 어둡게
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(8, 10, 30, 0.96)";
      ctx.fill();

      // 상단 하이라이트
      ctx.beginPath();
      ctx.arc(x, y, outerRadius - 4, Math.PI * 1.05, Math.PI * 1.85);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 7;
      ctx.stroke();

      // 안쪽 네온 링
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
            font: {
              size: 14,
              weight: "700",
            },
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
        },
      },
    },
    plugins: [donut3DPlugin],
  });
}

// 차트 전체 갱신
function renderCharts() {
  renderBarChart();
  renderDonutChart();
}