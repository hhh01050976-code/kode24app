// 자가진단 챗봇 js

/*
[ API 연결 예정 메모 ]
- localStorage("kode24_diagnosis_result")에 저장
- 결과 페이지 (Result.html)에서 해당 데이터 읽어서 출력

나중에 실제 API 연결 시 변경 핵심
1) saveDiagnosisResult()
2) 결과 조회 (Result 페이지)
3) 상담 연결 버튼
4) 사용자 정보 (비로그인 상태에서도 사용 가능)
*/

const RESULT_KEY = "kode24_diagnosis_result";
const LOGIN_USER_KEY = "kode24_login_user";
const LOGIN_REDIRECT_KEY = "kode24_login_redirect_after";

function getLoginUser() {
  const savedUser = localStorage.getItem(LOGIN_USER_KEY);
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error("로그인 사용자 데이터 파싱 실패:", error);
    return null;
  }
}

function isLoggedIn() {
  return !!getLoginUser();
}

// 결과 저장용 상태값
let diagnosisAnswers = {
  firstQuestion: "",
  secondQuestion: "",
  thirdQuestion: "",
  fourthQuestion: ""
};

// 현재 단계 관리
// 1 = 첫 질문
// 2 = 두 번째 질문
// 3 = 세 번째 질문
// 4 = 네 번째 질문
// done = 최종 완료
let currentStep = 1;

// 직전 취소용 스냅샷 저장
let chatHistory = [];
let isAnswering = false;

// 뒤로가기
function goBack() {
  history.back();
}

// ---------------------------------------
// 오늘 날짜 문자열
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ---------------------------------------
// 진단 결과 저장
function calculateDiagnosisMetrics() {
  const a = diagnosisAnswers;
  let score = 0;

  // 1번 질문
  if (a.firstQuestion.includes("협박/금전 요구")) score += 35;
  else if (a.firstQuestion.includes("의심")) score += 22;
  else score += 5;

  // 2번 질문
  if (a.secondQuestion.includes("보낸 적 있습니다.")) score += 28;
  else if (a.secondQuestion.includes("일부 노출")) score += 18;
  else score += 5;

  // 3번 질문
  if (a.thirdQuestion.includes("외부 메신저")) score += 15;
  else if (a.thirdQuestion.includes("파일/앱")) score += 25;
  else if (a.thirdQuestion.includes("계속 대화")) score += 8;

  // 4번 질문
  if (a.fourthQuestion.includes("이미 돈")) score += 22;
  else if (a.fourthQuestion.includes("불안")) score += 12;
  else if (a.fourthQuestion.includes("대화만")) score += 5;

  score = Math.min(score, 98);

  let riskLevel = "저위험";
  if (score >= 75) riskLevel = "고위험";
  else if (score >= 45) riskLevel = "주의";

  const leakProbability = Number(score.toFixed(2));

  const blockRate = Math.max(60, 100 - Math.round(score * 0.45));
  const preventionRate = Math.max(55, 100 - Math.round(score * 0.38));
  const responseRate = Math.max(50, 100 - Math.round(score * 0.50));

  return {
    score,
    riskLevel,
    leakProbability,
    chartData: {
      blockRate,
      preventionRate,
      responseRate
    }
  };
}

function buildChecklist(riskLevel) {
  const common = [
    "KODE24 담당자에게 작업 완료 내용을 전달 받았는가?",
    "수상한 번호로 연락 시 KODE24로 먼저 문의 안내를 받았는가?",
    "작업 완료 후 2주 동안 SNS 사용 시 주의사항을 지키기로 했는가?",
    "가족 또는 지인에게 해킹 사실과 대응 원칙을 공유했는가?",
    "앞으로 어떠한 몸캠피싱 요구에도 응하지 않기로 했는가?"
  ];

  if (riskLevel === "고위험") {
    return [
      "현재 계정/대화/통화 기록을 즉시 보존했는가?",
      "추가 송금 및 추가 자료 전송을 중단했는가?",
      ...common
    ];
  }

  if (riskLevel === "주의") {
    return [
      "대화 내역과 상대방 계정 정보를 저장했는가?",
      "외부 메신저 이동 및 파일 전송을 중단했는가?",
      ...common
    ];
  }

  return [
    "직접 협박 정황은 낮지만 대화를 캡처해두었는가?",
    "이후 저장/유포/송금 언급이 나오면 즉시 다시 점검할 준비가 되었는가?",
    ...common
  ];
}

function saveDiagnosisResult({ summary, finalText }) {
  const metrics = calculateDiagnosisMetrics();

  const resultData = {
    date: getTodayString(),
    score: metrics.score,
    riskLevel: metrics.riskLevel,
    leakProbability: metrics.leakProbability,
    summary,
    answers: [
      {
        question: "상대방이 금전 요구나 유포 협박을 한 적이 있나요?",
        answer: diagnosisAnswers.firstQuestion || "-"
      },
      {
        question: "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?",
        answer: diagnosisAnswers.secondQuestion || "-"
      },
      {
        question: "상대방이 외부 메신저 이동, 파일 설치, 앱 설치 등을 요구했나요?",
        answer: diagnosisAnswers.thirdQuestion || "-"
      },
      {
        question: "현재 상황은 어디까지 진행되었나요?",
        answer: diagnosisAnswers.fourthQuestion || "-"
      }
    ],
    finalText,
    chartData: metrics.chartData,
    checklist: buildChecklist(metrics.riskLevel)
  };

  localStorage.setItem(RESULT_KEY, JSON.stringify(resultData));
}

