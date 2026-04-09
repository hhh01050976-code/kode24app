// 즉시 대응 & 증거 분석 JS

const EVIDENCE_KEY = "kode24_evidence_files";
const ADMIN_ATTACKER_KEY = "kode24_admin_attacker_reports";

/*=============================
[API 연결 예정 메모]
LocalStrorage + 테스트 데이터 기반으로 동작 중이지만
API가 완성 된다면

1) 로그인 사용자 확인
- isUserLoggedIn()
- getCurrentUser()

2) 증거 저장
- initEvidenceForm() 안 submit 처리
- buildEvidenceFileEntries()

3) 관리자 제보 저장
- saveAdminAttackerReport()

4) 위험 계정 조회
- TEST_REPORTED_ACCOINTS
- initLookupForm()

5) 첨부 파일 조회
- 현재는 LocalSorage(EVIDENCE_KEY) 사용
- 나중에 파일 조회 API로 변경 


========================*/


// 선택된 파일 배열
let selectedPhotoFiles = [];
let selectedVideoFiles = [];
let selectedDocFiles = [];

document.addEventListener("DOMContentLoaded", () => {
  // seedMockCurrentUser();  // 테스트 자동 로그인 제거
  initChecklist();
  initEvidenceForm();
  initLookupForm();
  initPhoneAutoFormat();
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
//현재 LocalStorage의 currentUserId 존재 여부 로그인 판단이지만,
// 나중에 실제 로그인 API / 토큰 검증 방식으로 바꿀 자리 

// 로그인 판단
function isUserLoggedIn() {
  const userId = localStorage.getItem("currentUserId");
  return !!userId;
}

// 로그인 페이지로 이동
function moveToLogin() {
  // 실제 로그인 페이지 경로에 맞게 수정
  window.location.href = "../html/Login.html";
}

// 로그인 상태에 따라 안내 박스 보여주기/숨기기
function updateLoginGuideUI() {
  const loginGuideBox = document.getElementById("loginGuideBox");
  if (!loginGuideBox) return;

  if (isUserLoggedIn()) {
    loginGuideBox.style.display = "none";
  } else {
    loginGuideBox.style.display = "block";
  }
}

/* =========================
  현재 사용자
  로컬 스토리에서 사용자 정보 읽은 곳
  나중에 실제 API 연결 시 내 정보 조회 API 응답값으로 교체 
========================= */
function getCurrentUser() {
  if (!isUserLoggedIn()) {
    return null;
  }

  return {
    userId: localStorage.getItem("currentUserId") || "",
    email: localStorage.getItem("currentUserEmail") || "",
    name: localStorage.getItem("currentUserName") || "",
    token: localStorage.getItem("accessToken") || null
  };
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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

function buildLookupPayload(platform, normalizedValue) {
  return {
    user: getCurrentUser(),
    lookup: {
      platform,
      value: normalizedValue,
      checkedAt: new Date().toISOString()
    }
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
   1. 체크리스트
========================= */
function initChecklist() {
  const checkItems = document.querySelectorAll(".check-item");
  const checkedCountEl = document.getElementById("checkedCount");

  if (!checkItems.length || !checkedCountEl) return;

  checkItems.forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.toggle("active");

      const icon = item.querySelector(".check-icon");
      const label = item.dataset.label || "항목";

      if (item.classList.contains("active")) {
        icon.textContent = "☑";
        showToast(`${label} 체크 완료`);
      } else {
        icon.textContent = "☐";
        showToast(`${label} 체크 해제`);
      }

      updateCheckedCount();
    });
  });

  function updateCheckedCount() {
    const activeCount = document.querySelectorAll(".check-item.active").length;
    checkedCountEl.textContent = activeCount;
  }

  updateCheckedCount();
}

/* =========================
   2. 파일 UI
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
    textEl.textContent = `${label}을 선택해주세요`;
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
   3. 증거 저장
========================= */
/*
파일 엔트리 생성
현재는 base64(DataURL)로 변환해서 로컬스토리 저장용 객체 생성이지만
나중에 실제 API 연결 시 
1. 파일 업로드 API로 먼저 업로드
2. 서버가 돌려준 fileId / fileUrl을 받아서 저장 API에 함께 전달 
*/
async function buildEvidenceFileEntries() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("로그인 사용자 정보가 없습니다.");
  }

  const payload = buildEvidencePayload();
  const date = payload.savedAt.slice(0, 10);

  //현재 로컬 저장용 객체 생성
  // 나중에 upload API 응답값 기반으로 변경 

  const photoEntries = await Promise.all(
    selectedPhotoFiles.map(async (file) => ({
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ownerUserId: currentUser.userId,
      ownerUserName: currentUser.name,
      type: "photo",
      name: file.name,
      date,
      url: await fileToDataUrl(file),
      attackerId: payload.attackerId,
      profileLink: payload.profileLink,
      evidenceMemo: payload.evidenceMemo
    }))
  );

  const videoEntries = await Promise.all(
    selectedVideoFiles.map(async (file) => ({
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ownerUserId: currentUser.userId,
      ownerUserName: currentUser.name,
      type: "video",
      name: file.name,
      date,
      url: await fileToDataUrl(file),
      attackerId: payload.attackerId,
      profileLink: payload.profileLink,
      evidenceMemo: payload.evidenceMemo
    }))
  );

  const docEntries = await Promise.all(
    selectedDocFiles.map(async (file) => ({
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ownerUserId: currentUser.userId,
      ownerUserName: currentUser.name,
      type: "doc",
      name: file.name,
      date,
      url: await fileToDataUrl(file),
      attackerId: payload.attackerId,
      profileLink: payload.profileLink,
      evidenceMemo: payload.evidenceMemo
    }))
  );

  return [...photoEntries, ...videoEntries, ...docEntries];
}

