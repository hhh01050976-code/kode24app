//자가진단 결과 페이지 js


/*
localStorage(kode24_diagnosis_result)에서 결과 데이터 가져오고
renderResult()에서 화면 렌더링 

나중에 실제 API 연결
1) getResultData() 
2) renderResult()



*/

//DOM 요소 가지고 오기
const RESULT_KEY = "kode24_diagnosis_result"; //로컬 스토리에 저장된 자가진단 결과를 꺼내기 위한 키
const resultContent = document.getElementById("resultContent"); //결과를 출력할 영역
const emptyState = document.getElementById("emptyState"); //결과가 없을때 보여줄 빈 영역


//뒤로가기
function goBack() {
    location.href="./MyPage.html";
}

//저장된 결과 데이터 가지고 오기 | 만약 데이터가 없다면 null로 반환하도록
function getResultData() {
    const saved = localStorage.getItem(RESULT_KEY);
    if (!saved) return null;

    try {
        return JSON.parse(saved);
    }catch (error) {
        console.error("결과 데이터 파싱 실패:", error);
        return null;
    }
}


//위험도에 따라 CSS 클래스명 반환해서 다르게 보여주기 
function getRiskClass(riskLevel){
    if (riskLevel === "고위험")  return "risk-high";
    if (riskLevel === "주의") return "risk-mid";
    if (riskLevel === "저위험") return "risk-low";
    return "risk-default";
}



//결과 화면 렌더링 카드 형태로 출력 
function renderResult() {
    const data = getResultData();

    if(!data) {
        emptyState.classList.remove("hidden");
        resultContent.innerHTML = "";
        return;
    }

    emptyState.classList.add("hidden");

    const answersHtml = (data.answers || [] )
        .map((item) => {
            return `
            <div class="answer-item">
                <div class="answer-question-label">AI 질문 : <div>
                <div class="answer-question">${item.question || "-"}</div>

                <div class="answer-choice-label">선택 : </div>
                <div class="answer-choice">${item.answer || "-"}</div>
            </div>
            `;
        })
        .join("");

    resultContent.innerHTML =`
    <div class="summary-title">최근 진단 결과</div>

    <div class="summary-box">
        <div class="section-title">진단 일시</div>
        <span class="result-date">${data.date || data.data ||"-"}</span>
    </div>


    <div class="summary-box">
        <div class="section-title">위험도</div>
        <span class="risk-badge ${getRiskClass(data.riskLevel)}">
        ${data.riskLevel || "판단 전"}
        </span>
        <div class="section-desc">
        ${data.summary || "-"}
        </div>
    </div>

    <div class="answer-box">
        <div class="section-title">선택 내용 요약</div>
        <div class="section-desc">
        ${answersHtml}
        </div>
    </div>

    <div class="final-box">
        <div class="section-title">최종 결과</div>
        <div class="final-text">
        ${data.finalText || "-"}
        </div>
    </div>
    `;
}

//페이지 초기 실행
//현재 localStorage 데이터 바로 렌더링 
//나중에 API 호출 후 renderReuslt 실행
// 한번 테스트한 이력이 있어도 다시 페이지를 들어간다면 초기 화면 보여주기 
renderResult();