function completeDiagnosis({ summary, finalText }) {
  saveDiagnosisResult({ summary, finalText });
  currentStep = "done";
  updateStatus("진단 완료");
  hideUndoButton();

  const metrics = calculateDiagnosisMetrics();

  appendDiagnosisSummaryCard({
    riskLevel: metrics.riskLevel,
    leakProbability: metrics.leakProbability,
    summary
  });

  if (isLoggedIn()){
    appendResultButton();
  } else {
    appendLoginGuide();
  }

  appendContactButtons();
}

function appendDiagnosisSummaryCard({ riskLevel, leakProbability, summary }) {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const existing = document.getElementById("diagnosisSummaryCard");
  if (existing) existing.remove();

  const card = document.createElement("div");
  card.id = "diagnosisSummaryCard";
  card.className = `diagnosis-summary-card ${riskLevel}`;

  card.innerHTML = `
    <div class="diagnosis-summary-top">
      <div class="diagnosis-summary-label">간단 진단 결과</div>
      <div class="diagnosis-summary-badge">${riskLevel}</div>
    </div>

    <div class="diagnosis-summary-main">
      <strong>현재 예상 위험도: ${riskLevel}</strong>
      <p>${summary}</p>
    </div>

    <div class="diagnosis-summary-meta">
      유포 위험 추정치 <span>${leakProbability}%</span>
    </div>

    <div class="diagnosis-summary-sub">
      자세한 체크리스트와 세부 결과는<br>내 프로필에서 확인할 수 있습니다.
    </div>
  `;

  chatBody.appendChild(card);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeDiagnosisSummaryCard() {
  const card = document.getElementById("diagnosisSummaryCard");
  if (card) card.remove();
}

function appendResultButton() {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const existing = document.getElementById("resultButton");
  if (existing) existing.remove();

  const btn = document.createElement("button");
  btn.id = "resultButton";
  btn.className = "result-view-btn";
  btn.innerText = "내 프로필에서 자세히 보기";

  btn.onclick = () => {
    location.href = "/html/profile/Result.html";
  };

  chatBody.appendChild(btn);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeResultButton() {
  const btn = document.getElementById("resultButton");
  if (btn) btn.remove();
}

// ---------------------------------------
// 로그인 안내
function appendLoginGuide() {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const existing = document.getElementById("loginGuideBox");
  if (existing) existing.remove();

  const wrapper = document.createElement("div");
  wrapper.id = "loginGuideBox";
  wrapper.className = "login-guide-box";

  wrapper.innerHTML = `
    <div class="login-guide-text">
      로그인 하고 자세하게 확인하시겠습니까?
    </div>
    <button type="button" class="login-guide-btn" onclick="goToLoginPage()">
      로그인창으로 이동
    </button>
  `;

  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeLoginGuide() {
  const guide = document.getElementById("loginGuideBox");
  if (guide) guide.remove();
}

function goToLoginPage() {
  localStorage.setItem(LOGIN_REDIRECT_KEY, "/html/profile/Result.html");
  location.replace("/html/Login.html");
}

// ---------------------------------------
// 상태 표시 함수
function updateStatus(text) {
  const statusBox = document.getElementById("statusBox");
  if (!statusBox) return;

  if (text === "진단 완료") {
    statusBox.innerHTML = "진단 완료";
    statusBox.classList.add("done");
  } else {
    statusBox.innerHTML = `
      진단 진행 중
      <span class="dots">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    `;
    statusBox.classList.remove("done");
  }
}

// ---------------------------------------
// 공통 딜레이 응답 함수
function showDelayedResponse(callback, delay = 1200, finalStatus = "진단 진행 중") {
  if (isAnswering) return;
  isAnswering = true;

  hideUndoButton();
  appendTypingMessage();

  setTimeout(() => {
    removeTypingMessage();
    callback();
    updateStatus(finalStatus);
    isAnswering = false;
  }, delay);
}

// ---------------------------------------
// 상담 연결 버튼
function appendContactButtons() {
  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  const existing = document.getElementById("contactButtons");
  if (existing) existing.remove();

  const wrapper = document.createElement("div");
  wrapper.id = "contactButtons";
  wrapper.className = "contact-buttons";

  wrapper.innerHTML = `
    <a href="tel:01012345678" class="contact-btn call">
      <img src="../../img/call.png" class="icon"> 즉시 전화 상담
    </a>

    <a href="https://pf.kakao.com/kode24" class="contact-btn kakao" target="_blank">
      <img src="../../img/kakao.png" class="icon"> 카카오톡 상담
    </a>

    <button type="button" class="contact-btn form" onclick="showEmailOptions()">
      <img src="../../img/mail.png" class="icon"> 이메일 문의
    </button>
  `;

  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeContactButtons() {
  const contactButtons = document.getElementById("contactButtons");
  if (contactButtons) contactButtons.remove();
}

// ---------------------------------------
// 이메일 선택 팝업 열기
function showEmailOptions() {
  const existingPopup = document.getElementById("emailPopup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.id = "emailPopup";
  popup.className = "email-popup-overlay";

  popup.innerHTML = `
    <div class="email-popup-box">
      <div class="email-popup-title">이메일 앱 선택</div>
      <div class="email-popup-subtitle">원하시는 메일 서비스를 선택해주세요</div>

      <a class="email-option-btn gmail"
         href="https://mail.google.com/mail/?view=cm&fs=1&to=kode24gpt@gmail.com&su=문의드립니다"
         target="_blank">
         지메일로 문의하기
      </a>

      <a class="email-option-btn naver"
         href="https://mail.naver.com"
         target="_blank">
         네이버 메일로 문의하기
      </a>

      <a class="email-option-btn daum"
         href="https://m.mail.daum.net"
         target="_blank">
         다음 메일로 문의하기
      </a>

      <button type="button" class="email-close-btn" onclick="closeEmailOptions()">
        닫기
      </button>
    </div>
  `;

  document.body.appendChild(popup);

  popup.addEventListener("click", function (e) {
    if (e.target === popup) {
      closeEmailOptions();
    }
  });
}

function closeEmailOptions() {
  const popup = document.getElementById("emailPopup");
  if (popup) popup.remove();
}

// ---------------------------------------
// 직전 선택 취소 버튼
function showUndoButton() {
  if (currentStep === "done") return;

  const chatBody = document.getElementById("chatBody");
  if (!chatBody) return;

  let undoBtn = document.getElementById("undoBtn");

  if (!undoBtn) {
    undoBtn = document.createElement("button");
    undoBtn.id = "undoBtn";
    undoBtn.className = "undo-btn";
    undoBtn.textContent = "직전 선택 취소";
    undoBtn.onclick = undoLastChoice;
  }

  chatBody.appendChild(undoBtn);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function hideUndoButton() {
  const undoBtn = document.getElementById("undoBtn");
  if (undoBtn) undoBtn.remove();
}

// ---------------------------------------
// 현재 상태 저장
function saveChatState() {
  chatHistory.push({
    answers: JSON.parse(JSON.stringify(diagnosisAnswers)),
    currentStep
  });
}

// ---------------------------------------
// 직전 선택 취소
function undoLastChoice() {
  if (isAnswering) return;

  removeTypingMessage();
  hideUndoButton();
  removeLoginGuide();
  removeContactButtons();
  removeResultButton();
  removeDiagnosisSummaryCard();
  closeEmailOptions();

  if (chatHistory.length === 0) {
    alert("되돌릴 선택이 없습니다.");
    return;
  }

  const previousState = chatHistory.pop();
  diagnosisAnswers = JSON.parse(JSON.stringify(previousState.answers));
  currentStep = previousState.currentStep;

  updateStatus("진단 진행 중");
  renderByState();
}

// ---------------------------------------
// 메시지 추가
function appendMessage(type, text) {
  const chatBody = document.getElementById("chatBody");
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.innerText = text;
  chatBody.appendChild(message);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// ---------------------------------------
// AI 입력 중 말풍선
function appendTypingMessage() {
  const chatBody = document.getElementById("chatBody");

  const typing = document.createElement("div");
  typing.className = "message ai typing-message";
  typing.id = "typingMessage";
  typing.innerHTML = `
    <span>답변 중</span>
    <span class="dots">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
  `;

  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTypingMessage() {
  const typing = document.getElementById("typingMessage");
  if (typing) typing.remove();
}

// ---------------------------------------
// 선택 버튼 그룹 추가
function appendChoices(choiceId, buttons) {
  const chatBody = document.getElementById("chatBody");

  const choiceGroup = document.createElement("div");
  choiceGroup.className = "choice-group";
  choiceGroup.id = choiceId;

  buttons.forEach((btn) => {
    const button = document.createElement("button");
    button.className = "choice-btn";
    button.textContent = btn.text;
    button.onclick = btn.onClick;
    choiceGroup.appendChild(button);
  });

  chatBody.appendChild(choiceGroup);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// ---------------------------------------
// 선택지 제거
function removeFirstChoices() {
  const firstChoices = document.getElementById("firstChoices");
  if (firstChoices) firstChoices.remove();
}

function removeSecondChoices() {
  const secondChoices = document.getElementById("secondChoices");
  if (secondChoices) secondChoices.remove();
}

function removeThirdChoices() {
  const thirdChoices = document.getElementById("thirdChoices");
  if (thirdChoices) thirdChoices.remove();
}

function removeFourthChoices() {
  const fourthChoices = document.getElementById("fourthChoices");
  if (fourthChoices) fourthChoices.remove();
}

// ---------------------------------------
// 상태 기반 다시 그리기
function renderByState() {
  removeTypingMessage();
  hideUndoButton();
  removeLoginGuide();
  removeContactButtons();
  removeResultButton();
  removeDiagnosisSummaryCard();

  const chatBody = document.getElementById("chatBody");
  chatBody.innerHTML = "";

  appendMessage("ai", "안녕하세요. 현재 협박 또는 유포 위험 상황이 있는지 간단히 확인해 드릴게요.");
  appendMessage("ai", "상대방이 금전 요구나 유포 협박을 한 적이 있나요?");

  if (!diagnosisAnswers.firstQuestion) {
    currentStep = 1;
    appendChoices("firstChoices", [
      {
        text: "예, 협박/금전 요구가 있습니다.",
        onClick: selectFirstYes
      },
      {
        text: "애매하지만 의심되는 상황입니다.",
        onClick: selectFirstMaybe
      },
      {
        text: "아직은 그런 적이 없습니다.",
        onClick: selectFirstNo
      }
    ]);
    return;
  }

  appendMessage("user", diagnosisAnswers.firstQuestion);

  if (diagnosisAnswers.firstQuestion === "예, 협박/금전 요구가 있습니다.") {
    appendMessage("ai", "확인되었습니다. 피해로 이어질 가능성이 높은 상태입니다. 추가 대응을 멈추고 대화 내용을 보관해주세요.");
  } else if (diagnosisAnswers.firstQuestion === "애매하지만 의심되는 상황입니다.") {
    appendMessage("ai", "의심 단계로 보입니다. 명확한 협박은 아니지만 위험 신호가 있습니다. 대화 내용을 정리해두는 것이 좋습니다.");
  } else {
    appendMessage("ai", "현재는 직접적인 협박 단계는 아닐 수 있습니다. 다만 이후 위험으로 이어질 가능성은 있습니다. 대화 흐름을 주의 깊게 확인해주세요.");
  }

  appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");

  if (!diagnosisAnswers.secondQuestion) {
    currentStep = 2;
    appendChoices("secondChoices", getSecondChoiceButtons());
    showUndoButton();
    return;
  }

  appendMessage("user", diagnosisAnswers.secondQuestion);

  // firstNo 경로는 2단계에서 종료
  if (diagnosisAnswers.firstQuestion === "아직은 그런 적이 없습니다.") {
    if (diagnosisAnswers.secondQuestion === "예, 보낸 적 있습니다.") {
      currentStep = "done";
      updateStatus("진단 완료");
      appendMessage("ai", "직접 협박은 없더라도 자료 전달이 있었다면 위험이 커질 수 있습니다.");
      appendMessage("ai", "현재는 주의 이상 단계로 보고 상황을 기록해두는 것이 좋습니다.");

      const metrics = calculateDiagnosisMetrics();

      appendDiagnosisSummaryCard({
        riskLevel: metrics.riskLevel,
        leakProbability: metrics.leakProbability,
        summary: "간단 진단 결과가 저장되었습니다. 자세한 내용은 내 프로필에서 확인해주세요."
      });

      appendResultButton();
      appendContactButtons();
      if (!isLoggedIn()) appendLoginGuide();
      return;
    }

    if (diagnosisAnswers.secondQuestion === "애매하지만 일부 노출이 있었습니다.") {
      currentStep = "done";
      updateStatus("진단 완료");
      appendMessage("ai", "상황을 더 지켜볼 필요가 있습니다. 상대방이 자료를 확보했을 가능성을 완전히 배제하기 어렵습니다.");
      appendMessage("ai", "현재는 주의 단계로 보고 대화를 정리해두는 것이 좋습니다.");

      const metrics = calculateDiagnosisMetrics();

      appendDiagnosisSummaryCard({
        riskLevel: metrics.riskLevel,
        leakProbability: metrics.leakProbability,
        summary: "간단 진단 결과가 저장되었습니다. 자세한 내용은 내 프로필에서 확인해주세요."
      });

      appendResultButton();
      appendContactButtons();
      if (!isLoggedIn()) appendLoginGuide();
      return;
    }

    if (diagnosisAnswers.secondQuestion === "아니요, 보내지 않았습니다.") {
      currentStep = "done";
      updateStatus("진단 완료");
      appendMessage("ai", "현재는 비교적 위험도가 낮아 보입니다.");
      appendMessage("ai", "지금은 저위험 단계지만, 외부 메신저 이동이나 저장 언급이 생기면 다시 점검해주세요.");

      const metrics = calculateDiagnosisMetrics();

      appendDiagnosisSummaryCard({
        riskLevel: metrics.riskLevel,
        leakProbability: metrics.leakProbability,
        summary: "간단 진단 결과가 저장되었습니다. 자세한 내용은 내 프로필에서 확인해주세요."
      });

      appendResultButton();
      appendContactButtons();
      if (!isLoggedIn()) appendLoginGuide();
      return;
    }
  }

  // firstYes / firstMaybe 경로는 3단계 진행
  if (diagnosisAnswers.firstQuestion === "예, 협박/금전 요구가 있습니다.") {
    if (diagnosisAnswers.secondQuestion === "예, 보낸 적 있습니다.") {
      appendMessage("ai", "민감한 자료가 전달된 상태로 보입니다.");
    } else if (diagnosisAnswers.secondQuestion === "애매하지만 일부 노출이 있었습니다.") {
      appendMessage("ai", "상대방이 자료를 일부 확보했을 가능성을 배제하기 어렵습니다.");
    } else {
      appendMessage("ai", "자료 전달은 없지만 위험 신호는 남아 있습니다.");
    }
  }

  if (diagnosisAnswers.firstQuestion === "애매하지만 의심되는 상황입니다.") {
    if (diagnosisAnswers.secondQuestion === "예, 보낸 적 있습니다.") {
      appendMessage("ai", "의심 상황에 자료 전달까지 있었다면 위험도가 올라갑니다.");
    } else if (diagnosisAnswers.secondQuestion === "애매하지만 일부 노출이 있었습니다.") {
      appendMessage("ai", "상대방이 자료를 일부 확보했을 가능성이 있습니다.");
    } else {
      appendMessage("ai", "직접 자료 전달은 없지만 의심 신호는 남아 있습니다.");
    }
  }

  appendMessage("ai", "조금 더 구체적인 상황을 확인해볼게요.");
  appendMessage("ai", "상대방이 아래와 같은 행동을 한 적이 있나요?");

  if (!diagnosisAnswers.thirdQuestion) {
    currentStep = 3;
    appendChoices("thirdChoices", [
      {
        text: "외부 메신저(텔레그램/라인 등)로 이동 요구",
        onClick: selectThird_Move
      },
      {
        text: "파일 또는 앱 설치 요구",
        onClick: selectThird_File
      },
      {
        text: "아직 그런 요구는 없고 대화만 이어짐",
        onClick: selectThird_Normal
      }
    ]);
    showUndoButton();
    return;
  }

  const thirdAnswerMap = {
    "외부 메신저(텔레그램/라인 등)로 이동 요구": "외부 메신저(텔레그램/라인 등)로 이동 요구",
    "파일/앱 설치 요구": "파일 또는 앱 설치 요구",
    "계속 대화만 이어짐": "아직 그런 요구는 없고 대화만 이어짐"
  };

  appendMessage("user", thirdAnswerMap[diagnosisAnswers.thirdQuestion] || diagnosisAnswers.thirdQuestion);

  if (diagnosisAnswers.thirdQuestion === "외부 메신저(텔레그램/라인 등)로 이동 요구") {
    appendMessage("ai", "외부 메신저 이동 요구는 몸캠피싱 및 유도형 협박에서 자주 나타나는 패턴입니다.");
  } else if (diagnosisAnswers.thirdQuestion === "파일/앱 설치 요구") {
    appendMessage("ai", "파일이나 앱 설치 요구는 기기 해킹, 연락처 탈취, 추가 협박 가능성과 연결될 수 있습니다.");
  } else {
    appendMessage("ai", "현재는 노골적인 유도 단계가 아닐 수 있지만, 이후 요구로 이어질 가능성은 계속 확인해야 합니다.");
  }

  appendMessage("ai", "현재 상황은 어디까지 진행되었나요?");

  if (!diagnosisAnswers.fourthQuestion) {
    currentStep = 4;
    appendChoices("fourthChoices", [
      {
        text: "이미 돈을 요구받고 있습니다.",
        onClick: selectFourth_Money
      },
      {
        text: "아직 요구는 없지만 많이 불안합니다.",
        onClick: selectFourth_Anxious
      },
      {
        text: "대화만 있었고 일단 끝난 상태입니다.",
        onClick: selectFourth_End
      }
    ]);
    showUndoButton();
    return;
  }

  appendMessage("user", diagnosisAnswers.fourthQuestion);

  currentStep = "done";
  updateStatus("진단 완료");

  if (diagnosisAnswers.fourthQuestion === "이미 돈을 요구받고 있습니다.") {
    appendMessage("ai", "현재는 즉시 대응이 필요한 고위험 단계로 판단됩니다.");
    appendMessage("ai", "대화 내용, 계정 정보, 송금 요구 정황을 보존하고 추가 대응을 멈추는 것이 중요합니다.");
  } else if (diagnosisAnswers.fourthQuestion === "아직 요구는 없지만 많이 불안합니다.") {
    appendMessage("ai", "현재는 주의 단계로 판단됩니다.");
    appendMessage("ai", "아직 상황이 확대되기 전 증거를 정리해두는 것이 중요합니다.");
  } else {
    appendMessage("ai", "현재는 비교적 안정 상태입니다.");
    appendMessage("ai", "다만 이후 요구나 협박으로 이어질 가능성은 계속 주의해주세요.");
  }

  const metrics = calculateDiagnosisMetrics();

  appendDiagnosisSummaryCard({
    riskLevel: metrics.riskLevel,
    leakProbability: metrics.leakProbability,
    summary: "간단 진단 결과가 저장되었습니다. 자세한 내용은 내 프로필에서 확인해주세요."
  });

  appendResultButton();
  appendContactButtons();
  if (!isLoggedIn()) appendLoginGuide();
}

// ---------------------------------------
// 2단계 버튼 동적 생성
function getSecondChoiceButtons() {
  if (diagnosisAnswers.firstQuestion === "예, 협박/금전 요구가 있습니다.") {
    return [
      {
        text: "예, 보낸 적 있습니다.",
        onClick: selectSecondFromFirstYes_Yes
      },
      {
        text: "애매하지만 일부 노출이 있었습니다.",
        onClick: selectSecondFromFirstYes_Maybe
      },
      {
        text: "아니요, 보내지 않았습니다.",
        onClick: selectSecondFromFirstYes_No
      }
    ];
  }

  if (diagnosisAnswers.firstQuestion === "애매하지만 의심되는 상황입니다.") {
    return [
      {
        text: "예, 보낸 적 있습니다.",
        onClick: selectSecondFromFirstMaybe_Yes
      },
      {
        text: "애매하지만 일부 노출이 있었습니다.",
        onClick: selectSecondFromFirstMaybe_Maybe
      },
      {
        text: "아니요, 보내지 않았습니다.",
        onClick: selectSecondFromFirstMaybe_No
      }
    ];
  }

  return [
    {
      text: "예, 보낸 적 있습니다.",
      onClick: selectSecondFromFirstNo_Yes
    },
    {
      text: "애매하지만 일부 노출이 있었습니다.",
      onClick: selectSecondFromFirstNo_Maybe
    },
    {
      text: "아니요, 보내지 않았습니다.",
      onClick: selectSecondFromFirstNo_No
    }
  ];
}

// ---------------------------------------
// 초기 질문 렌더링
function renderInitialQuestion() {
  diagnosisAnswers = {
    firstQuestion: "",
    secondQuestion: "",
    thirdQuestion: "",
    fourthQuestion: ""
  };

  chatHistory = [];
  currentStep = 1;
  updateStatus("진단 진행 중");
  renderByState();
}

// ---------------------------------------
// 1단계 질문 선택
function selectFirstYes() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.firstQuestion = "예, 협박/금전 요구가 있습니다.";
  currentStep = 2;

  removeFirstChoices();
  hideUndoButton();

  appendMessage("user", "예, 협박/금전 요구가 있습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "확인되었습니다. 피해로 이어질 가능성이 높은 상태입니다. 추가 대응을 멈추고 대화 내용을 보관해주세요.");
    appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");
    appendChoices("secondChoices", getSecondChoiceButtons());
    showUndoButton();
  }, 1200, "진단 진행 중");
}

function selectFirstMaybe() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.firstQuestion = "애매하지만 의심되는 상황입니다.";
  currentStep = 2;

  removeFirstChoices();
  hideUndoButton();

  appendMessage("user", "애매하지만 의심되는 상황입니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "의심 단계로 보입니다. 명확한 협박은 아니지만 위험 신호가 있습니다. 대화 내용을 정리해두는 것이 좋습니다.");
    appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");
    appendChoices("secondChoices", getSecondChoiceButtons());
    showUndoButton();
  }, 1200, "진단 진행 중");
}

function selectFirstNo() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.firstQuestion = "아직은 그런 적이 없습니다.";
  currentStep = 2;

  removeFirstChoices();
  hideUndoButton();

  appendMessage("user", "아직은 그런 적이 없습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "현재는 직접적인 협박 단계는 아닐 수 있습니다. 다만 이후 위험으로 이어질 가능성은 있습니다. 대화 흐름을 주의 깊게 확인해주세요.");
    appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");
    appendChoices("secondChoices", getSecondChoiceButtons());
    showUndoButton();
  }, 1200, "진단 진행 중");
}

// ---------------------------------------
// 2단계 질문 - first yes 경로
function selectSecondFromFirstYes_Yes() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.secondQuestion = "예, 보낸 적 있습니다.";
  currentStep = 3;

  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "예, 보낸 적 있습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "민감한 자료가 전달된 상태로 보입니다.");
    appendMessage("ai", "조금 더 구체적인 상황을 확인해볼게요.");
    renderThirdStep();
  }, 1200, "진단 진행 중");
}

