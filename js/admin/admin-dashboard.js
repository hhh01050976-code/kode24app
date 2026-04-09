// 관리자 대시보드 JS

// =========================================================
// [1] 저장 키 / 공통 상수
// - localStorage에서 관리자 페이지 데이터 읽을 때 사용하는 키
// - ※ 지금은 테스트용 localStorage를 사용 중
// - ※ 나중에 실제 서버 API 연결 후에는 이 키를 덜 쓰거나 제거할 수 있음
// =========================================================

//테스트용 저장 키 
const CONSULT_KEY = "kode24_consultation_history";

const ADMIN_ATTACKER_KEY = "kode24_admin_attacker_reports";


// =========================================================
// [2] 초기 실행 영역
// - 관리자 로그인 여부 확인
// - 페이지 첫 진입 시 기본 데이터 렌더링
// - ※ 나중에 실제 API 연결 시 여기서 fetch를 먼저 실행한 뒤 render 할 수도 있음
// =========================================================

window.onload = function () {
  const isAdminLogin = localStorage.getItem("isAdminLogin");

  if (isAdminLogin !== "true") {
    location.replace("../Home.html");
    return;
  }

  // [현재]
  // 더미 데이터 / localStorage 데이터로 바로 렌더링
  renderUsers(userData);
  renderAttackerReports();
  renderConsultations();

  // [나중에 실제 API 연결 시 예시]
  // loadDashboardData();
};


// =========================================================
// [3] 공통 이벤트 / 공통 동작
// =========================================================

function adminLogout() {
  localStorage.removeItem("isAdminLogin");
  location.replace("../Home.html");
}


// =========================================================
// [4] KPI 상세 데이터
// - 카드 클릭 시 모달에 보여줄 더미 통계 데이터
// - ※ 여기는 지금 가짜 통계값임
// - ※ 나중에 외주업체가 KPI API를 주면
//   const kpiDetailData = {...} 를 직접 쓰는 대신
//   API 응답값으로 바꿔서 openKpiModal()에 넣어야 함
// =========================================================

