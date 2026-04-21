// 증거 보존 JS
// ============================================
// [현재 단계]
// - 로컬 테스트용 LocalStorage 저장 구조
// - 사진은 작은 파일만 base64 미리보기 저장
// - 영상 / 일반 파일은 목록 표시용 메타데이터만 저장
//
// [외주 전환 시]
// 1. fileToDataUrl() 기반 저장 제거
// 2. buildEvidenceFileEntries()에서 파일 업로드 API 호출
// 3. url에는 서버/스토리지 URL 저장
// 4. localStorage 대신 DB/API 저장으로 교체
// ============================================

const EVIDENCE_KEY = "kode24_evidence_files";
const ADMIN_ATTACKER_KEY = "kode24_admin_attacker_reports";
const MAX_INLINE_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB 이하 사진만 base64 저장

// 선택된 파일 배열
let selectedPhotoFiles = [];
let selectedVideoFiles = [];
let selectedDocFiles = [];

document.addEventListener("DOMContentLoaded", () => {
  initEvidenceForm();
  initFileUI();
  initAccordion();
  updateLoginGuideUI();
});

// 뒤로가기
function goBack() {
  window.location.href = "../index.html";
}

/* =========================
   로그인 체크
========================= */
// [외주 전환 시]
// localStorage 로그인 체크 대신 실제 로그인 API / 토큰 검증으로 교체
function isUserLoggedIn() {
  try {
    const loginUser = JSON.parse(localStorage.getItem("kode24_login_user") || "null");
    return !!(loginUser && loginUser.isLoggedIn);
  } catch (error) {
    console.error("kode24_login_user 파싱 실패:", error);
    return false;
  }
}

function moveToLogin() {
  window.location.href = "../html/Login.html";
}

function updateLoginGuideUI() {
  const loginGuideBox = document.getElementById("loginGuideBox");
  if (!loginGuideBox) return;

  loginGuideBox.style.display = isUserLoggedIn() ? "none" : "block";
}

function getCurrentUser() {
  try {
    const loginUser = JSON.parse(localStorage.getItem("kode24_login_user") || "null");

    if (!loginUser || !loginUser.isLoggedIn) {
      return null;
    }

    return {
      userId: loginUser.userId || "",
      email: loginUser.email || "",
      name: loginUser.name || "",
      token: loginUser.token || null
    };
  } catch (error) {
    console.error("현재 사용자 정보 파싱 실패:", error);
    return null;
  }
}

// 모바일 / 로컬 테스트용 로그아웃
function forceLogoutForTest() {
  localStorage.removeItem("kode24_login_user");
  localStorage.removeItem("currentUserId");
  localStorage.removeItem("currentUserEmail");
  localStorage.removeItem("currentUserName");
  localStorage.removeItem("accessToken");

  showToast("테스트 로그아웃 완료");
  setTimeout(() => {
    location.reload();
  }, 500);
}

/* =========================
   공용 유틸
========================= */
function getStoredArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error(`${key} 파싱 실패:`, error);
    return [];
  }
}

function setStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// [외주 전환 시]
// 이 함수는 제거하고 업로드 API 사용
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createEvidenceId() {
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* =========================
   Payload
========================= */
function buildEvidencePayload() {
  return {
    attackerId: document.getElementById("attackerId")?.value.trim() || "",
    profileLink: document.getElementById("profileLink")?.value.trim() || "",
    evidenceMemo: document.getElementById("evidenceMemo")?.value.trim() || "",
    photoCount: selectedPhotoFiles.length,
    videoCount: selectedVideoFiles.length,
    fileCount: selectedDocFiles.length,
    photoNames: selectedPhotoFiles.map((file) => file.name),
    videoNames: selectedVideoFiles.map((file) => file.name),
    docNames: selectedDocFiles.map((file) => file.name),
    savedAt: new Date().toISOString()
  };
}

function buildSaveRequestPayload() {
  return {
    user: getCurrentUser(),
    evidence: buildEvidencePayload()
  };
}

/* =========================
   아코디언
========================= */
function initAccordion() {
  const accordionCards = document.querySelectorAll(".accordion-card");
  if (!accordionCards.length) return;

  accordionCards.forEach((card) => {
    const toggle = card.querySelector(".accordion-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      const isOpen = card.classList.contains("is-open");

      accordionCards.forEach((item) => item.classList.remove("is-open"));

      if (!isOpen) {
        card.classList.add("is-open");
      }
    });
  });
}