function selectSecondFromFirstYes_Maybe() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.secondQuestion = "애매하지만 일부 노출이 있었습니다.";
  currentStep = 3;

  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "애매하지만 일부 노출이 있었습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "상대방이 자료를 일부 확보했을 가능성을 배제하기 어렵습니다.");
    appendMessage("ai", "조금 더 구체적인 상황을 확인해볼게요.");
    renderThirdStep();
  }, 1200, "진단 진행 중");
}

function selectSecondFromFirstYes_No() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.secondQuestion = "아니요, 보내지 않았습니다.";
  currentStep = 3;

  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "아니요, 보내지 않았습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "자료 전달은 없지만 위험 신호는 남아 있습니다.");
    appendMessage("ai", "현재 상황을 조금 더 확인해볼게요.");
    renderThirdStep();
  }, 1200, "진단 진행 중");
}

// ---------------------------------------
// 2단계 질문 - first maybe 경로
function selectSecondFromFirstMaybe_Yes() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.secondQuestion = "예, 보낸 적 있습니다.";
  currentStep = 3;

  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "예, 보낸 적 있습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "의심 상황에 자료 전달까지 있었다면 위험도가 올라갑니다.");
    appendMessage("ai", "조금 더 구체적인 상황을 확인해볼게요.");
    renderThirdStep();
  }, 1200, "진단 진행 중");
}