/*==================================
관리자 제보 저장

- 현재는 관리자 페이지에서 로컬 스토리에 같이 저장 하지만
- 나중에는 관리자 제보 저장 API로 POST 요청하는 자리 
===============================*/

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

  //현재는 로컬스토리에 저장 
  //나중에는 실제 API 연결 

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

    /*
    [API 연결 예정]
    현재 
    1. 프론트에서 입력값 검사
    2. 로컬 스토리에 증거 저장

    나중에
    1. 로그인 여부 확인
    2. 파일 업로드 API 연출
    3. 증거 저장 API 호출
    4. 성공 응답 받아 저장 완료 UI 표시 
    */


    // =========================
    // 로그인 안 되어 있으면 저장 막고 로그인 페이지로 이동
    // =========================
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
      showToast("가해자 ID / 계정명을 입력해주세요.");
      return;
    }

    if (!hasAnyFile) {
      showToast("사진, 영상, 파일 중 하나 이상 업로드해주세요.");
      return;
    }

    try {
      const requestPayload = buildSaveRequestPayload();
      const newEntries = await buildEvidenceFileEntries();

      //현재 로컬 스토리 저장 나중에 fetch API 수정
      const savedEvidence = getStoredArray(EVIDENCE_KEY);
      setStoredArray(EVIDENCE_KEY, [...newEntries, ...savedEvidence]);

      saveAdminAttackerReport(evidencePayload, newEntries);

      const currentUser = getCurrentUser();

      savedEvidenceBox.innerHTML = `
        <h3 class="saved-title">증거 저장 완료</h3>
        <p class="saved-meta">가해자 ID: ${escapeHtml(evidencePayload.attackerId)}</p>
        <p class="saved-meta">프로필 링크: ${escapeHtml(evidencePayload.profileLink || "-")}</p>
        <p class="saved-meta">추가 메모: ${escapeHtml(evidencePayload.evidenceMemo || "-")}</p>
        <p class="saved-meta">사진 ${evidencePayload.photoCount}개 / 영상 ${evidencePayload.videoCount}개 / 파일 ${evidencePayload.fileCount}개</p>
        <p class="saved-meta">저장 사용자: ${escapeHtml(currentUser?.name || "-")}</p>
        <p class="saved-meta">저장 시각: ${escapeHtml(evidencePayload.savedAt)}</p>
      `;

      console.log("evidence save payload:", requestPayload);
      clearEvidenceFormUI();
      showToast("증거가 저장되었습니다.");
    } catch (error) {
      console.error("증거 저장 실패:", error);
      showToast("증거 저장 중 오류가 발생했습니다.");
    }
  });
}

