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

  const modal = document.getElementById("scanDetailModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalList = document.getElementById("modalList");

  let shieldActive = false;
  let scanTimer = null;
  let scanCompleted = false;

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

    scanProgressWrap.classList.remove("hidden");
    scanProgressWrap.classList.remove("progress-done");
    scanProgressFill.style.width = "0%";
    scanText.textContent = "APK 파일 검사 중...";

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
    scanText.textContent = "검사 완료 · 결과 카드를 눌러 상세 내용을 확인하세요.";
    scanProgressWrap.classList.add("progress-done");

    dangerApkCount.textContent = `${scanResultData.apk.length}개`;
    warningAppCount.textContent = `${scanResultData.warningApps.length}개`;
    permissionRiskCount.textContent = `${scanResultData.permissionRisk.length}개`;

    scanCompleted = true;

    scanBtn.disabled = false;
    scanBtn.textContent = "다시 스캔하기";
  }

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
        .map((item) => {
            const easyReasonMap = {
            "연락처 접근 권한": "연락처 정보를 가져갈 수 있어요",
            "카메라 / 마이크 권한": "카메라와 마이크를 사용할 수 있어요",
            "출처 불명 APK": "공식 스토어가 아닌 파일이에요",
            "파일 + 연락처 + 카메라 접근": "파일·연락처·카메라에 접근할 수 있어요",
            };

            return `
            <div class="modal-item">
                <div class="modal-item-top">
                <strong>${item.name}</strong>
                <span class="risk-badge">${item.level}</span>
                </div>
                <p>${easyReasonMap[item.reason] || item.reason}</p>
            </div>
            `;
        })
        .join("");
    }

    modal.classList.remove("hidden");
  }

  window.closeModal = () => {
    modal.classList.add("hidden");
  };
});