function selectSecondFromFirstMaybe_Maybe() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.secondQuestion = "애매하지만 일부 노출이 있었습니다.";
  currentStep = 3;

  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "애매하지만 일부 노출이 있었습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "상대방이 자료를 일부 확보했을 가능성이 있습니다.");
    appendMessage("ai", "현재 상황을 조금 더 확인해볼게요.");
    renderThirdStep();
  }, 1200, "진단 진행 중");
}

function selectSecondFromFirstMaybe_No() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.secondQuestion = "아니요, 보내지 않았습니다.";
  currentStep = 3;

  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "아니요, 보내지 않았습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "직접 자료 전달은 없지만 의심 신호는 남아 있습니다.");
    appendMessage("ai", "추가 위험 패턴이 있는지 확인해볼게요.");
    renderThirdStep();
  }, 1200, "진단 진행 중");
}

// ---------------------------------------
// 2단계 질문 - first no 경로
function selectSecondFromFirstNo_Yes() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.secondQuestion = "예, 보낸 적 있습니다.";

  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "예, 보낸 적 있습니다.");

  showDelayedResponse(() => {
    const finalText =
      "직접 협박은 없더라도 자료 전달이 있었다면 위험이 커질 수 있습니다. 현재는 주의 이상 단계로 보고 상황을 기록해두는 것이 좋습니다.";

    appendMessage("ai", "직접 협박은 없더라도 자료 전달이 있었다면 위험이 커질 수 있습니다.");
    appendMessage("ai", "현재는 주의 이상 단계로 보고 상황을 기록해두는 것이 좋습니다.");

    completeDiagnosis({
      summary: "직접 협박은 없지만 자료 전달 이력이 있어 주의 단계로 판단됩니다.",
      finalText
    });
  }, 1200, "진단 완료");
}