const kpiDetailData = {
  solveRate: {
    title: "해결률",
    mainValue: "92%",
    desc: "전체 접수 중 실제 해결 완료까지 이어진 비율입니다.",
    legend: [
      { label: "해결 완료", value: "92%", color: "#7CED62" },
      { label: "진행 중", value: "8%", color: "#264b35" }
    ],
    bars: [
      { label: "1월", value: 60 },
      { label: "2월", value: 74 },
      { label: "3월", value: 68 },
      { label: "4월", value: 85 },
      { label: "5월", value: 92 }
    ]
  },
  consultRate: {
    title: "상담 전환율",
    mainValue: "68%",
    desc: "자가진단 후 실제 상담 신청으로 이어진 비율입니다.",
    legend: [
      { label: "상담 신청", value: "68%", color: "#65E66A" },
      { label: "미전환", value: "32%", color: "#2a3b52" }
    ],
    bars: [
      { label: "1월", value: 40 },
      { label: "2월", value: 55 },
      { label: "3월", value: 48 },
      { label: "4월", value: 62 },
      { label: "5월", value: 68 }
    ]
  },
  channelFlow: {
    title: "채널별 유입",
    mainValue: "44%",
    desc: "전체 유입 중 광고 채널의 비중이 가장 높습니다.",
    legend: [
      { label: "광고", value: "44%", color: "#7CED62" },
      { label: "검색", value: "28%", color: "#58c78a" },
      { label: "SNS", value: "18%", color: "#409d77" },
      { label: "직접 유입", value: "10%", color: "#2b4b43" }
    ],
    bars: [
      { label: "광고", value: 88 },
      { label: "검색", value: 56 },
      { label: "SNS", value: 36 },
      { label: "직접", value: 20 }
    ]
  },
  countryFlow: {
    title: "국가별 유입",
    mainValue: "57%",
    desc: "현재 한국 유입 비중이 가장 높게 나타나고 있습니다.",
    legend: [
      { label: "한국", value: "57%", color: "#7CED62" },
      { label: "일본", value: "21%", color: "#58c78a" },
      { label: "미국", value: "13%", color: "#409d77" },
      { label: "기타", value: "9%", color: "#2b4b43" }
    ],
    bars: [
      { label: "한국", value: 92 },
      { label: "일본", value: 44 },
      { label: "미국", value: 28 },
      { label: "기타", value: 16 }
    ]
  },
  totalUsers: {
    title: "전체 사용자 수",
    mainValue: "128명",
    desc: "현재 가입 상태를 유지 중인 전체 사용자 수입니다.",
    legend: [
      { label: "활성 사용자", value: "78%", color: "#7CED62" },
      { label: "비활성 사용자", value: "22%", color: "#264b35" }
    ],
    bars: [
      { label: "1월", value: 30 },
      { label: "2월", value: 54 },
      { label: "3월", value: 75 },
      { label: "4월", value: 101 },
      { label: "5월", value: 128 }
    ]
  },
  todayJoin: {
    title: "오늘 신규 가입",
    mainValue: "12명",
    desc: "오늘 기준 새롭게 가입한 사용자 수입니다.",
    legend: [
      { label: "오늘 가입", value: "12명", color: "#7CED62" }
    ],
    bars: [
      { label: "월", value: 6 },
      { label: "화", value: 8 },
      { label: "수", value: 5 },
      { label: "목", value: 9 },
      { label: "금", value: 12 }
    ]
  },
  diagnosisDone: {
    title: "자가진단 완료",
    mainValue: "84건",
    desc: "자가진단 결과 저장까지 완료된 사용자 수입니다.",
    legend: [
      { label: "완료", value: "84건", color: "#7CED62" },
      { label: "미완료", value: "16건", color: "#264b35" }
    ],
    bars: [
      { label: "1주", value: 20 },
      { label: "2주", value: 38 },
      { label: "3주", value: 61 },
      { label: "4주", value: 84 }
    ]
  },
  consultCount: {
    title: "상담 신청 수",
    mainValue: "39건",
    desc: "실제 접수된 상담 신청 총 건수입니다.",
    legend: [
      { label: "전화", value: "16건", color: "#7CED62" },
      { label: "카카오", value: "14건", color: "#58c78a" },
      { label: "이메일", value: "9건", color: "#2b4b43" }
    ],
    bars: [
      { label: "월", value: 4 },
      { label: "화", value: 8 },
      { label: "수", value: 5 },
      { label: "목", value: 10 },
      { label: "금", value: 12 }
    ]
  }
};


// =========================================================
// [5] KPI 모달 제어
// - KPI 카드 클릭 시 상세 모달 열기 / 닫기
// - ※ 여기 함수 자체는 유지 가능
// - ※ 나중에 중요한 건 "data"에 들어오는 값이
//   더미인지 API 응답값인지가 바뀌는 것
// =========================================================

