// 피해 유형 분석 JS

/*
[ API 연결 예정 메모 ]
 
실제 api 연결 시 바뀌는 핵심 위치
1) summaryData => 실제 통계 요약 API 
2) typeSummaryData => 유형별 목록 API
3) incidentData => 차트 데이터 API
4) DOMContentLoaded 안에 API fetch 후 render / chart 실행

*/

//뒤로가기 함수
function goBack() {
  window.location.href = "../html/Home.html";
}

//통계 가짜 데이터 => 나중에 실제 데이터를 삽입
const summaryData = {
    totalCount: 18450,
    topType: "랜덤 채팅 유도형",
    growthRate: 12.8
};

// 유형별 상세 요약 가짜 데이터 
const typeSummaryData = [
  {
    key: "randomChat",
    title: "랜덤 채팅 유도형",
    ratio: 24,
    description: "랜덤채팅 앱/사이트를 통해 접근 후 외부 플랫폼으로 유도하는 전형적인 형태",
    count: 4280
  },
  {
    key: "videoCall",
    title: "영상 통화 녹화형",
    ratio: 18,
    description: "영상 통화 장면을 녹화한 뒤 지인 유포 협박으로 이어지는 유형",
    count: 3120
  },
  {
    key: "deepfake",
    title: "딥페이크 형",
    ratio: 14,
    description: "기존 사진/영상 자료를 합성하여 허위 유포 협박을 진행하는 유형",
    count: 2480
  },
  {
    key: "naiven",
    title: "나이별",
    ratio: 11,
    description: "단순 대화 접근 이후 빠른 영상/개인정보 확보를 통해 협박하는 단기형 유형",
    count: 1960
  },
  {
    key: "romanceScam",
    title: "연애사기 결합형",
    ratio: 16,
    description: "감정 형성을 먼저 유도한 뒤 금전 요구와 영상 협박이 결합되는 복합형 유형",
    count: 2850
  },
  {
    key: "platformType",
    title: "플랫폼별 유형",
    ratio: 17,
    description: "SNS, 메신저, 랜덤채팅, 영상앱 등 플랫폼 특성에 따라 변형되는 유형군",
    count: 3010
  }
];

//차트 가짜 데이터
const incidentData = {
  randomChat: {
    labels: ["랜덤 채팅 유도형", "영상 통화 녹화형", "딥페이크 형", "나이별", "연애 사기 결합형", "플랫폼별 유형"],
    values: [4280, 3120, 2480, 1960, 2850, 3010],
    colors: ["#3b82f6", "#06b6d4", "#8b5cf6", "#f97316", "#ec4899", "#22c55e"]
  },
  videoCall: {
    labels: ["1월", "2월", "3월", "4월", "5월", "6월"],
    values: [320, 410, 530, 490, 620, 750]
  },
  deepfake: {
    labels: ["10대", "20대", "30대", "40대", "50대", "60대+"],
    values: [45, 82, 68, 51, 37, 18]
  },
  naiven: {
    labels: ["DM", "랜덤채팅", "지인사칭", "문자", "커뮤니티"],
    values: [28, 35, 12, 15, 10]
  },
  romanceScam: {
    labels: ["접근", "신뢰형성", "사적대화", "영상유도", "협박/금전요구"],
    male: [100, 82, 61, 43, 28],
    female: [100, 88, 72, 56, 39]
  },
  platformType: {
    labels: ["인스타그램", "텔레그램", "라인", "랜덤채팅앱", "영상통화앱", "기타"],
    values: [32, 24, 16, 14, 9, 5]
  }
};


//공통 범례 스타일
function commonLegendLabels() {
  return {
    color: "#ffffff",
    boxWidth: 12,
    padding: 12,
    font: {
      size: 14,
      weight: "600"
    }
  };
}


//공통 축 눈금 스타일 
function commonAxisTicks(size = 11) {
  return {
    color: "#ffffff",
    font: {
      size: 13,
      weight: "600"
    }
  };
}