function selectSecondFromFirstNo_Maybe() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.secondQuestion = "애매하지만 일부 노출이 있었습니다.";

  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "애매하지만 일부 노출이 있었습니다.");

  showDelayedResponse(() => {
    const finalText =
      "상황을 더 지켜볼 필요가 있습니다. 상대방이 자료를 확보했을 가능성을 완전히 배제하기 어렵습니다. 현재는 주의 단계로 보고 대화를 정리해두는 것이 좋습니다.";

    appendMessage("ai", "상황을 더 지켜볼 필요가 있습니다. 상대방이 자료를 확보했을 가능성을 완전히 배제하기 어렵습니다.");
    appendMessage("ai", "현재는 주의 단계로 보고 대화를 정리해두는 것이 좋습니다.");

    completeDiagnosis({
      summary: "직접 협박은 없지만 일부 노출 가능성이 있어 주의 단계로 판단됩니다.",
      finalText
    });
  }, 1200, "진단 완료");
}

function selectSecondFromFirstNo_No() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.secondQuestion = "아니요, 보내지 않았습니다.";

  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "아니요, 보내지 않았습니다.");

  showDelayedResponse(() => {
    const finalText =
      "현재는 비교적 위험도가 낮아 보입니다. 지금은 저위험 단계지만, 외부 메신저 이동이나 저장 언급이 생기면 다시 점검해주세요.";

    appendMessage("ai", "현재는 비교적 위험도가 낮아 보입니다.");
    appendMessage("ai", "지금은 저위험 단계지만, 외부 메신저 이동이나 저장 언급이 생기면 다시 점검해주세요.");

    completeDiagnosis({
      summary: "직접 협박과 자료 전달 정황이 없어 현재는 저위험 단계로 판단됩니다.",
      finalText
    });
  }, 1200, "진단 완료");
}

