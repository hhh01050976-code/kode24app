//상담 신청 내역 페이지.js
// 앱 전용: 신청 폼에서 저장한 localStorage 데이터를 보여주는 용도

const CONSULT_KEY = "kode24_consultation_history";
const consultList = document.getElementById("consultList");
const emptyState = document.getElementById("emptyState");

/*
[API 연결 에정 메모]
현재 LocalStorage에 저장된 상담 신청 데이터 보여주는 구도
나중에 실제 서버 / DB 연결 시 바꿔야 하는 핵심 위치는 아래 2곳 

1) getConsultationData()
- 현재 로컬스토리에서 데이터 읽음
- 나중에 상담 신청 내역 조회 API 호출


2) 페이지 시작 부분 renderConsultations()
- 현재 바로 렌더링
- 나중에 API 응답을 기다린 뒤 렌더링 
*/


/* ---------------------------
   뒤로가기
--------------------------- */
function goBack() {
  location.href = "./MyPage.html";
}

/* ---------------------------
   상담 데이터 가져오기
   [현재] 로컬 스토리에 저장된 상담 신청 내역을 읽음


   [ 나중에 ]
    로컬 스토리 대신 실제 서버 API 데이터 연결 
--------------------------- */
function getConsultationData() {
  const saved = localStorage.getItem(CONSULT_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("상담 내역 파싱 실패:", error);
    return [];
  }
}

/* ---------------------------
   상태값 뱃지 클래스용 텍스트 정리
--------------------------- */
function getStatusClass(status) {
  if (status === "접수 완료") return "is-received";
  if (status === "검토 중") return "is-review";
  if (status === "상담 완료") return "is-done";
  return "is-default";
}

/* ---------------------------
   상담 카드 렌더링


  [현재] ]
  - getConsultationData() 가 돌려준 배열을 화면에 출력

  [ 나중에 실제 API 연결 시 ] 
  - renderConsultations() 자체는 대부분 그대로 사용 가능 
  - getConsultationData() 가 async 함수가 되면 renderConsultations()도 async로 바꾸는 것이 편함  

  [ 주의 ]
  - 키 이름은 API 응답 필드명과 맞아야 한다.
--------------------------- */
function renderConsultations() {
  const data = getConsultationData();
  consultList.innerHTML = "";

  if (!data.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  data.forEach((item) => {
    const div = document.createElement("div");
    div.className = "consult-item";

    div.innerHTML = `
      <div class="consult-top">
        <div class="consult-title-wrap">
          <div class="consult-title">${item.title || "신청 내역"}</div>
        </div>
        <div class="consult-status ${getStatusClass(item.status)}">
          ${item.status || "접수 완료"}
        </div>
      </div>

      <div class="consult-meta">${item.date || "-"}</div>

      <div class="consult-content">
        <div><strong>기관/학교/회사명 : </strong> ${item.organization || "-"}</div>
        <div><strong>담당자명 : </strong> ${item.manager || "-"}</div>
        <div><strong>연락처 : </strong> ${item.phone || "-"}</div>
        <div><strong>이메일 : </strong> ${item.email || "-"}</div>
        <div><strong>교육 대상 : </strong> ${item.target || "-"}</div>
        <div><strong>진행 방식 : </strong> ${item.method || "-"}</div>
        <div><strong>문의 내용 : </strong> ${item.inquiry || item.content || "-"}</div>
      </div>
    `;

    consultList.appendChild(div);
  });
}

/* ---------------------------
   페이지 시작

  [ 현재 ]
  - 로컬 스토리 데이터 바로 렌더링

  [ 나중에 ]
  - API 응답을 받은 뒤 렌더링 하도록 
--------------------------- */
renderConsultations();