function openKpiModal(key) {
  const modal = document.getElementById("kpiModal");
  const title = document.getElementById("modalTitle");
  const mainValue = document.getElementById("modalMainValue");
  const desc = document.getElementById("modalDesc");
  const donutChart = document.getElementById("donutChart");
  const donutCenterText = document.getElementById("donutCenterText");
  const legendList = document.getElementById("legendList");
  const barChart = document.getElementById("barChart");
  const barLabels = document.getElementById("barLabels");

  const data = kpiDetailData[key];
  if (!data || !modal) return;

  title.textContent = data.title;
  mainValue.textContent = data.mainValue;
  desc.textContent = data.desc;
  donutCenterText.textContent = data.mainValue;

  let currentPercent = 0;
  donutChart.style.background = `conic-gradient(${data.legend
    .map((item) => {
      const valueNum = parseInt(item.value, 10) || 0;
      const start = currentPercent;
      const end = currentPercent + valueNum;
      currentPercent = end;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ")})`;

  legendList.innerHTML = data.legend
    .map((item) => `
      <div class="legend-item">
        <div class="legend-left">
          <span class="legend-dot" style="background:${item.color};"></span>
          <span>${item.label}</span>
        </div>
        <strong>${item.value}</strong>
      </div>
    `)
    .join("");

  const maxBarValue = Math.max(...data.bars.map((item) => item.value));

  barChart.innerHTML = data.bars
    .map((item) => {
      const heightPercent = (item.value / maxBarValue) * 100;
      return `
        <div class="bar-item">
          <div class="bar-fill" style="height:${heightPercent}%;"></div>
        </div>
      `;
    })
    .join("");

  barLabels.innerHTML = data.bars
    .map((item) => `<div class="bar-label">${item.label}</div>`)
    .join("");

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeKpiModal(event) {
  if (event.target.id === "kpiModal") {
    forceCloseKpiModal();
  }
}

function forceCloseKpiModal() {
  const modal = document.getElementById("kpiModal");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}


// =========================================================
// [6] 사용자 더미 데이터
// - 현재는 테스트용
// - ※ 나중에 외주업체가 "사용자 목록 API"를 주면
//   이 const userData 는 제거하거나 비워두고,
//   fetch로 받아온 배열을 renderUsers()에 넣으면 됨
// - ※ 즉, 여기가 "사용자 실제 데이터" API 연결 포인트
// =========================================================

const userData = [
  {
    name: "김민지",
    userId: "minji01",
    phone: "010-1234-5678",
    joinDate: "2026-04-03",
    diagnosis: "고위험",
    consult: "신청 완료",
    risk: "고위험"
  },
  {
    name: "이준호",
    userId: "junho77",
    phone: "010-9876-4321",
    joinDate: "2026-04-03",
    diagnosis: "주의",
    consult: "대기 중",
    risk: "주의"
  }
];


// =========================================================
// [7] 사용자 관리 영역
// - 사용자 위험도 배지 색상
// - 사용자 목록 렌더링
// - 사용자 검색
// - ※ renderUsers(list)는 재사용 가능
// - ※ 나중에 API로 받은 배열도 그대로 renderUsers(apiData) 하면 됨
// =========================================================

function getRiskClass(risk) {
  if (risk === "고위험") return "risk-high";
  if (risk === "주의") return "risk-mid";
  return "risk-low";
}

function renderUsers(list) {
  const userList = document.getElementById("userList");
  if (!userList) return;

  if (!list.length) {
    userList.innerHTML = `<div class="user-empty">검색 결과가 없습니다.</div>`;
    return;
  }

  userList.innerHTML = list
    .map((user) => `
      <article class="user-card">
        <div class="user-card-top">
          <div>
            <h3 class="user-name">${escapeHtml(user.name)}</h3>
            <div class="user-id">@${escapeHtml(user.userId)}</div>
          </div>
          <span class="risk-badge ${getRiskClass(user.risk)}">${escapeHtml(user.risk)}</span>
        </div>

        <div class="user-info-grid">
          <div class="info-item">
            <div class="info-label">연락처</div>
            <div class="info-value">${escapeHtml(user.phone)}</div>
          </div>

          <div class="info-item">
            <div class="info-label">가입일</div>
            <div class="info-value">${escapeHtml(user.joinDate)}</div>
          </div>

          <div class="info-item">
            <div class="info-label">최근 진단</div>
            <div class="info-value">${escapeHtml(user.diagnosis)}</div>
          </div>

          <div class="info-item">
            <div class="info-label">상담 여부</div>
            <div class="info-value">${escapeHtml(user.consult)}</div>
          </div>
        </div>
      </article>
    `)
    .join("");
}

function filterUsers() {
  const input = document.getElementById("userSearchInput");
  if (!input) return;

  // [현재]
  // userData 더미 배열에서 검색
  const keyword = input.value.trim().toLowerCase().replaceAll("-", "");

  const filtered = userData.filter((user) => {
    return (
      user.name.toLowerCase().includes(keyword) ||
      user.userId.toLowerCase().includes(keyword) ||
      user.phone.replaceAll("-", "").includes(keyword)
    );
  });

  renderUsers(filtered);

  // [나중에 실제 API 연결 시]
  // 1) 서버에서 전체 목록 받아와서 프론트에서 검색하거나
  // 2) 검색어를 API에 넘겨서 서버 검색 결과를 받아올 수 있음
  // 예: fetch(`/api/admin/users?keyword=${keyword}`)
}


// =========================================================
// [8] 예방 교육 신청 내역 영역
// - localStorage에서 신청 데이터 읽기
// - ※ 여기가 "예방 교육 신청 내역 API"로 바뀔 자리
// - 지금은 localStorage 임시 데이터
// =========================================================

//예약 신청 내역 읽는 함수 
function getConsultationReports() {
  try {
    // [현재]
    // localStorage에서 데이터 읽음
    return JSON.parse(localStorage.getItem(CONSULT_KEY) || "[]");

    // [나중에 실제 API 연결 시]
    // 이 함수는 async 함수로 바꾸고
    // const response = await fetch("/api/admin/consultations");
    // const data = await response.json();
    // return data;
  } catch (error) {
    console.error("신청 폼 데이터 파싱 실패 :", error);
    return [];
  }
}

//신청 내역 렌더링 함수
function renderConsultations(list) {
  const container = document.getElementById("consultList");
  if (!container) return;

  const reports = Array.isArray(list) ? list : getConsultationReports();

  if (!reports.length) {
    container.innerHTML = `<div class="user-empty">아직 접수된 예방 교육 신청이 없습니다.</div>`;
    return;
  }

  container.innerHTML = reports
    .map((item) => {
      return `
        <article class="user-card">
          <div class="user-card-top">
            <div>
              <h3 class="user-name">${escapeHtml(item.organization || "-")}</h3>
              <div class="user-id">담당자:${escapeHtml(item.manager || "-")}</div>
            </div>
            <span class="risk-badge risk-low">${escapeHtml(item.status || "접수 완료")}</span>
          </div>

          <div class="user-info-grid">
            <div class="info-item">
              <div class="info-label">연락처</div>
              <div class="info-value">${escapeHtml(item.phone || "-")}</div>
            </div>

            <div class="info-item">
              <div class="info-label">이메일</div>
              <div class="info-value">${escapeHtml(item.email || "-")}</div>
            </div>

            <div class="info-item">
              <div class="info-label">교육 대상</div>
              <div class="info-value">${escapeHtml(item.target || "-")}</div>
            </div>

            <div class="info-item">
              <div class="info-label">진행 방식</div>
              <div class="info-value">${escapeHtml(item.method || "-")}</div>
            </div>

            <div class="info-item">
              <div class="info-label">신청일</div>
              <div class="info-value">${escapeHtml(item.date || "-")}</div>
            </div>

            <div class="info-item">
              <div class="info-label">문의 내용</div>
              <div class="info-value">${escapeHtml(item.inquiry || "-")}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function filterConsultations() {
  const input = document.getElementById("consultSearchInput");
  if (!input) return;

  // [현재]
  // localStorage에서 읽은 배열 기준 검색
  const keyword = input.value.trim().toLowerCase().replaceAll("-", "");
  const reports = getConsultationReports();

  const filtered = reports.filter((item) => {
    const phone = String(item.phone || "").toLowerCase().replaceAll("-", "");

    return (
      String(item.organization || "").toLowerCase().includes(keyword) ||
      String(item.manager || "").toLowerCase().includes(keyword) ||
      phone.includes(keyword) ||
      String(item.email || "").toLowerCase().includes(keyword)
    );
  });

  renderConsultations(filtered);

  // [나중에 실제 API 연결 시]
  // 서버 검색 API가 있으면
  // fetch(`/api/admin/consultations?keyword=${keyword}`)
  // 이런 식으로 바꿀 수 있음
}


// =========================================================
// [9] 가해자 제보 영역
// - localStorage에서 제보 데이터 읽기
// - ※ 여기가 "가해자 제보 목록 API"로 바뀔 자리
// - 지금은 localStorage 임시 데이터
// =========================================================

function getAdminAttackerReports() {
  try {
    // [현재]
    // localStorage에서 관리자 제보 데이터 읽음
    return JSON.parse(localStorage.getItem(ADMIN_ATTACKER_KEY) || "[]");

    // [나중에 실제 API 연결 시]
    // 이 함수도 async 함수로 바꿔서
    // const response = await fetch("/api/admin/attacker-reports");
    // const data = await response.json();
    // return data;
  } catch (error) {
    console.error("관리자 제보 데이터 파싱 실패:", error);
    return [];
  }
}

//가해자 검색 함수 
function filterAttackerReports() {
  const input = document.getElementById("attackerSearchInput");
  if (!input) return;

  const keyword = input.value.trim().toLowerCase();
  const reports = getAdminAttackerReports();

  const filtered = reports.filter((item) => {
    return (
      String(item.attackerId || "").toLowerCase().includes(keyword) ||
      String(item.userName || item.userId || "").toLowerCase().includes(keyword) ||
      String(item.profileLink || "").toLowerCase().includes(keyword) ||
      String(item.evidenceMemo || "").toLowerCase().includes(keyword)
    );
  });

  renderAttackerReports(filtered);

  // [나중에 실제 API 연결 시]
  // fetch(`/api/admin/attacker-reports?keyword=${keyword}`)
}

function renderAttackerReports(list) {
  const container = document.getElementById("attackerReportList");
  if (!container) return;

  const reports = Array.isArray(list) ? list : getAdminAttackerReports();

  if (!reports.length) {
    container.innerHTML = `<div class="user-empty">아직 저장된 가해자 제보가 없습니다.</div>`;
    return;
  }

  container.innerHTML = reports
    .map((item) => {
      const savedDate = item.savedAt ? new Date(item.savedAt).toLocaleString() : "-";
      const memoText = escapeHtml(item.evidenceMemo || "-");
      const memoPreview =
        memoText.length > 24 ? `${memoText.slice(0, 24)}...` : memoText;

      return `
        <article class="user-card">
          <div class="user-card-top">
            <div>
              <h3 class="user-name">${escapeHtml(item.attackerId || "-")}</h3>
              <div class="user-id">제보: ${escapeHtml(item.userName || item.userId || "-")}</div>
            </div>
            <span class="risk-badge risk-mid">증거 저장</span>
          </div>

          <div class="user-info-grid">
            <div class="info-item">
              <div class="info-label">프로필 링크</div>
              <div class="info-value">
                ${
                  item.profileLink
                    ? `<a class="admin-link" href="${escapeHtml(item.profileLink)}" target="_blank">${escapeHtml(item.profileLink)}</a>`
                    : "-"
                }
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">추가 메모</div>
              <div class="info-value">
                <button
                  type="button"
                  class="admin-inline-btn"
                  onclick="openMemoModal('${encodeURIComponent(item.evidenceMemo || "")}')"
                >
                  ${memoPreview}
                </button>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">첨부 수</div>
              <div class="info-value">
                <button
                  type="button"
                  class="admin-inline-btn"
                  onclick="openAttachmentModal('${item.id}')"
                >
                  사진 ${item.photoCount || 0} / 영상 ${item.videoCount || 0} / 파일 ${item.fileCount || 0}
                </button>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">저장 시각</div>
              <div class="info-value">${escapeHtml(savedDate)}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}


// =========================================================
// [10] 추가 메모 모달
// - 가해자 제보 카드의 "추가 메모" 버튼 클릭 시 사용
// - ※ 이 부분은 UI 함수라서 API 연결과 직접 관련은 적음
// =========================================================

function openMemoModal(encodeMemo) {
  const modal = document.getElementById("memoModal");
  const content = document.getElementById("memoModalContent");
  if (!modal || !content) return;

  content.textContent = decodeURIComponent(encodeMemo || "") || "-";
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeMemoModal(event) {
  if (event.target.id === "memoModal") {
    forceCloseMemoModal();
  }
}

function forceCloseMemoModal() {
  const modal = document.getElementById("memoModal");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}


// =========================================================
// [11] 첨부 파일 모달
// - 저장된 사진 / 영상 / 파일 미리보기
// - ※ 여기서도 현재는 localStorage("kode24_evidence_files")를 읽고 있음
// - ※ 나중에 외주업체가 첨부파일 API를 주면 이 부분도 API로 변경 가능
// =========================================================

function openAttachmentModal(reportId) {
  const modal = document.getElementById("attachmentModal");
  const content = document.getElementById("attachmentModalContent");
  if (!modal || !content) return;

  const reports = getAdminAttackerReports();
  const report = reports.find((item) => item.id === reportId);

  // [현재]
  // 증거 파일도 localStorage에서 읽음
  const evidences = JSON.parse(localStorage.getItem("kode24_evidence_files") || "[]");

  // [나중에 실제 API 연결 시]
  // const response = await fetch(`/api/admin/evidence-files?reportId=${reportId}`);
  // const evidences = await response.json();

  if (!report) return;

  let matchedFiles = evidences.filter((file) =>
    (report.attachmentIds || []).includes(file.id)
  );

  // 예전 저장 데이터 fallback
  if (!matchedFiles.length) {
    matchedFiles = evidences.filter((file) => {
      return (
        String(file.attackerId || "") === String(report.attackerId || "") &&
        String(file.profileLink || "") === String(report.profileLink || "") &&
        String(file.evidenceMemo || "") === String(report.evidenceMemo || "")
      );
    });
  }

  if (!matchedFiles.length) {
    content.innerHTML = `<div class="user-empty">첨부된 파일이 없습니다.</div>`;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    return;
  }

  content.innerHTML = matchedFiles
    .map((file) => {
      if (file.type === "photo") {
        return `
          <div class="admin-file-card">
            <div class="admin-file-name">${escapeHtml(file.name)}</div>
            <img src="${file.url}" alt="${escapeHtml(file.name)}" class="admin-preview-image">
          </div>
        `;
      }

      if (file.type === "video") {
        return `
          <div class="admin-file-card">
            <div class="admin-file-name">${escapeHtml(file.name)}</div>
            <video controls class="admin-preview-video">
              <source src="${file.url}">
            </video>
          </div>
        `;
      }

      return `
        <div class="admin-file-card">
          <div class="admin-file-name">${escapeHtml(file.name)}</div>
          <a class="admin-link" href="${file.url}" download="${escapeHtml(file.name)}">파일 다운로드</a>
        </div>
      `;
    })
    .join("");

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeAttachmentModal(event) {
  if (event.target.id === "attachmentModal") {
    forceCloseAttachmentModal();
  }
}

function forceCloseAttachmentModal() {
  const modal = document.getElementById("attachmentModal");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}


// =========================================================
// [12] (추가 추천) 나중에 실제 API 연결할 때 만들 함수 예시
// - 지금 당장 안 써도 됨
// - 외주업체가 API 주소 주면 이 함수들부터 채우면 됨
// =========================================================

// 예시)
// async function fetchUsers() {
//   const response = await fetch("/api/admin/users");
//   return await response.json();
// }

// async function fetchConsultations() {
//   const response = await fetch("/api/admin/consultations");
//   return await response.json();
// }

// async function fetchAttackerReports() {
//   const response = await fetch("/api/admin/attacker-reports");
//   return await response.json();
// }

// async function fetchKpiData() {
//   const response = await fetch("/api/admin/kpi");
//   return await response.json();
// }

// 예시)
// async function loadDashboardData() {
//   try {
//     const users = await fetchUsers();
//     const consultations = await fetchConsultations();
//     const attackerReports = await fetchAttackerReports();

//     renderUsers(users);
//     renderConsultations(consultations);
//     renderAttackerReports(attackerReports);
//   } catch (error) {
//     console.error("대시보드 데이터 로딩 실패:", error);
//   }
// }


// =========================================================
// [13] 공통 유틸 함수
// =========================================================

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}