// ---------------------------------------
// 3단계 질문 렌더링
function renderThirdStep() {
  appendMessage("ai", "상대방이 아래와 같은 행동을 한 적이 있나요?");

  appendChoices("thirdChoices", [
    {
      text: "외부 메신저(텔레그램/라인 등)로 이동 요구",
      onClick: selectThird_Move
    },
    {
      text: "파일 또는 앱 설치 요구",
      onClick: selectThird_File
    },
    {
      text: "아직 그런 요구는 없고 대화만 이어짐",
      onClick: selectThird_Normal
    }
  ]);

  showUndoButton();
}

// 3단계 선택 - 외부 메신저 이동 요구
function selectThird_Move() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.thirdQuestion = "외부 메신저(텔레그램/라인 등)로 이동 요구";
  currentStep = 4;

  removeThirdChoices();
  hideUndoButton();

  appendMessage("user", "외부 메신저(텔레그램/라인 등)로 이동 요구");

  showDelayedResponse(() => {
    appendMessage("ai", "외부 메신저 이동 요구는 몸캠피싱 및 유도형 협박에서 자주 나타나는 패턴입니다.");
    appendMessage("ai", "현재 상황은 어디까지 진행되었나요?");
    renderFourthStep();
  }, 1200, "진단 진행 중");
}