/* =========================
   파일 UI
========================= */
function initFileUI() {
  bindFileInput({
    inputId: "photoFiles",
    textId: "photoText",
    previewId: "photoPreview",
    type: "image",
    label: "사진"
  });

  bindFileInput({
    inputId: "videoFiles",
    textId: "videoText",
    previewId: "videoPreview",
    type: "video",
    label: "영상"
  });

  bindFileInput({
    inputId: "docFiles",
    textId: "docText",
    previewId: "docPreview",
    type: "file",
    label: "파일"
  });
}

function bindFileInput({ inputId, textId, previewId, type, label }) {
  const input = document.getElementById(inputId);
  const textEl = document.getElementById(textId);
  const previewEl = document.getElementById(previewId);

  if (!input || !textEl || !previewEl) return;

  input.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (type === "image") {
      selectedPhotoFiles = [...selectedPhotoFiles, ...files];
      renderPreview("image");
      updateFileText(textEl, selectedPhotoFiles.length, label);
    }

    if (type === "video") {
      selectedVideoFiles = [...selectedVideoFiles, ...files];
      renderPreview("video");
      updateFileText(textEl, selectedVideoFiles.length, label);
    }

    if (type === "file") {
      selectedDocFiles = [...selectedDocFiles, ...files];
      renderPreview("file");
      updateFileText(textEl, selectedDocFiles.length, label);
    }

    input.value = "";
  });
}

function updateFileText(textEl, count, label) {
  if (!textEl) return;

  if (count === 0) {
    textEl.textContent = `${label}을 업로드 해주세요`;
    textEl.classList.remove("active");
    return;
  }

  textEl.textContent = count === 1 ? `${label} 1개 선택됨` : `${label} ${count}개 선택됨`;
  textEl.classList.add("active");
}

function renderPreview(type) {
  let files = [];
  let previewEl = null;
  let textEl = null;
  let label = "";

  if (type === "image") {
    files = selectedPhotoFiles;
    previewEl = document.getElementById("photoPreview");
    textEl = document.getElementById("photoText");
    label = "사진";
  }

  if (type === "video") {
    files = selectedVideoFiles;
    previewEl = document.getElementById("videoPreview");
    textEl = document.getElementById("videoText");
    label = "영상";
  }

  if (type === "file") {
    files = selectedDocFiles;
    previewEl = document.getElementById("docPreview");
    textEl = document.getElementById("docText");
    label = "파일";
  }

  if (!previewEl) return;

  previewEl.innerHTML = "";

  files.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "preview-item";

    const left = document.createElement("div");
    left.className = "preview-left";

    let thumbHtml = "";

    if (type === "image") {
      const imageUrl = URL.createObjectURL(file);
      thumbHtml = `<img src="${imageUrl}" class="preview-thumb" alt="preview">`;
    } else if (type === "video") {
      thumbHtml = `<div class="preview-file-icon">🎬</div>`;
    } else {
      thumbHtml = `<div class="preview-file-icon">📎</div>`;
    }

    left.innerHTML = `
      ${thumbHtml}
      <div class="preview-info">
        <div class="preview-name">${escapeHtml(file.name)}</div>
        <div class="preview-size">${formatFileSize(file.size)}</div>
      </div>
    `;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "preview-delete";
    deleteBtn.textContent = "삭제";

    deleteBtn.addEventListener("click", () => {
      if (type === "image") selectedPhotoFiles.splice(index, 1);
      if (type === "video") selectedVideoFiles.splice(index, 1);
      if (type === "file") selectedDocFiles.splice(index, 1);

      renderPreview(type);

      const currentCount =
        type === "image"
          ? selectedPhotoFiles.length
          : type === "video"
            ? selectedVideoFiles.length
            : selectedDocFiles.length;

      updateFileText(textEl, currentCount, label);
      showToast(`${label} 항목이 삭제되었습니다.`);
    });

    item.appendChild(left);
    item.appendChild(deleteBtn);
    previewEl.appendChild(item);
  });

  updateFileText(textEl, files.length, label);
}

