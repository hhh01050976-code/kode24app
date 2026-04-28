function goBack() {
  window.location.href = "../index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const shieldToggleBtn = document.getElementById("shieldToggleBtn");
  const shieldOrb = document.getElementById("shieldOrb");
  const shieldStateText = document.getElementById("shieldStateText");
  const shieldDesc = document.getElementById("shieldDesc");

  const scanBtn = document.getElementById("scanBtn");
  const scanProgressWrap = document.getElementById("scanProgressWrap");
  const scanProgressFill = document.getElementById("scanProgressFill");
  const scanText = document.getElementById("scanText");

  const dangerApkCount = document.getElementById("dangerApkCount");
  const warningAppCount = document.getElementById("warningAppCount");
  const permissionRiskCount = document.getElementById("permissionRiskCount");

  const toggleDetailBtn = document.getElementById("toggleDetailBtn");
  const monitorScanList = document.getElementById("monitorScanList");

  const modal = document.getElementById("scanDetailModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalList = document.getElementById("modalList");

  let shieldActive = false;
  let scanTimer = null;
  let detailOpen = false;
  let scanCompleted = false;

  // 카드 숫자 / 상세 리스트 / 팝업이 모두 이 데이터 하나만 기준으로 작동
  const scanResultData = {
    apk: [
      {
        name: "video_player_mod.apk",
        reason: "출처 불명 APK",
        level: "위험",
      },
    ],

    warningApps: [
      {
        name: "Chat Plus",
        reason: "연락처 접근 권한",
        level: "주의",
      },
      {
        name: "Cam Recorder",
        reason: "카메라 / 마이크 권한",
        level: "주의",
      },
    ],

    permissionRisk: [
      {
        name: "File Manager X",
        reason: "파일 + 연락처 + 카메라 접근",
        level: "위험",
      },
    ],
  };

  shieldToggleBtn.onclick = () => {
    shieldActive = !shieldActive;

    if (shieldActive) {
      shieldOrb.classList.add("active");
      shieldStateText.textContent = "보안 작동중";
      shieldDesc.textContent = "실시간 감시 상태입니다.";
      shieldToggleBtn.textContent = "보호 모드 끄기";
    } else {
      shieldOrb.classList.remove("active");
      shieldStateText.textContent = "보호 대기 중";
      shieldDesc.textContent = "보호 모드를 켜면 감시가 시작됩니다.";
      shieldToggleBtn.textContent = "보호 모드 켜기";
    }
  };

  scanBtn.onclick = () => {
    clearInterval(scanTimer);

    let progress = 0;
    scanCompleted = false;
    detailOpen = false;

    scanProgressWrap.classList.remove("hidden");
    scanProgressFill.style.width = "0%";
    scanText.textContent = "APK 파일 검사 중...";

    toggleDetailBtn.classList.add("hidden");
    toggleDetailBtn.textContent = "상세 보기 ▼";
    monitorScanList.classList.remove("open");
    monitorScanList.innerHTML = "";

    dangerApkCount.textContent = "0개";
    warningAppCount.textContent = "0개";
    permissionRiskCount.textContent = "0개";

    scanBtn.disabled = true;
    scanBtn.textContent = "검사 진행 중...";

    const steps = [
      "APK 파일 검사 중...",
      "카메라 권한 분석 중...",
      "마이크 접근 권한 확인 중...",
      "연락처 접근 권한 검사 중...",
      "원격 제어 앱 탐지 중...",
      "출처 불명 설치 파일 확인 중...",
      "보안 정책 검증 중...",
      "검사 완료",
    ];

    scanTimer = setInterval(() => {
      progress += 10;
      if (progress > 100) progress = 100;

      scanProgressFill.style.width = `${progress}%`;

      const stepIndex = Math.min(
        Math.floor(progress / 13),
        steps.length - 1
      );

      scanText.textContent = steps[stepIndex];

      if (progress >= 100) {
        clearInterval(scanTimer);

        setTimeout(() => {
          finishScan();
        }, 400);
      }
    }, 230);
  };

  function finishScan() {
    scanText.textContent = "검사 완료 · 주의 항목이 발견되었습니다.";

    dangerApkCount.textContent = `${scanResultData.apk.length}개`;
    warningAppCount.textContent = `${scanResultData.warningApps.length}개`;
    permissionRiskCount.textContent = `${scanResultData.permissionRisk.length}개`;

    renderDetailList();

    toggleDetailBtn.classList.remove("hidden");

    scanCompleted = true;

    scanBtn.disabled = false;
    scanBtn.textContent = "다시 스캔하기";
  }

  function renderDetailList() {
    const hasCameraMicRisk = scanResultData.warningApps.some((item) =>
      item.reason.includes("카메라") || item.reason.includes("마이크")
    );

    const hasContactRisk = scanResultData.warningApps.some((item) =>
      item.reason.includes("연락처")
    );

    const detailItems = [
      {
        label: "📦 알 수 없는 앱 설치 시도",
        status: scanResultData.apk.length > 0 ? "확인 필요" : "문제 없음",
        level: scanResultData.apk.length > 0 ? "warn" : "safe",
      },
      {
        label: "🎥 카메라 / 마이크 접근 앱",
        status: hasCameraMicRisk ? "확인 필요" : "문제 없음",
        level: hasCameraMicRisk ? "warn" : "safe",
      },
      {
        label: "👥 연락처 정보 접근 앱",
        status: hasContactRisk ? "확인 필요" : "문제 없음",
        level: hasContactRisk ? "warn" : "safe",
      },
      {
        label: "🛰️ 원격 제어 위험 앱",
        status: "발견되지 않음",
        level: "safe",
      },
    ];

    monitorScanList.innerHTML = detailItems
      .map(
        (item) => `
          <div class="monitor-scan-item ${item.level}">
            <span>${item.label}</span>
            <strong>${item.status}</strong>
          </div>
        `
      )
      .join("");
  }

  toggleDetailBtn.onclick = () => {
    detailOpen = !detailOpen;

    monitorScanList.classList.toggle("open", detailOpen);

    toggleDetailBtn.textContent = detailOpen
      ? "상세 숨기기 ▲"
      : "상세 보기 ▼";
  };

  dangerApkCount.parentElement.onclick = () => {
    if (!scanCompleted) return;
    openModal("apk");
  };

  warningAppCount.parentElement.onclick = () => {
    if (!scanCompleted) return;
    openModal("warningApps");
  };

  permissionRiskCount.parentElement.onclick = () => {
    if (!scanCompleted) return;
    openModal("permissionRisk");
  };

  function openModal(type) {
    const titles = {
      apk: "위험 APK",
      warningApps: "주의 앱",
      permissionRisk: "권한 위험",
    };

    const data = scanResultData[type] || [];

    modalTitle.textContent = titles[type] || "상세 정보";

    if (data.length === 0) {
      modalList.innerHTML = `
        <div class="modal-item">
          <strong>발견된 항목이 없습니다.</strong>
          <p>현재 기준으로 문제가 되는 항목이 없습니다.</p>
          <span>문제 없음</span>
        </div>
      `;
    } else {
      modalList.innerHTML = data
        .map(
          (item) => `
            <div class="modal-item">
              <strong>${item.name}</strong>
              <p>${item.reason}</p>
              <span>${item.level}</span>
            </div>
          `
        )
        .join("");
    }

    modal.classList.remove("hidden");
  }

  window.closeModal = () => {
    modal.classList.add("hidden");
  };
});