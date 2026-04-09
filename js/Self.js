// 자가진단 챗봇 js

/*
[ API 연결 예정 메모 ]
- localStorage(kode24_diagnosis_result")에 저장
- 결과 페이지 (result.html에서 해당 데이터 읽어서 출력)


나중에 실제 API 연결 시 변경 핵심

1) saveDiagnosisReuslt()
2) 결과 조회 (Result 페이지)
3) 상담 연결 버튼 
4) 사용자 정보 ( 비로그인 상태에서도 사용 가능 )


*/

const RESULT_KEY = "kode24_diagnosis_result";

// 결과 저장용 상태값
let diagnosisAnswers = {
  firstQuestion: "",
  secondQuestion: ""
};

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
function saveDiagnosisResult({ riskLevel, summary, finalText }) {
  const resultData = {
    date: getTodayString(),
    riskLevel,
    summary,
    answers: [
      {
        question: "상대방이 금전 요구나 유포 협박을 한 적이 있나요?",
        answer: diagnosisAnswers.firstQuestion || "-"
      },
      {
        question: "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?",
        answer: diagnosisAnswers.secondQuestion || "-"
      }
    ],
    finalText
  };

  localStorage.setItem(RESULT_KEY, JSON.stringify(resultData));
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
// 진단 완료 시 상담 연결 함수
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
         href="https://mail.google.com/mail/?view=cm&fs=1&to=hhh010509@naver.com&su=문의드립니다"
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

// ---------------------------------------
// 이메일 선택 팝업 닫기
function closeEmailOptions() {
  const popup = document.getElementById("emailPopup");
  if (popup) popup.remove();
}

// ---------------------------------------
// 직전 선택 취소 버튼
function showUndoButton() {
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
  if (undoBtn) {
    undoBtn.remove();
  }
}

// ---------------------------------------
// 현재 채팅 상태 저장
function saveChatState(stepName) {
  chatHistory.push(stepName);
}

// ---------------------------------------
// 직전 선택 취소
function undoLastChoice() {
  if (isAnswering) return;

  removeTypingMessage();
  hideUndoButton();

  if (chatHistory.length === 0) {
    alert("되돌릴 선택이 없습니다.");
    return;
  }

  updateStatus("진단 진행 중");

  const previousStep = chatHistory.pop();

  if (previousStep === "initial") {
    renderInitialQuestion();
  } else if (previousStep === "firstYes") {
    renderFirstYesStep();
  } else if (previousStep === "firstMaybe") {
    renderFirstMaybeStep();
  } else if (previousStep === "firstNo") {
    renderFirstNoStep();
  }
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
// 첫 번째 질문 선택지 제거
function removeFirstChoices() {
  const firstChoices = document.getElementById("firstChoices");
  if (firstChoices) {
    firstChoices.remove();
  }
}

// ---------------------------------------
// 두 번째 질문 선택지 제거
function removeSecondChoices() {
  const secondChoices = document.getElementById("secondChoices");
  if (secondChoices) {
    secondChoices.remove();
  }
}

// ---------------------------------------
// 초기 질문 렌더링
function renderInitialQuestion() {
  removeTypingMessage();
  hideUndoButton();

  const chatBody = document.getElementById("chatBody");
  chatBody.innerHTML = "";

  diagnosisAnswers.firstQuestion = "";
  diagnosisAnswers.secondQuestion = "";

  updateStatus("진단 진행 중");

  appendMessage("ai", "안녕하세요. 현재 협박 또는 유포 위험 상황이 있는지 간단히 확인해 드릴게요.");
  appendMessage("ai", "상대방이 금전 요구나 유포 협박을 한 적이 있나요?");

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
}

// ---------------------------------------
// 첫 질문 yes 선택 후 화면 렌더링
function renderFirstYesStep() {
  removeTypingMessage();
  hideUndoButton();

  const chatBody = document.getElementById("chatBody");
  chatBody.innerHTML = "";

  updateStatus("진단 진행 중");

  appendMessage("ai", "안녕하세요. 현재 협박 또는 유포 위험 상황이 있는지 간단히 확인해 드릴게요.");
  appendMessage("ai", "상대방이 금전 요구나 유포 협박을 한 적이 있나요?");
  appendMessage("user", "예, 협박/금전 요구가 있습니다.");
  appendMessage("ai", "확인되었습니다. 피해로 이어질 가능성이 높은 상태입니다. 추가 대응을 멈추고 대화 내용을 보관해주세요.");
  appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");

  appendChoices("secondChoices", [
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
  ]);

  showUndoButton();
}

// ---------------------------------------
// 첫 질문 maybe 선택 후 화면 렌더링
function renderFirstMaybeStep() {
  removeTypingMessage();
  hideUndoButton();

  const chatBody = document.getElementById("chatBody");
  chatBody.innerHTML = "";

  updateStatus("진단 진행 중");

  appendMessage("ai", "안녕하세요. 현재 협박 또는 유포 위험 상황이 있는지 간단히 확인해 드릴게요.");
  appendMessage("ai", "상대방이 금전 요구나 유포 협박을 한 적이 있나요?");
  appendMessage("user", "애매하지만 의심되는 상황입니다.");
  appendMessage("ai", "의심 단계로 보입니다. 명확한 협박은 아니지만 위험 신호가 있습니다. 대화 내용을 정리해두는 것이 좋습니다.");
  appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");

  appendChoices("secondChoices", [
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
  ]);

  showUndoButton();
}

// ---------------------------------------
// 첫 질문 no 선택 후 화면 렌더링
function renderFirstNoStep() {
  removeTypingMessage();
  hideUndoButton();

  const chatBody = document.getElementById("chatBody");
  chatBody.innerHTML = "";

  updateStatus("진단 진행 중");

  appendMessage("ai", "안녕하세요. 현재 협박 또는 유포 위험 상황이 있는지 간단히 확인해 드릴게요.");
  appendMessage("ai", "상대방이 금전 요구나 유포 협박을 한 적이 있나요?");
  appendMessage("user", "아직은 그런 말이 없습니다.");
  appendMessage("ai", "현재는 직접적인 협박 단계는 아닐 수 있습니다. 다만 이후 위험으로 이어질 가능성은 있습니다. 대화 흐름을 주의 깊게 확인해주세요.");
  appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");

  appendChoices("secondChoices", [
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
  ]);

  showUndoButton();
}

// ---------------------------------------
// 1단계 질문 선택
function selectFirstYes() {
  if (isAnswering) return;

  diagnosisAnswers.firstQuestion = "예, 협박/금전 요구가 있습니다.";

  saveChatState("initial");
  removeFirstChoices();
  hideUndoButton();

  appendMessage("user", "예, 협박/금전 요구가 있습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "확인되었습니다. 피해로 이어질 가능성이 높은 상태로 추가 대응을 멈추고 대화 내용을 보관해주세요.");
    appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");

    appendChoices("secondChoices", [
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
    ]);

    showUndoButton();
  }, 1200, "진단 진행 중");
}

function selectFirstMaybe() {
  if (isAnswering) return;

  diagnosisAnswers.firstQuestion = "애매하지만 의심되는 상황입니다.";

  saveChatState("initial");
  removeFirstChoices();
  hideUndoButton();

  appendMessage("user", "애매하지만 의심되는 상황입니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "의심 단계로 보입니다. 명확한 협박은 아니지만 위험 신호가 있습니다. 대화 내용을 정리해두는 것이 좋습니다.");
    appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");

    appendChoices("secondChoices", [
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
    ]);

    showUndoButton();
  }, 1200, "진단 진행 중");
}