/* =========================
   4. 전화번호 자동 하이픈
========================= */
function initPhoneAutoFormat() {
  const platformEl = document.getElementById("platform");
  const lookupValueEl = document.getElementById("lookupValue");

  if (!platformEl || !lookupValueEl) return;

  lookupValueEl.addEventListener("input", () => {
    if (platformEl.value !== "phone") return;

    const numbersOnly = lookupValueEl.value.replace(/\D/g, "");
    lookupValueEl.value = formatPhoneNumber(numbersOnly);
  });

  platformEl.addEventListener("change", () => {
    lookupValueEl.value = "";

    if (platformEl.value === "phone") {
      lookupValueEl.placeholder = "예) 010-1234-5678";
    } else {
      lookupValueEl.placeholder = "예) instagram_id / @telegramID / 전화번호";
    }
  });
}

function formatPhoneNumber(value) {
  const onlyNums = String(value || "").replace(/\D/g, "");

  if (onlyNums.length < 4) return onlyNums;
  if (onlyNums.length < 8) return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
  return `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7, 11)}`;
}

/* =========================
  위험 계정 확인 => 나중에 DB 갖고와서 사용자들이 실제 가해자들 아이디 검색할 수 있도록 진행
========================= */
//테스트 신고 계정 
// 현재 프론트 내부 더미 데이터 
// 나중에 실제 운영 제거 예정 및 위험 계정 조회 API로 대체
const TEST_REPORTED_ACCOUNTS = {
  instagram: ["hhh010509","juhyeonha","danger24"],
  telegram: ["kode24_test","danger24"],
  phone: ["01012345678","01011112222","01022223333"],
  other: ["test_24"]
};

/*
위험 게정 조회 폼
현재는 TEST_REPORTED_ACCOUNTS 배열에서만 검색
나중에 조회 API를 통해 submit 안에서 fetch 호출 
*/
function initLookupForm() {
  const lookupForm = document.getElementById("lookupForm");
  const resultBox = document.getElementById("lookupResult");

  if (!lookupForm || !resultBox) return;

  lookupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const platformEl = document.getElementById("platform");
    const lookupValueEl = document.getElementById("lookupValue");

    const platform = platformEl ? platformEl.value : "";
    const rawValue = lookupValueEl ? lookupValueEl.value.trim() : "";
    const normalizedValue = platform === "phone" ? rawValue.replace(/\D/g, "") : rawValue;

    if (!platform) {
      showToast("플랫폼을 선택해주세요.");
      return;
    }

    if (!rawValue) {
      showToast("ID 또는 전화번호를 입력해주세요.");
      return;
    }

    const requestPayload = buildLookupPayload(platform, normalizedValue);
    /*
    현재 프론트 더미데이터로 조회 
    나중에 fetch api로 진행 
    */
    console.log("lookup payload:", requestPayload);

    const normalizedInput = String(normalizedValue || "").toLowerCase();

    const reportedList = (TEST_REPORTED_ACCOUNTS[platform] || []).map((item) =>
      String(item).toLowerCase()
    );

    const isReported = reportedList.includes(normalizedInput);

    resultBox.innerHTML = isReported
      ? `
        <div class="result-danger">
          <strong>주의가 필요한 계정입니다.</strong>
          <p>테스트 신고 이력이 존재하는 계정입니다.</p>
        </div>
      `
      : `
        <div class="result-safe">
          <strong>현재 등록된 신고 이력이 없습니다.</strong>
          <p>테스트 데이터 기준으로 조회되었습니다.</p>
        </div>
      `;
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