// 유형별 전체 도넛 차트 생성 
function createRandomChatDonutChart() {
  const ctx = document.getElementById("typeDonutChart");
  if (!ctx) return;

  new Chart(ctx, {
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

// 영상 통화 선 차트 생성 
function createVideoLineChart() {
  const ctx = document.getElementById("videoLineChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "line",
    data: {
      labels: incidentData.videoCall.labels,
      datasets: [{
        label: "발생 건수",
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
        legend: {
          labels: commonLegendLabels()
        }
      },
      scales: {
        x: {
          ticks: commonAxisTicks(),
          grid: { display: false }
        },
        y: {
          ticks: commonAxisTicks(10),
          grid: {
            color: "rgba(255,255,255,0.08)"
          }
        }
      }
    }
  });
}

//딥 페이크 레이더 차트 생성 
function createDeepfakeRadarChart() {
  const ctx = document.getElementById("deepfakeRadarChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: incidentData.deepfake.labels,
      datasets: [{
        label: "피해 분포",
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
        legend: {
          labels: commonLegendLabels()
        }
      },
      scales: {
        r: {
          angleLines: {
            color: "rgba(255,255,255,0.1)"
          },
          grid: {
            color: "rgba(255,255,255,0.12)"
          },
          pointLabels: {
            color: "#ffffff",
            font: {
              size: 15,
              weight: "600"
            }
          },
          ticks: {
            color: "#cbd5e1",
            backdropColor: "transparent"
          }
        }
      }
    }
  });
}

//나이별 폴라 차트 생성 
function createNaivenPolarChart() {
  const ctx = document.getElementById("naivenPolarChart");
  if (!ctx) return;

  new Chart(ctx, {
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
          "rgba(168, 85, 247, 0.75)"
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
          ticks: {
            color: "#cbd5e1",
            backdropColor: "transparent"
          },
          grid: {
            color: "rgba(255,255,255,0.1)"
          },
          angleLines: {
            color: "rgba(255,255,255,0.08)"
          }
        }
      }
    }
  });
}

//연애 사기 결합형 막대 차트 
function createRomanceStackedChart() {
  const ctx = document.getElementById("romanceStackedChart");
  if (!ctx) return;

  new Chart(ctx, {
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
        legend: {
          labels: commonLegendLabels()
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            ...commonAxisTicks(5),
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false
          },
          grid: { display: false }
        },
        y: {
          stacked: true,
          ticks: commonAxisTicks(10),
          grid: {
            color: "rgba(255,255,255,0.08)"
          }
        }
      }
    }
  });
}

//플랫폼별 가로 막대 차트
function createPlatformHorizontalChart() {
  const ctx = document.getElementById("platformHorizontalChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: incidentData.platformType.labels,
      datasets: [{
        label: "비율(%)",
        data: incidentData.platformType.values,
        borderWidth: 0,
        borderRadius: 8,
        backgroundColor: [
          "#60a5fa",
          "#22d3ee",
          "#818cf8",
          "#a78bfa",
          "#34d399"
        ]
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: commonLegendLabels()
        }
      },
      scales: {
        x: {
          ticks: commonAxisTicks(10),
          grid: {
            color: "rgba(255,255,255,0.08)"
          }
        },
        y: {
          ticks: commonAxisTicks(10),
          grid: { display: false }
        }
      }
    }
  });
}

//페이지 시작시 차트와 요약 카드 렌더링
window.addEventListener("DOMContentLoaded", () => {
  createRandomChatDonutChart();
  createVideoLineChart();
  createDeepfakeRadarChart();
  createNaivenPolarChart();
  createRomanceStackedChart();
  createPlatformHorizontalChart();

  renderSummary();
  renderTypeSummaryCards();
});


//나중에 이걸 실제 데이터 값 삽입하여 알맞게 계산식 해야됌 
function renderSummary() {
  const totalEl = document.getElementById("totalCount");
  const typeEl = document.getElementById("topType");
  const growthEl = document.getElementById("growthRate");

  if (totalEl) {
    totalEl.textContent = summaryData.totalCount.toLocaleString() + "건";
  }

  if (typeEl) {
    typeEl.textContent = summaryData.topType;
  }

  if (growthEl) {
    growthEl.textContent = "+" + summaryData.growthRate + "%";
  }
}

//위험도 함수 
function getRiskInfo(count) {
  if (count >= 3500) {
    return {
      label: "위험도 매우 높음",
      emoji: "🔴",
      className: "very-high"
    };
  }

  if (count >= 3000) {
    return {
      label: "위험도 높음",
      emoji: "🟠",
      className: "high"
    };
  }

  if (count >= 2300) {
    return {
      label: "위험도 중상",
      emoji: "🟡",
      className: "mid-high"
    };
  }

  return {
    label: "위험도 중간",
    emoji: "🟢",
    className: "medium"
  };
}


//유형별 요약 카드 렌더링 
function renderTypeSummaryCards() {
  const container = document.getElementById("typeList");
  if (!container) return;

  container.innerHTML = "";

  typeSummaryData.forEach((item) => {
    const risk = getRiskInfo(item.count);

    const card = document.createElement("div");
    card.className = "type-card";

    card.innerHTML = `
      <div class="type-card-top">
        <h3>${item.title}</h3>
        <span class="badge">비중 ${item.ratio}%</span>
      </div>

      <p>${item.description}</p>

      <div class="type-meta">
        <span>발생률 ${item.count.toLocaleString()}건</span>
        <span class="risk ${risk.className}">${risk.emoji} ${risk.label}</span>
      </div>
    `;

    container.appendChild(card);
  });
}