/* =========================
   증거 저장
========================= */
// [외주 전환 시]
// - 현재는 localStorage 저장
// - 이후에는 각 파일을 업로드 API로 보내고
//   서버에서 받은 URL / fileId를 아래 객체에 넣으면 됨
async function buildEvidenceFileEntries() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("로그인 사용자 정보가 없습니다.");
  }

  const payload = buildEvidencePayload();
  const date = payload.savedAt.slice(0, 10);

  const photoEntries = await Promise.all(
    selectedPhotoFiles.map(async (file) => {
      const isSmallEnough = file.size <= MAX_INLINE_PHOTO_SIZE;

      return {
        id: createEvidenceId(),
        ownerUserId: currentUser.userId,
        ownerUserName: currentUser.name,
        type: "photo",
        name: file.name,
        size: file.size,
        date,
        url: isSmallEnough ? await fileToDataUrl(file) : "",
        hasInlineData: isSmallEnough,
        previewUnavailableReason: isSmallEnough ? "" : "사진 용량이 커서 미리보기 없이 목록만 저장되었습니다.",
        attackerId: payload.attackerId,
        profileLink: payload.profileLink,
        evidenceMemo: payload.evidenceMemo,
        savedAt: payload.savedAt
      };
    })
  );

  const videoEntries = selectedVideoFiles.map((file) => ({
    id: createEvidenceId(),
    ownerUserId: currentUser.userId,
    ownerUserName: currentUser.name,
    type: "video",
    name: file.name,
    size: file.size,
    date,
    url: "",
    hasInlineData: false,
    previewUnavailableReason: "영상은 현재 로컬 테스트 버전에서 목록 저장만 지원합니다.",
    attackerId: payload.attackerId,
    profileLink: payload.profileLink,
    evidenceMemo: payload.evidenceMemo,
    savedAt: payload.savedAt
  }));

  const docEntries = selectedDocFiles.map((file) => ({
    id: createEvidenceId(),
    ownerUserId: currentUser.userId,
    ownerUserName: currentUser.name,
    type: "doc",
    name: file.name,
    size: file.size,
    date,
    url: "",
    hasInlineData: false,
    previewUnavailableReason: "파일은 현재 로컬 테스트 버전에서 목록 저장만 지원합니다.",
    attackerId: payload.attackerId,
    profileLink: payload.profileLink,
    evidenceMemo: payload.evidenceMemo,
    savedAt: payload.savedAt
  }));

  return [...photoEntries, ...videoEntries, ...docEntries];
}

function saveAdminAttackerReport(evidencePayload, evidenceEntries = []) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const report = {
    id: `report_${Date.now()}`,
    userId: currentUser.userId,
    userName: currentUser.name,
    userEmail: currentUser.email,
    attackerId: evidencePayload.attackerId,
    profileLink: evidencePayload.profileLink,
    evidenceMemo: evidencePayload.evidenceMemo,
    photoCount: evidencePayload.photoCount,
    videoCount: evidencePayload.videoCount,
    fileCount: evidencePayload.fileCount,
    photoNames: evidencePayload.photoNames || [],
    videoNames: evidencePayload.videoNames || [],
    docNames: evidencePayload.docNames || [],
    attachmentIds: evidenceEntries.map((item) => item.id),
    savedAt: evidencePayload.savedAt
  };

  const saved = getStoredArray(ADMIN_ATTACKER_KEY);
  saved.unshift(report);
  setStoredArray(ADMIN_ATTACKER_KEY, saved);
}