function selectFirstNo() {
  if (isAnswering) return;

  diagnosisAnswers.firstQuestion = "아직은 그런 적이 없습니다.";

  saveChatState("initial");
  removeFirstChoices();
  hideUndoButton();

  appendMessage("user", "아직은 그런 말이 없습니다.");

  showDelayedResponse(() => {
    appendMessage("ai", "현재는 직접적인 협박 단계는 아닐 수 있습니다. 다만 이후 위험으로 이어질 가능성은 있습니다. 대화 흐름을 주의 깊게 확인해주세요.");
    appendMessage("ai", "상대방에게 얼굴이 포함된 사진이나 영상을 보낸 적이 있나요?");

    appendChoices("secondChoices", [
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
    ]);

    showUndoButton();
  }, 1200, "진단 진행 중");
}

// ---------------------------------------
// 2단계 질문 - first yes 경로
function selectSecondFromFirstYes_Yes() {
  if (isAnswering) return;

  diagnosisAnswers.secondQuestion = "예, 보낸 적 있습니다.";

  saveChatState("firstYes");
  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "예, 보낸 적 있습니다.");

  showDelayedResponse(() => {
    const finalText =
      "민감한 자료가 전달된 상태로 보입니다. 유포 협박으로 이어질 가능성이 높습니다. 현재는 고위험 단계로 판단됩니다. 증거 확보와 빠른 대응이 필요합니다.";

    appendMessage("ai", "민감한 자료가 전달된 상태로 보입니다. 유포 협박으로 이어질 가능성이 높습니다.");
    appendMessage("ai", "현재는 고위험 단계로 판단됩니다. 증거 확보와 빠른 대응이 필요합니다.");

    saveDiagnosisResult({
      riskLevel: "고위험",
      summary: "협박 정황과 민감한 자료 전달이 함께 확인되어 고위험 상태로 판단됩니다.",
      finalText
    });

    showUndoButton();
    appendContactButtons();
  }, 1200, "진단 완료");
}

