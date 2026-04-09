//마이 페이지 js

/*
[ API 연결 예정 메모 ]
현재 kode24_login_user 기준으로 로그인 여부 확인

나중에 실제 API 연결 시 핵심 변경 위치
1) loginUser 가져오는 부분 => 로그인 확인 API 또는 토큰 검사로 변경
2) 로그인 사용자 표시 부분 => 내 정보 조회 API
3) 로그아웃 버튼 클릭 부분 => 로그아웃 API + 토큰 삭제


*/

//정보 불러오기
const LOGIN_USER_KEY = "kode24_login_user";
const appToast = document.getElementById("appToast");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const logoutBtn = document.getElementById("logoutBtn");
const menuCards = document.querySelectorAll(".menu-card");

function showToast(message){
    appToast.textContent = message;
    appToast.classList.add("show");

    clearTimeout(appToast._toastTimer);
    appToast._toastTimer = setTimeout(() => {
        appToast.classList.remove("show");
    }, 1800);
}


const loginUser = JSON.parse(localStorage.getItem(LOGIN_USER_KEY) || "null");

//로그인 안되어 있으면 로그인 페이지로 보냄
if (!loginUser || !loginUser.isLoggedIn) {
    showToast("로그인이 필요합니다.");
    setTimeout(() => {
        location.href = "../Login.html";
    }, 500);
}

//로그인 정보 표시
if (loginUser && loginUser.isLoggedIn) {
    profileName.textContent = `${loginUser.name}님`;
    profileEmail.textContent = loginUser.email;
}

//메뉴 클릭
menuCards.forEach((card) => {
    card.addEventListener("click", () => {
        const link = card.dataset.link;

        if (!link) {
            showToast("이동할 페이지가 없습니다.");
            return;
        }

        location.href = link;
    });
});

//로그아웃
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(LOGIN_USER_KEY);
    showToast("로그아웃 되었습니다.");

    setTimeout(() => {
        location.href = "../Home.html";
    }, 700);
});