/* ==============================
   증거 보존 파일 페이지 JS
   앱 방식 + 아이폰 스타일 피커 + 파일 미리보기
   ============================== */

/*
[API 연결 예정 메모]
현재 구조 LocalStorage("kode24_evidence_file")에서 전체 데이터 읽음


나중에 실제 API 연결 시 
1) seedMockCurrentUser() => 제거 (테스트용 로그인)
2) getCurrentUser() => 실제 로그인 API / 토큰 기반으로 변경
3) getEvidenceData() => LocalStorage 대신 서버 API 호출
4) renderFileList() => API 응답 기반 렌더링 

파일 URL( item.url )은 현재 base64 => 나중엔 서버 URL로 변경 

*/

const EVIDENCE_KEY = "kode24_evidence_files";

const tabButtons = document.querySelectorAll(".tab-btn");
const fileList = document.getElementById("fileList");
const emptyState = document.getElementById("emptyState");

const yearTrigger = document.getElementById("yearTrigger");
const monthTrigger = document.getElementById("monthTrigger");

const pickerSheet = document.getElementById("pickerSheet");
const pickerBackdrop = document.getElementById("pickerBackdrop");
const pickerTitle = document.getElementById("pickerTitle");
const pickerList = document.getElementById("pickerList");
const pickerCancelBtn = document.getElementById("pickerCancelBtn");
const pickerDoneBtn = document.getElementById("pickerDoneBtn");

const previewModal = document.getElementById("previewModal");
const previewBackdrop = document.getElementById("previewBackdrop");
const previewTitle = document.getElementById("previewTitle");
const previewBody = document.getElementById("previewBody");
const previewCloseBtn = document.getElementById("previewCloseBtn");

let currentType = "photo";
let selectedYear = "";
let selectedMonth = "";

let pickerType = "";
let tempPickerValue = "";


//테스트 로그인 
function seedMockCurrentUser() {
  if (!localStorage.getItem("currentUserId")) {
    localStorage.setItem("currentUserId", "user_demo_001");
  }

  if (!localStorage.getItem("currentUserName")) {
    localStorage.setItem("currentUserName", "테스트사용자");
  }
}

//현재 사용자 정보 
//나중에 로그인 API / 토큰 기반으로 변경 
function getCurrentUser() {
  return {
    userId: localStorage.getItem("currentUserId") || "user_demo_001",
    name: localStorage.getItem("currentUserName") || "테스트사용자"
  };
}

function goBack() {
  location.href = "./MyPage.html";
}


//증거 데이터 가져오기 
function getEvidenceData() {
  const saved = localStorage.getItem(EVIDENCE_KEY);

  if (!saved) return [];

  try {
    const allEvidence = JSON.parse(saved);
    const currentUser = getCurrentUser();

    //현재 프론트에서 사용자 필터링
    return allEvidence.filter((item) => item.ownerUserId === currentUser.userId);

    //나중에 실제 API 연동
  } catch (error) {
    console.error("증거 데이터 파싱 실패:", error);
    return [];
  }
}

//빈 상태 메세지 반환 
function getEmptyMessage(type) {
  if (type === "photo") return "사진이 없습니다.";
  if (type === "video") return "영상이 없습니다.";
  return "파일이 없습니다.";
}

//연도/월 선택값 테그슽 업데이트 
function updateTriggerLabels() {
  yearTrigger.textContent = selectedYear ? `${selectedYear}년` : "전체 연도";
  monthTrigger.textContent = selectedMonth ? `${Number(selectedMonth)}월` : "전체 월";
}

//연도 선택 옵션 생성 
function getYearOptions() {
  const options = [{ value: "", label: "전체 연도" }];
  const data = getEvidenceData();

  const years = [...new Set(
    data
      .map((item) => String(item.date || "").slice(0, 4))
      .filter(Boolean)
  )].sort((a, b) => Number(b) - Number(a));

  years.forEach((year) => {
    options.push({
      value: year,
      label: `${year}년`
    });
  });

  return options;
}
// 월 선택 옵션 생성 
function getMonthOptions() {
  const options = [{ value: "", label: "전체 월" }];

  for (let month = 1; month <= 12; month++) {
    const value = String(month).padStart(2, "0");
    options.push({
      value,
      label: `${month}월`
    });
  }

  return options;
}