function selectSecondFromFirstYes_Maybe() {
  if (isAnswering) return;

  diagnosisAnswers.secondQuestion = "애매하지만 일부 노출이 있었습니다.";

  saveChatState("firstYes");
  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "애매하지만 일부 노출이 있었습니다.");

  showDelayedResponse(() => {
    const finalText =
      "주의가 필요한 상황입니다. 상대방이 자료를 확보했을 가능성을 배제하기 어렵습니다. 현재는 주의 단계로 보입니다. 대화 내용과 계정 정보를 보관해주세요.";

    appendMessage("ai", "주의가 필요한 상황입니다. 상대방이 자료를 확보했을 가능성을 배제하기 어렵습니다.");
    appendMessage("ai", "현재는 주의 단계로 보입니다. 대화 내용과 계정 정보를 보관해주세요.");

    saveDiagnosisResult({
      riskLevel: "주의",
      summary: "협박 정황은 확인되지만 자료 노출 범위가 불명확하여 주의 단계로 판단됩니다.",
      finalText
    });

    showUndoButton();
    appendContactButtons();
  }, 1200, "진단 완료");
}

function selectSecondFromFirstYes_No() {
  if (isAnswering) return;

  diagnosisAnswers.secondQuestion = "아니요, 보내지 않았습니다.";

  saveChatState("firstYes");
  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "아니요, 보내지 않았습니다.");

  showDelayedResponse(() => {
    const finalText =
      "일부 위험 요소는 있으나 자료 전달은 없는 상태입니다. 현재는 주의 단계로 보고, 대화 내용 보관과 추가 대응 중단이 필요합니다.";

    appendMessage("ai", "일부 위험 요소는 있으나 자료 전달은 없는 상태입니다.");
    appendMessage("ai", "현재는 주의 단계로 보고, 대화 내용 보관과 추가 대응 중단이 필요합니다.");

    saveDiagnosisResult({
      riskLevel: "주의",
      summary: "협박 정황은 있으나 자료 전달은 확인되지 않아 주의 단계로 판단됩니다.",
      finalText
    });

    showUndoButton();
    appendContactButtons();
  }, 1200, "진단 완료");
}

// ---------------------------------------
// 2단계 질문 - first maybe 경로
function selectSecondFromFirstMaybe_Yes() {
  if (isAnswering) return;

  diagnosisAnswers.secondQuestion = "예, 보낸 적 있습니다.";

  saveChatState("firstMaybe");
  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "예, 보낸 적 있습니다.");

  showDelayedResponse(() => {
    const finalText =
      "의심 상황에 자료 전달까지 있었다면 위험도가 올라갑니다. 현재는 고위험 가능성이 있어 빠른 점검과 대응 준비가 필요합니다.";

    appendMessage("ai", "의심 상황에 자료 전달까지 있었다면 위험도가 올라갑니다.");
    appendMessage("ai", "현재는 고위험 가능성이 있어 빠른 점검과 대응 준비가 필요합니다.");

    saveDiagnosisResult({
      riskLevel: "고위험",
      summary: "의심 정황과 자료 전달이 함께 확인되어 고위험 가능성이 높습니다.",
      finalText
    });

    showUndoButton();
    appendContactButtons();
  }, 1200, "진단 완료");
}

function selectSecondFromFirstMaybe_Maybe() {
  if (isAnswering) return;

  diagnosisAnswers.secondQuestion = "애매하지만 일부 노출이 있었습니다.";

  saveChatState("firstMaybe");
  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "애매하지만 일부 노출이 있었습니다.");

  showDelayedResponse(() => {
    const finalText =
      "조심이 필요한 상황입니다. 상대방이 자료를 일부 확보했을 가능성이 있습니다. 현재는 주의 단계입니다. 대화 내용과 계정 정보를 보관해주세요.";

    appendMessage("ai", "조심이 필요한 상황입니다. 상대방이 자료를 일부 확보했을 가능성이 있습니다.");
    appendMessage("ai", "현재는 주의 단계입니다. 대화 내용과 계정 정보를 보관해주세요.");

    saveDiagnosisResult({
      riskLevel: "주의",
      summary: "의심 정황과 일부 노출 가능성이 있어 주의 단계로 판단됩니다.",
      finalText
    });

    showUndoButton();
    appendContactButtons();
  }, 1200, "진단 완료");
}