// 3단계 선택 - 파일 /앱 설치 요구
function selectThird_File() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.thirdQuestion = "파일/앱 설치 요구";
  currentStep = 4;

  removeThirdChoices();
  hideUndoButton();

  appendMessage("user", "파일 또는 앱 설치 요구");

  showDelayedResponse(() => {
    appendMessage("ai", "파일이나 앱 설치 요구는 기기 해킹, 연락처 탈취, 추가 협박 가능성과 연결될 수 있습니다.");
    appendMessage("ai", "현재 상황은 어디까지 진행되었나요?");
    renderFourthStep();
  }, 1200, "진단 진행 중");
}

// 3단계 선택 - 아직 대화만 이어짐
function selectThird_Normal() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.thirdQuestion = "계속 대화만 이어짐";
  currentStep = 4;

  removeThirdChoices();
  hideUndoButton();

  appendMessage("user", "아직 그런 요구는 없고 대화만 이어짐");

  showDelayedResponse(() => {
    appendMessage("ai", "현재는 노골적인 유도 단계가 아닐 수 있지만, 이후 요구로 이어질 가능성은 계속 확인해야 합니다.");
    appendMessage("ai", "현재 상황은 어디까지 진행되었나요?");
    renderFourthStep();
  }, 1200, "진단 진행 중");
}