function clearEvidenceFormUI() {
  const evidenceForm = document.getElementById("evidenceForm");
  if (evidenceForm) evidenceForm.reset();

  selectedPhotoFiles = [];
  selectedVideoFiles = [];
  selectedDocFiles = [];

  renderPreview("image");
  renderPreview("video");
  renderPreview("file");

  const photoText = document.getElementById("photoText");
  const videoText = document.getElementById("videoText");
  const docText = document.getElementById("docText");

  if (photoText) updateFileText(photoText, 0, "사진");
  if (videoText) updateFileText(videoText, 0, "영상");
  if (docText) updateFileText(docText, 0, "파일");
}

function initEvidenceForm() {
  const evidenceForm = document.getElementById("evidenceForm");
  const savedEvidenceBox = document.getElementById("savedEvidenceBox");

  if (!evidenceForm || !savedEvidenceBox) return;

  evidenceForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!isUserLoggedIn()) {
      showToast("로그인 후 증거를 저장할 수 있습니다.");
      setTimeout(() => {
        moveToLogin();
      }, 800);
      return;
    }

    const evidencePayload = buildEvidencePayload();
    const hasAnyFile =
      selectedPhotoFiles.length > 0 ||
      selectedVideoFiles.length > 0 ||
      selectedDocFiles.length > 0;

    if (!evidencePayload.attackerId) {
      showToast("가해자 ID를 입력해주세요.");
      return;
    }

    if (!hasAnyFile) {
      showToast("사진, 영상, 파일 중 하나 이상 업로드해주세요.");
      return;
    }

    try {
      const requestPayload = buildSaveRequestPayload();
      const newEntries = await buildEvidenceFileEntries();

      const savedEvidence = getStoredArray(EVIDENCE_KEY);
      setStoredArray(EVIDENCE_KEY, [...newEntries, ...savedEvidence]);

      saveAdminAttackerReport(evidencePayload, newEntries);

      const currentUser = getCurrentUser();

      const largePhotoCount = newEntries.filter(
        (item) => item.type === "photo" && !item.hasInlineData
      ).length;

      const infoMessage =
        selectedVideoFiles.length > 0 || selectedDocFiles.length > 0 || largePhotoCount > 0
          ? "일부 대용량 파일은 목록만 저장되었습니다."
          : "증거가 저장되었습니다.";

      savedEvidenceBox.innerHTML = `
        <h3 class="saved-title">증거 저장 완료</h3>
        <p class="saved-meta">가해자 ID: ${escapeHtml(evidencePayload.attackerId)}</p>
        <p class="saved-meta">가해자 링크: ${escapeHtml(evidencePayload.profileLink || "-")}</p>
        <p class="saved-meta">추가 메모: ${escapeHtml(evidencePayload.evidenceMemo || "-")}</p>
        <p class="saved-meta">사진 ${evidencePayload.photoCount}개 / 영상 ${evidencePayload.videoCount}개 / 파일 ${evidencePayload.fileCount}개</p>
        <p class="saved-meta">저장 사용자: ${escapeHtml(currentUser?.name || "-")}</p>
        <p class="saved-meta">저장 시각: ${escapeHtml(evidencePayload.savedAt)}</p>
        <p class="saved-meta">${escapeHtml(infoMessage)}</p>
      `;

      console.log("evidence save payload:", requestPayload);
      clearEvidenceFormUI();
      showToast(infoMessage);
    } catch (error) {
      console.error("증거 저장 실패:", error);
      showToast("증거 저장 중 오류가 발생했습니다.");
    }
  });
}

/* =========================
   토스트
========================= */
function showToast(message) {
  const toast = document.getElementById("appToast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}