function selectSecondFromFirstMaybe_No() {
  if (isAnswering) return;

  diagnosisAnswers.secondQuestion = "아니요, 보내지 않았습니다.";

  saveChatState("firstMaybe");
  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "아니요, 보내지 않았습니다.");

  showDelayedResponse(() => {
    const finalText =
      "현재는 직접 피해로 이어질 가능성이 상대적으로 낮아 보입니다. 지금은 저위험 단계지만, 이후 요구가 생기는지 계속 확인해주세요.";

    appendMessage("ai", "현재는 직접 피해로 이어질 가능성이 상대적으로 낮아 보입니다.");
    appendMessage("ai", "지금은 저위험 단계지만, 이후 요구가 생기는지 계속 확인해주세요.");

    saveDiagnosisResult({
      riskLevel: "저위험",
      summary: "의심 정황은 있으나 자료 전달이 없어 현재는 저위험 단계로 판단됩니다.",
      finalText
    });

    showUndoButton();
    appendContactButtons();
  }, 1200, "진단 완료");
}

// ---------------------------------------
// 2단계 질문 - first no 경로
function selectSecondFromFirstNo_Yes() {
  if (isAnswering) return;

  diagnosisAnswers.secondQuestion = "예, 보낸 적 있습니다.";

  saveChatState("firstNo");
  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "예, 보낸 적 있습니다.");

  showDelayedResponse(() => {
    const finalText =
      "직접 협박은 없더라도 자료 전달이 있었다면 위험이 커질 수 있습니다. 현재는 주의 이상 단계로 보고 상황을 기록해두는 것이 좋습니다.";

    appendMessage("ai", "직접 협박은 없더라도 자료 전달이 있었다면 위험이 커질 수 있습니다.");
    appendMessage("ai", "현재는 주의 이상 단계로 보고 상황을 기록해두는 것이 좋습니다.");

    saveDiagnosisResult({
      riskLevel: "주의",
      summary: "직접 협박은 없지만 자료 전달 이력이 있어 주의 단계로 판단됩니다.",
      finalText
    });

    showUndoButton();
    appendContactButtons();
  }, 1200, "진단 완료");
}

function selectSecondFromFirstNo_Maybe() {
  if (isAnswering) return;

  diagnosisAnswers.secondQuestion = "애매하지만 일부 노출이 있었습니다.";

  saveChatState("firstNo");
  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "애매하지만 일부 노출이 있었습니다.");

  showDelayedResponse(() => {
    const finalText =
      "상황을 더 지켜볼 필요가 있습니다. 상대방이 자료를 확보했을 가능성을 완전히 배제하기 어렵습니다. 현재는 주의 단계로 보고 대화를 정리해두는 것이 좋습니다.";

    appendMessage("ai", "상황을 더 지켜볼 필요가 있습니다. 상대방이 자료를 확보했을 가능성을 완전히 배제하기 어렵습니다.");
    appendMessage("ai", "현재는 주의 단계로 보고 대화를 정리해두는 것이 좋습니다.");

    saveDiagnosisResult({
      riskLevel: "주의",
      summary: "직접 협박은 없지만 일부 노출 가능성이 있어 주의 단계로 판단됩니다.",
      finalText
    });

    showUndoButton();
    appendContactButtons();
  }, 1200, "진단 완료");
}

function selectSecondFromFirstNo_No() {
  if (isAnswering) return;

  diagnosisAnswers.secondQuestion = "아니요, 보내지 않았습니다.";

  saveChatState("firstNo");
  removeSecondChoices();
  hideUndoButton();

  appendMessage("user", "아니요, 보내지 않았습니다.");

  showDelayedResponse(() => {
    const finalText =
      "현재는 비교적 위험도가 낮아 보입니다. 지금은 저위험 단계지만, 외부 메신저 이동이나 저장 언급이 생기면 다시 점검해주세요.";

    appendMessage("ai", "현재는 비교적 위험도가 낮아 보입니다.");
    appendMessage("ai", "지금은 저위험 단계지만, 외부 메신저 이동이나 저장 언급이 생기면 다시 점검해주세요.");

    saveDiagnosisResult({
      riskLevel: "저위험",
      summary: "직접 협박과 자료 전달 정황이 없어 현재는 저위험 단계로 판단됩니다.",
      finalText
    });

    showUndoButton();
    appendContactButtons();
  }, 1200, "진단 완료");
}

// ---------------------------------------
// 페이지 열리면 첫 질문 자동 표시
window.onload = function () {
  renderInitialQuestion();
  updateStatus("진단 진행 중");
};
