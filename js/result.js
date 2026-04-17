//자가진단 결과 페이지 js

/*
localStorage(kode24_diagnosis_result)에서 결과 데이터 가져오고
renderResult()에서 화면 렌더링

나중에 실제 API 연결
1) getResultData()
2) renderResult()
*/

// DOM 요소 가지고 오기
const RESULT_KEY = "kode24_diagnosis_result"; // 로컬 스토리지에 저장된 자가진단 결과 키
const LOGIN_USER_KEY = "kode24_login_user";   // 로그인 사용자 정보 키

const resultContent = document.getElementById("resultContent"); // 결과 출력 영역
const emptyState = document.getElementById("emptyState");       // 결과 없을 때 보여줄 영역

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

// 뒤로가기
function goBack() {
        if (isLoggedIn()) {
            location.href = "./MyPage.html";
        } else {
            location.href = "../diagnosis/Self_Assessment.html";
        }
}

// 저장된 결과 데이터 가져오기
function getResultData() {
    const saved = localStorage.getItem(RESULT_KEY);
    if (!saved) return null;

    try {
        return JSON.parse(saved);
    } catch (error) {
        console.error("결과 데이터 파싱 실패:", error);
        return null;
    }
}

// 위험도에 따라 CSS 클래스명 반환
function getRiskClass(riskLevel) {
    if (riskLevel === "고위험") return "risk-high";
    if (riskLevel === "주의") return "risk-mid";
    if (riskLevel === "저위험") return "risk-low";
    return "risk-default";
}

function getMainResultTitle(riskLevel) {
    if (riskLevel === "고위험") return "즉시 대응이 필요한 상태입니다.";
    if (riskLevel === "주의") return "주의가 필요한 상태입니다.";
    if (riskLevel === "저위험") return "현재는 비교적 안정 상태입니다.";
    return "진단 결과를 불러왔습니다.";
}

function makeDonutChart(value, label) {
    return `
        <div class="stat-chart-card">
            <div class="stat-chart-title">${label}</div>
            <div class="donut" style="--value:${value}">
                <div class="donut-inner">${value}%</div>
            </div>
        </div>
    `;
}

// 결과 화면 렌더링
function renderResult() {
    // 비로그인 상태면 결과 페이지 접근 막기
    if (!isLoggedIn()) {
        location.replace("../Login.html");
        return;
    }

    const data = getResultData();

    if (!data) {
        emptyState.classList.remove("hidden");
        resultContent.innerHTML = "";
        return;
    }

    emptyState.classList.add("hidden");

    const answersHtml = (data.answers || [])
        .map((item) => {
            return `
                <div class="answer-item">
                    <div class="answer-question-label">AI 질문 :</div>
                    <div class="answer-question">${item.question || "-"}</div>

                    <div class="answer-choice-label">선택 :</div>
                    <div class="answer-choice">${item.answer || "-"}</div>
                </div>
            `;
        })
        .join("");

    const checklistHtml = (data.checklist || [])
        .map((item) => `<li>${item}</li>`)
        .join("");

    const blockRate = data.chartData?.blockRate ?? 0;
    const preventionRate = data.chartData?.preventionRate ?? 0;
    const responseRate = data.chartData?.responseRate ?? 0;

    resultContent.innerHTML = `
        <div class="summary-title">AI 자가진단 결과</div>

        <div class="summary-box">
            <div class="result-date-line">진단 일시 : ${data.date || "-"}</div>
        </div>

        <div class="hero-result-box">
            <div class="hero-left">
                <div class="hero-main-title">자가진단 완료<br><span>최종 결과</span></div>
                <div class="hero-quote-row">
                    <div class="hero-quote-mark">“</div>
                    <div class="hero-quote-text">
                        <div class="hero-summary">${getMainResultTitle(data.riskLevel)}</div>
                        <div class="hero-final">${data.finalText || "-"}</div>
                    </div>
                </div>
            </div>

            <div class="hero-right">
                <div class="hero-risk-line">
                    단계 : <span class="risk-badge ${getRiskClass(data.riskLevel)}">${data.riskLevel || "판단 전"}</span>
                </div>
                <div class="hero-prob-line">
                    유포 가능성 <span class="leak-value">${Number(data.leakProbability || 0).toFixed(2)}%</span>
                </div>
            </div>
        </div>

        <div class="summary-box">
            <div class="section-title">위험도 요약</div>
            <div class="section-desc">${data.summary || "-"}</div>
        </div>

        <div class="answer-box">
            <div class="section-title">선택 내용 요약</div>
            <div class="section-desc">${answersHtml}</div>
        </div>

        <div class="final-box">
            <div class="section-title">사후 점검 체크리스트</div>
            <ol class="checklist-list">
                ${checklistHtml}
            </ol>
        </div>
    `;
}

// 페이지 초기 실행
renderResult();