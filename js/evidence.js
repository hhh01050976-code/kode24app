/* ==============================
   증거 보존 파일 페이지 JS
   ============================== */

// ============================================
// [현재 단계]
// - localStorage 기반 로컬 테스트용
// - 사진: 일부만 미리보기 가능
// - 영상/파일: 현재는 목록 저장만 지원
//
// [외주 전환 시]
// 1. getEvidenceData()를 API 호출로 교체
// 2. openPreview()에서 item.url 서버 URL 사용
// 3. 영상/파일도 실제 재생/다운로드 가능하게 확장
// ============================================

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

/* =========================
   로그인 사용자
========================= */
function getCurrentUser() {
  try {
    const loginUser = JSON.parse(localStorage.getItem("kode24_login_user") || "null");

    if (!loginUser || !loginUser.isLoggedIn) {
      return null;
    }

    return {
      userId: loginUser.userId || "",
      name: loginUser.name || ""
    };
  } catch (error) {
    console.error("현재 사용자 정보 파싱 실패:", error);
    return null;
  }
}

function goBack() {
  location.href = "./MyPage.html";
}

/* =========================
   데이터
========================= */
// [외주 전환 시]
// localStorage 대신 DB/API 조회로 교체
function getEvidenceData() {
  const saved = localStorage.getItem(EVIDENCE_KEY);
  if (!saved) return [];

  try {
    const allEvidence = JSON.parse(saved);
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.userId) {
      return [];
    }

    return allEvidence.filter((item) => item.ownerUserId === currentUser.userId);
  } catch (error) {
    console.error("증거 데이터 파싱 실패:", error);
    return [];
  }
}

function getEmptyMessage(type) {
  if (type === "photo") return "사진이 없습니다.";
  if (type === "video") return "영상이 없습니다.";
  return "파일이 없습니다.";
}

/* =========================
   필터 라벨
========================= */
function updateTriggerLabels() {
  yearTrigger.textContent = selectedYear ? `${selectedYear}년` : "전체 연도";
  monthTrigger.textContent = selectedMonth ? `${Number(selectedMonth)}월` : "전체 월";
}

/* =========================
   피커 옵션
========================= */
function getYearOptions() {
  const options = [{ value: "", label: "전체 연도" }];
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= 1999; year--) {
    options.push({
      value: String(year),
      label: `${year}년`
    });
  }

  return options;
}

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

/* =========================
   필터링
========================= */
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

  return data.sort((a, b) => String(b.savedAt || b.date || "").localeCompare(String(a.savedAt || a.date || "")));
}

// 삭제 버튼
function deleteEvidenceItem(targetId){
  try {
    const saved = JSON.parse(localStorage.getItem(EVIDENCE_KEY) || "[]");
    const filtered = saved.filter((item) => String(item.id) !== String(targetId));
    localStorage.setItem(EVIDENCE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("증거 삭제 실패 : ", error);
  }
}

function showToast(message){
  const toast = document.getElementById("appToast");
  if (!toast){
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
} 
/* =========================
   리스트 렌더링
========================= */
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
        <div class="file-item-top">
          <div>
            <div class="file-name">${escapeHtml(item.name)}</div>
            <div class="file-meta">${escapeHtml(item.date || "-")}</div>
          </div>
          <button type="button" class="file-delete-btn" data-delete-id="${item.id}">
            삭제
          </button>
        </div>
      </article>
    `)
    .join("");

  const items = fileList.querySelectorAll(".file-item");
  items.forEach((itemEl) => {
    itemEl.addEventListener("click", (e) => {
      const deleteBtn = e.target.closest(".file-delete-btn");
      if (deleteBtn) return;

      const targetId = itemEl.dataset.id;
      const target = filtered.find((item) => String(item.id) === String(targetId));
      if (target) openPreview(target);
    });
  });

  const deleteButtons = fileList.querySelectorAll(".file-delete-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();

      const targetId = button.dataset.deleteId;
      const isConfirmed = confirm("이 파일을 삭제할까요?");

      if (!isConfirmed) return;

      deleteEvidenceItem(targetId);
      renderFileList();
      showToast("파일이 삭제되었습니다.");
    });
  });
}
/* =========================
   탭
========================= */
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

/* =========================
   피커
========================= */
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

function closePicker() {
  pickerSheet.classList.add("hidden");
  pickerType = "";
  tempPickerValue = "";
}

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

/* =========================
   미리보기
========================= */
// [외주 전환 시]
// item.url 서버 URL이 들어오면 아래 안내 문구 대신 실제 재생/다운로드 처리
function openPreview(item) {
  if (!previewModal || !previewTitle || !previewBody) return;

  previewTitle.textContent = item.name || "파일 보기";

  if (item.type === "photo") {
    if (item.url) {
      previewBody.innerHTML = `
        <img src="${item.url}" alt="${escapeHtml(item.name)}" class="preview-image" />
      `;
    } else {
      previewBody.innerHTML = `
        <div class="preview-file-box">
          <div class="preview-file-name">${escapeHtml(item.name)}</div>
          <div class="preview-file-desc">
            ${escapeHtml(item.previewUnavailableReason || "사진 미리보기를 지원하지 않습니다.")}
          </div>
        </div>
      `;
    }
  } else if (item.type === "video") {
    previewBody.innerHTML = `
      <div class="preview-file-box">
        <div class="preview-file-name">${escapeHtml(item.name)}</div>
        <div class="preview-file-desc">
          ${escapeHtml(item.previewUnavailableReason || "영상은 현재 로컬 테스트 버전에서 목록 저장만 지원합니다.")}
        </div>
      </div>
    `;
  } else {
    previewBody.innerHTML = `
      <div class="preview-file-box">
        <div class="preview-file-name">${escapeHtml(item.name)}</div>
        <div class="preview-file-desc">
          ${escapeHtml(item.previewUnavailableReason || "파일은 현재 로컬 테스트 버전에서 목록 저장만 지원합니다.")}
        </div>
      </div>
    `;
  }

  previewModal.classList.remove("hidden");
}

function closePreview() {
  if (!previewModal || !previewBody) return;
  previewModal.classList.add("hidden");
  previewBody.innerHTML = "";
}

function initPreview() {
  if (previewBackdrop) previewBackdrop.addEventListener("click", closePreview);
  if (previewCloseBtn) previewCloseBtn.addEventListener("click", closePreview);
}

/* =========================
   XSS 방지
========================= */
function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* =========================
   시작
========================= */
document.addEventListener("DOMContentLoaded", () => {
  updateTriggerLabels();
  initTabs();
  initPicker();
  initPreview();
  renderFileList();
});