//필터링 로직 
function getFilteredData() {
  let data = getEvidenceData();

  data = data.filter((item) => item.type === currentType);

  if (selectedYear) {
    data = data.filter((item) => String(item.date || "").startsWith(selectedYear));
  }

  if (selectedMonth) {
    data = data.filter((item) => {
      const month = String(item.date || "").slice(5, 7);
      return month === selectedMonth;
    });
  }

  return data.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

//파일 리스트 렌더링 
function renderFileList() {
  if (!fileList || !emptyState) return;

  const filtered = getFilteredData();

  if (!filtered.length) {
    fileList.innerHTML = "";
    emptyState.textContent = getEmptyMessage(currentType);
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  fileList.innerHTML = filtered
    .map((item) => `
      <article class="file-item" data-id="${item.id}">
        <div class="file-name">${escapeHtml(item.name)}</div>
        <div class="file-meta">${escapeHtml(item.date || "-")}</div>
      </article>
    `)
    .join("");

  const items = fileList.querySelectorAll(".file-item");
  items.forEach((itemEl) => {
    itemEl.addEventListener("click", () => {
      const targetId = itemEl.dataset.id;
      const target = filtered.find((item) => String(item.id) === String(targetId));
      if (target) openPreview(target);
    });
  });
}
//탭 전환 
function initTabs() {
  if (!tabButtons.length) return;

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      currentType = button.dataset.type || "photo";
      renderFileList();
    });
  });
}

//미리 보기 - 파일 URL
function openPicker(type) {
  pickerType = type;
  tempPickerValue = type === "year" ? selectedYear : selectedMonth;

  const options = type === "year" ? getYearOptions() : getMonthOptions();
  pickerTitle.textContent = type === "year" ? "연도 선택" : "월 선택";

  pickerList.innerHTML = options
    .map((option) => `
      <button
        type="button"
        class="picker-option ${option.value === tempPickerValue ? "active" : ""}"
        data-value="${option.value}"
      >
        ${option.label}
      </button>
    `)
    .join("");

  pickerList.querySelectorAll(".picker-option").forEach((button) => {
    button.addEventListener("click", () => {
      tempPickerValue = button.dataset.value || "";

      pickerList.querySelectorAll(".picker-option").forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");
    });
  });

  pickerSheet.classList.remove("hidden");
}
//피커 닫기 
function closePicker() {
  pickerSheet.classList.add("hidden");
  pickerType = "";
  tempPickerValue = "";
}

//피커 이벤트 초기화 
function initPicker() {
  if (yearTrigger) {
    yearTrigger.addEventListener("click", () => openPicker("year"));
  }

  if (monthTrigger) {
    monthTrigger.addEventListener("click", () => openPicker("month"));
  }

  if (pickerBackdrop) {
    pickerBackdrop.addEventListener("click", closePicker);
  }

  if (pickerCancelBtn) {
    pickerCancelBtn.addEventListener("click", closePicker);
  }

  if (pickerDoneBtn) {
    pickerDoneBtn.addEventListener("click", () => {
      if (pickerType === "year") selectedYear = tempPickerValue;
      if (pickerType === "month") selectedMonth = tempPickerValue;

      updateTriggerLabels();
      renderFileList();
      closePicker();
    });
  }
}

//파일 미리보기 
function openPreview(item) {
  if (!previewModal || !previewTitle || !previewBody) return;

  previewTitle.textContent = item.name || "파일 보기";

  if (item.type === "photo") {
    previewBody.innerHTML = `<img src="${item.url}" alt="${escapeHtml(item.name)}" class="preview-image" />`;
  } else if (item.type === "video") {
    previewBody.innerHTML = `
      <video controls class="preview-video">
        <source src="${item.url}" />
        브라우저에서 영상을 재생할 수 없습니다.
      </video>
    `;
  } else {
    previewBody.innerHTML = `
      <div class="preview-file-box">
        <div class="preview-file-name">${escapeHtml(item.name)}</div>
        <div class="preview-file-desc">문서 미리보기 대신 새 탭에서 열 수 있도록 준비했습니다.</div>
        <a href="${item.url}" target="_blank" class="preview-link-btn">파일 열기</a>
      </div>
    `;
  }

  previewModal.classList.remove("hidden");
}

//미리보기 닫기 
function closePreview() {
  if (!previewModal || !previewBody) return;
  previewModal.classList.add("hidden");
  previewBody.innerHTML = "";
}

//미리보기 이벤트 초기화 
function initPreview() {
  if (previewBackdrop) previewBackdrop.addEventListener("click", closePreview);
  if (previewCloseBtn) previewCloseBtn.addEventListener("click", closePreview);
}


//html 안전 변환 (xss 방지)
function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


//페이지 시작 나중에 API fetch 후 렌더링 
document.addEventListener("DOMContentLoaded", () => {
  seedMockCurrentUser();
  updateTriggerLabels();
  initTabs();
  initPicker();
  initPreview();
  renderFileList();
});