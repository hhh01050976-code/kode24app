// 차트 함수만 관리

/*
[ API 연결 예정 메모 ]
현재
- fakeData 기반으로 차트 데이터 생성
- selectedCategory / selectedCountry 기준으로 필터링
나중에
1) ㅎgetCountryDetailData()
2)renderBarChart / renderDonutChart
3) 전체 차트 구조는 그대로 사용 가능 ( 데이터만 API로 교체 )
*/

let barChartInstance = null;
let donutChartInstance = null;
let countryDetailChartInstance = null;

//국가 클릭 시 상세 데이터 생성 
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
            "#7c3aed"
          ]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      layout: {
        padding: {
          top: 10,
          bottom: 0
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#e2e8f0",
            font: {
              size: 13,
              weight: "600"
            },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
            padding: 6
          },
          grid: {
            display: false
          }
        },
        y: {
          ticks: {
            color: "#ffffff",
            font: {
              size: 15
            }
          },
          grid: {
            color: "rgba(255,255,255,0.08)"
          }
        }
      }
    }
  });
}

// 상단 현재 선택 라벨 업데이트
function updateCurrentLabel() {
  const currentLabel = document.getElementById("currentCategoryLabel");

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

// 막대 차트 렌더링 
function renderBarChart() {
  const canvas = document.getElementById("barChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (barChartInstance) {
    barChartInstance.destroy();
  }

  const sorted = [...(fakeData[selectedCategory] || [])]
  .sort((a,b) => b.chartValue - a.chartValue);

  const labels = sorted.map((item) => item.country);
  const values = sorted.map((item) => item.chartValue);
  const title = `${categoryLabels[selectedCategory]} TOP 순위`;

  const titleEl = document.getElementById("barChartTitle");
  if( titleEl) titleEl.textContent = title;


  barChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        barThickness: 30,
        borderRadius: 8,
        label: "",
        data: values,
        barPercentage: 0.55,
        categorypercentage: 0.7,
        backgroundColor: [
          "#2563eb",
          "#3b82f6",
          "#60a5fa",
          "#93c5fd",
          "#bfdbfe"
        ]
      }]
    },
options: {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      top: 6,
      bottom: 8,
      left: 0,
      right: 0
    }
  },
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      ticks: {
        color: "#ffffff",
        font: {
          size: 15,
          weight:"600"
        },
        maxRotation: 0,
        minRotation: 0,
        autoSkip: false,
        padding: 8
      },
      grid: {
        display: false
      }
    },
    y: {
      ticks: {
        color: "#ffffff",
        font: {
          size: 15
        }
      },
      grid: {
        color: "rgba(255,255,255,0.08)"
      }
    }
  }
}
  });
}

// 도넛 차트 => 나중에 여기에  [ 전세계 범죄 발생률 + 대륙별 ] 로 나누자 
// 예) 대륙별 TOP 순위 
function renderDonutChart() {
  const canvas = document.getElementById("donutChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (donutChartInstance) {
    donutChartInstance.destroy();
  }

   const sorted = [...(fakeData[selectedCategory] || [])]
    .sort((a, b) => b.chartValue - a.chartValue);

  const labels = sorted.map((item) => item.country);
  const values = sorted.map((item) => item.chartValue);
  const title = `${categoryLabels[selectedCategory]} TOP 순위`;

  const titleEl = document.getElementById("donutChartTitle");
  if (titleEl) titleEl.textContent = title;

  donutChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        borderWidth: 0,
        label: "",
        data: values,
        borderRadius: 0,
        backgroundColor: [
          "#7c3aed",
          "#4f1ea5",
          "#3e1488",
          "#31047e",
          "#965cfa",
        ],
        borderColor: "#ffffff",
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      radius: "90%",
      cutout: "50%",
      animation:{
        duration: 1000
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#ffffff",
            boxWidth: 12,
            padding: 12,
            font: {
              size: 15,
              weight: "600"
            }
          }
        },
        tooltip: {
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          backgroundColor: "#111827"
        }
      }
    }
  });
}

// 차트 전체 갱신
function renderCharts() {
  renderBarChart();
  renderDonutChart();
}