// ---------------------------------------
// 4단계 질문 렌더링
function renderFourthStep() {
  appendChoices("fourthChoices", [
    {
      text: "이미 돈을 요구받고 있습니다.",
      onClick: selectFourth_Money
    },
    {
      text: "아직 요구는 없지만 많이 불안합니다.",
      onClick: selectFourth_Anxious
    },
    {
      text: "대화만 있었고 일단 끝난 상태입니다.",
      onClick: selectFourth_End
    }
  ]);

  showUndoButton();
}

// 4단계 선택 - 이미 돈 요구
function selectFourth_Money() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.fourthQuestion = "이미 돈을 요구받고 있습니다.";

  removeFourthChoices();
  hideUndoButton();

  appendMessage("user", "이미 돈을 요구받고 있습니다.");

  showDelayedResponse(() => {
    const finalText =
      "상대방의 협박, 자료 확보 가능성, 추가 요구 정황이 함께 보여 현재는 즉시 대응이 필요한 고위험 단계로 판단됩니다.";

    appendMessage("ai", "현재는 즉시 대응이 필요한 고위험 단계로 판단됩니다.");
    appendMessage("ai", "대화 내용, 계정 정보, 송금 요구 정황을 보존하고 추가 대응을 멈추는 것이 중요합니다.");

    completeDiagnosis({
      summary: "협박 정황과 가해자 패턴, 현재 진행 상태를 종합할 때 즉시 대응이 필요한 상태입니다.",
      finalText
    });
  }, 1200, "진단 완료");
}

// 4단계 선택 - 아직 요구는 없지만 불안
function selectFourth_Anxious() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.fourthQuestion = "아직 요구는 없지만 많이 불안합니다.";

  removeFourthChoices();
  hideUndoButton();

  appendMessage("user", "아직 요구는 없지만 많이 불안합니다.");

  showDelayedResponse(() => {
    const finalText =
      "직접적인 요구가 시작되지 않았더라도 위험 신호가 확인됩니다. 현재는 주의 단계로 보고 대화 내용과 계정 정보를 정리해두는 것이 좋습니다.";

    appendMessage("ai", "현재는 주의 단계로 판단됩니다.");
    appendMessage("ai", "아직 상황이 확대되기 전 증거를 정리해두는 것이 중요합니다.");

    completeDiagnosis({
      summary: "직접적인 요구는 없지만 패턴상 위험 신호가 있어 주의가 필요한 상태입니다.",
      finalText
    });
  }, 1200, "진단 완료");
}

// 4단계 선택 - 대화만 있었고 끝남
function selectFourth_End() {
  if (isAnswering) return;

  saveChatState();
  diagnosisAnswers.fourthQuestion = "대화만 있었고 일단 끝난 상태입니다.";

  removeFourthChoices();
  hideUndoButton();

  appendMessage("user", "대화만 있었고 일단 끝난 상태입니다.");

  showDelayedResponse(() => {
    const finalText =
      "현재는 비교적 안정 상태로 보이지만, 향후 외부 메신저 이동, 자료 재요구, 저장/유포 언급이 생기면 다시 즉시 점검해야 합니다.";

    appendMessage("ai", "현재는 비교적 안정 상태입니다.");
    appendMessage("ai", "다만 이후 요구나 협박으로 이어질 가능성은 계속 주의해주세요.");

    completeDiagnosis({
      summary: "현재는 비교적 안정 상태로 보이지만 이후 위험 전환 가능성은 남아 있습니다.",
      finalText
    });
  }, 1200, "진단 완료");
}

// ---------------------------------------
// 페이지 열리면 첫 질문 자동 표시
window.onload = function () {
  renderInitialQuestion();
  updateStatus("진단 진행 중");
};